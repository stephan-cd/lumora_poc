package api

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/lumora/backend/internal/db"
	"github.com/lumora/backend/internal/models"
)

func GetReviews(c *gin.Context) {
	var reviews []models.Review
	if err := db.DB.Preload("Commit.Repository").Preload("Commit").Preload("Issues").Order("created_at desc").Find(&reviews).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, reviews)
}

func GetReviewByID(c *gin.Context) {
	id := c.Param("id")
	var review models.Review
	if err := db.DB.Preload("Commit.Repository").Preload("Commit").Preload("Issues").First(&review, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Review not found"})
		return
	}
	c.JSON(http.StatusOK, review)
}
