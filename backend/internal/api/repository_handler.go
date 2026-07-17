package api

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/lumora/backend/internal/db"
	"github.com/lumora/backend/internal/models"
)

func GetRepositories(c *gin.Context) {
	var repos []models.Repository
	if err := db.DB.Find(&repos).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, repos)
}

func CreateRepository(c *gin.Context) {
	var repo models.Repository
	if err := c.ShouldBindJSON(&repo); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := db.DB.Create(&repo).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, repo)
}
