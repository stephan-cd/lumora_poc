package api

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/lumora/backend/internal/ai"
	"github.com/lumora/backend/internal/db"
	"github.com/lumora/backend/internal/models"
)

func GetReviews(c *gin.Context) {
	var reviews []models.Review
	if err := db.DB.Preload("Commit.Repository").Preload("Commit.User").Preload("Commit").Preload("Issues").Order("created_at desc").Find(&reviews).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, reviews)
}

func GetReviewByID(c *gin.Context) {
	id := c.Param("id")
	var review models.Review
	if err := db.DB.Preload("Commit.Repository").Preload("Commit.User").Preload("Commit").Preload("Issues").First(&review, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Review not found"})
		return
	}
	c.JSON(http.StatusOK, review)
}

func HandleFileUploadReview(c *gin.Context) {
	// 1. Get useLocalLLM preference
	useLocalLLMStr := c.PostForm("useLocalLLM")
	useLocalLLM := useLocalLLMStr == "true"

	// 2. Parse Multipart form
	form, err := c.MultipartForm()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to parse multipart form data"})
		return
	}

	files := form.File["files"]
	if len(files) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No files uploaded"})
		return
	}

	// High-risk extensions to block
	blockedExtensions := []string{".exe", ".dll", ".bat", ".sh", ".bin", ".msi", ".cmd", ".vbs", ".ps1", ".so", ".dylib", ".apk", ".ipa"}

	type FileReviewResult struct {
		Filename string               `json:"filename"`
		Error    string               `json:"error,omitempty"`
		Issues   []models.ReviewIssue `json:"issues,omitempty"`
	}

	var results []FileReviewResult

	for _, fileHeader := range files {
		res := FileReviewResult{Filename: fileHeader.Filename}

		// Security: Check extension
		isBlocked := false
		lowerName := strings.ToLower(fileHeader.Filename)
		for _, ext := range blockedExtensions {
			if strings.HasSuffix(lowerName, ext) {
				isBlocked = true
				break
			}
		}

		if isBlocked {
			res.Error = "Security Exception: High-risk file type not allowed."
			results = append(results, res)
			continue
		}

		// Security: Open file and check size/binary content
		if fileHeader.Size > 5*1024*1024 { // 5MB limit per file
			res.Error = "File too large. Maximum size is 5MB."
			results = append(results, res)
			continue
		}

		file, err := fileHeader.Open()
		if err != nil {
			res.Error = "Failed to open file"
			results = append(results, res)
			continue
		}

		buf := new(bytes.Buffer)
		buf.ReadFrom(file)
		file.Close()
		contentBytes := buf.Bytes()

		// Security: Check for null bytes (simple binary check)
		isBinary := false
		for _, b := range contentBytes {
			if b == 0 {
				isBinary = true
				break
			}
		}

		if isBinary {
			res.Error = "Security Exception: Binary content detected. Only text source code is allowed."
			results = append(results, res)
			continue
		}

		content := string(contentBytes)

		// RAG Rules - simple fallback for direct file
		rules := []string{"Follow standard clean code practices", "Ensure no critical security vulnerabilities like eval()"}

		// Format file as diff pseudo-format so the LLM understands it
		pseudoDiff := fmt.Sprintf("diff --git a/%s b/%s\nnew file mode 100644\n--- /dev/null\n+++ b/%s\n%s", fileHeader.Filename, fileHeader.Filename, fileHeader.Filename, content)

		// Generate AI Review
		reviewJSON, err := ai.GenerateReview(pseudoDiff, rules, useLocalLLM)
		if err != nil {
			res.Error = fmt.Sprintf("AI Processing failed: %v", err)
			results = append(results, res)
			continue
		}

		var issues []models.ReviewIssue
		if err := json.Unmarshal([]byte(reviewJSON), &issues); err != nil {
			res.Error = "Failed to parse AI review JSON"
			results = append(results, res)
			continue
		}

		res.Issues = issues
		results = append(results, res)
	}

	c.JSON(http.StatusOK, gin.H{"results": results})
}
