package api

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/lumora/backend/internal/ai"
)

type GenerateTextRequest struct {
	Prompt      string `json:"prompt" binding:"required"`
	UseLocalLLM bool   `json:"useLocalLLM"`
}

func GenerateText(c *gin.Context) {
	var req GenerateTextRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Add log to track UseLocalLLM flag
	log.Printf("[AI Handler] GenerateText called. UseLocalLLM from frontend: %v", req.UseLocalLLM)

	response, err := ai.GenerateText(req.Prompt, req.UseLocalLLM)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"response": response})
}
