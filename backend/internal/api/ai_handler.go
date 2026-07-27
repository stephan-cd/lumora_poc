package api

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/lumora/backend/internal/ai"
)

type GenerateTextRequest struct {
	Prompt string `json:"prompt" binding:"required"`
}

func GenerateText(c *gin.Context) {
	var req GenerateTextRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	response, err := ai.GenerateText(req.Prompt)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"response": response})
}
