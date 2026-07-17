package api

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/lumora/backend/internal/rag"
)

type CreateRuleRequest struct {
	Text       string `json:"text" binding:"required"`
	Technology string `json:"technology" binding:"required"`
}

// CreateRule handles POST requests to generate an embedding for a rule and store it in Qdrant
func CreateRule(c *gin.Context) {
	var req CreateRuleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Store rule into Vector DB
	err := rag.StoreRule(c.Request.Context(), req.Text, req.Technology)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to store rule in Qdrant: " + err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"status": "success", "message": "Rule embedded and stored successfully"})
}
