package api

import (
	"github.com/gin-gonic/gin"
)

func SetupRoutes(r *gin.Engine) {
	v1 := r.Group("/api/v1")
	{
		// Repository endpoints
		v1.GET("/repositories", GetRepositories)
		v1.POST("/repositories", CreateRepository)

		// Rule endpoints (Qdrant Vector DB)
		v1.POST("/rules", CreateRule)

		// Review endpoints
		v1.GET("/reviews", GetReviews)
		v1.GET("/reviews/:id", GetReviewByID)

		// Webhook endpoints
		webhooks := r.Group("/webhooks")
		{
			webhooks.POST("/github", HandleGitHubWebhook)
		}
	}
}
