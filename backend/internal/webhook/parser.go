package webhook

import (
	"context"
	"encoding/json"
	"log"
	"strings"

	"github.com/lumora/backend/internal/ai"
	"github.com/lumora/backend/internal/db"
	"github.com/lumora/backend/internal/github"
	"github.com/lumora/backend/internal/models"
	"github.com/lumora/backend/internal/rag"
)

// ProcessCommit asynchronously fetches the git diff, queries RAG, and gets the AI review
func ProcessCommit(repositoryFullName, commitHash, author string) {
	log.Printf("Starting async processing for commit %s in repo %s by %s", commitHash, repositoryFullName, author)

	// DB Setup: Find or Create Repository
	var repo models.Repository
	db.DB.Where("name = ?", repositoryFullName).FirstOrCreate(&repo, models.Repository{
		Name:     repositoryFullName,
		Provider: "github",
		URL:      "https://github.com/" + repositoryFullName,
	})

	// DB Setup: Check for User
	var user models.User
	var userID *string
	if err := db.DB.Where("\"githubUsername\" = ?", author).First(&user).Error; err == nil {
		userID = &user.ID
		log.Printf("Linked commit to User %s", user.ID)
	}

	// DB Setup: Create Commit
	commit := models.Commit{
		RepositoryID: repo.ID,
		CommitHash:   commitHash,
		Branch:       "main", // default for now
		Author:       author,
		UserID:       userID,
	}
	db.DB.Create(&commit)

	// DB Setup: Create Initial Review
	review := models.Review{
		CommitID: commit.ID,
		Status:   "processing",
	}
	db.DB.Create(&review)

	// 1. Fetch the actual diff from GitHub REST API
	rawDiff, err := github.FetchCommitDiff(repositoryFullName, commitHash)
	if err != nil {
		log.Printf("Failed to fetch diff from GitHub for %s: %v", commitHash, err)
		db.DB.Model(&review).Update("status", "failed")
		return
	}

	// 2. Strip binary files and images from the diff to save tokens
	cleanDiff := filterDiff(rawDiff)
	db.DB.Model(&review).Update("diff", cleanDiff)

	// 3. Detect Technology (simplified)
	technology := detectTechnology(cleanDiff)
	log.Printf("Detected technology: %s", technology)

	// 4. RAG Retrieval (Qdrant call)
	rules, err := rag.RetrieveRules(context.Background(), cleanDiff, technology, 5)
	if err != nil {
		log.Printf("Failed to retrieve rules from Qdrant: %v", err)
		rules = []string{"Follow standard clean code practices"} // fallback
	} else if len(rules) == 0 {
		log.Printf("No specific rules found in Qdrant for %s", technology)
	}

	// 5. Generate AI Review
	reviewJSON, err := ai.GenerateReview(cleanDiff, rules)
	if err != nil {
		log.Printf("Failed to generate AI review for %s: %v", commitHash, err)
		db.DB.Model(&review).Update("status", "failed")
		return
	}

	// 6. Persist to Database
	var issues []models.ReviewIssue
	if err := json.Unmarshal([]byte(reviewJSON), &issues); err != nil {
		log.Printf("Failed to parse AI review JSON: %v. JSON: %s", err, reviewJSON)
		db.DB.Model(&review).Update("status", "failed")
		return
	}

	for i := range issues {
		issues[i].ReviewID = review.ID
	}
	
	if len(issues) > 0 {
		db.DB.Create(&issues)
	}

	score := 100 - (len(issues) * 5)
	if score < 0 {
		score = 0
	}

	db.DB.Model(&review).Updates(map[string]interface{}{
		"status": "completed",
		"score":  score,
	})

	log.Printf("Successfully generated and saved AI review for %s. Score: %d", commitHash, score)
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

// filterDiff removes useless lines (like binary file changes) from the raw diff
func filterDiff(rawDiff string) string {
	lines := strings.Split(rawDiff, "\n")
	var filtered []string
	
	for _, line := range lines {
		if strings.Contains(line, "Binary files") || strings.Contains(line, "GIT binary patch") {
			continue
		}
		filtered = append(filtered, line)
	}

	return strings.Join(filtered, "\n")
}

func detectTechnology(diff string) string {
	if strings.Contains(diff, ".js ") || strings.Contains(diff, ".js\n") || strings.Contains(diff, ".jsx ") || strings.Contains(diff, ".jsx\n") || strings.Contains(diff, ".ts ") || strings.Contains(diff, ".ts\n") || strings.Contains(diff, ".tsx ") || strings.Contains(diff, ".tsx\n") {
		return "JavaScript"
	}
	if strings.Contains(diff, ".go ") || strings.Contains(diff, ".go\n") {
		return "Go"
	}
	if strings.Contains(diff, ".kt ") || strings.Contains(diff, ".kt\n") {
		return "Kotlin"
	}
	if strings.Contains(diff, ".py ") || strings.Contains(diff, ".py\n") {
		return "Python"
	}
	return "General"
}
