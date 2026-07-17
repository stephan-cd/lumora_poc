package api

import (
	"encoding/json"
	"io/ioutil"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/lumora/backend/internal/webhook"
)

// GitHubPushPayload represents a simplified push event payload
type GitHubPushPayload struct {
	Ref        string `json:"ref"`
	After      string `json:"after"` // The commit hash
	Repository struct {
		FullName string `json:"full_name"`
	} `json:"repository"`
	Pusher struct {
		Name string `json:"name"`
	} `json:"pusher"`
	HeadCommit *struct {
		Author struct {
			Username string `json:"username"`
		} `json:"author"`
	} `json:"head_commit"`
}

func HandleGitHubWebhook(c *gin.Context) {
	// Verify event type
	eventType := c.GetHeader("X-GitHub-Event")
	if eventType != "push" {
		c.JSON(http.StatusOK, gin.H{"message": "Event ignored. Only push events are processed."})
		return
	}

	body, err := ioutil.ReadAll(c.Request.Body)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to read body"})
		return
	}

	log.Printf("Received GitHub Webhook Payload: %s\n", string(body))

	var payload GitHubPushPayload
	if err := json.Unmarshal(body, &payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid JSON payload"})
		return
	}

	if payload.After == "" || payload.After == "0000000000000000000000000000000000000000" {
		c.JSON(http.StatusOK, gin.H{"message": "No valid commit hash found in push event."})
		return
	}

	author := payload.Pusher.Name
	if payload.HeadCommit != nil && payload.HeadCommit.Author.Username != "" {
		author = payload.HeadCommit.Author.Username
	}

	// Fire and forget (Goroutine for async processing)
	// We pass the parsed repo name and commit hash so the worker can fetch the diff using the GitHub API
	go webhook.ProcessCommit(payload.Repository.FullName, payload.After, author)

	c.JSON(http.StatusAccepted, gin.H{"status": "accepted", "message": "Push event received. Processing commit asynchronously."})
}
