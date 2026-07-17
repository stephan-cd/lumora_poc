package main

import (
	"log"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"github.com/lumora/backend/internal/api"
	"github.com/lumora/backend/internal/db"
	"github.com/lumora/backend/internal/rag"
)

func main() {
	// Load environment variables if .env exists
	_ = godotenv.Load()

	// Initialize database connection
	db.ConnectPostgres()

	// Initialize Qdrant Client
	rag.InitQdrant()

	// Initialize Gin router
	r := gin.Default()

	// Configure CORS
	r.Use(cors.Default())

	// Health Check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status": "ok",
		})
	})

	// Register API routes
	api.SetupRoutes(r)

	// Start Server
	port := "8080"
	log.Printf("Server starting on port %s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}
