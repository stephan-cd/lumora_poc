package db

import (
	"fmt"
	"log"
	"os"

	"github.com/lumora/backend/internal/models"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

func ConnectPostgres() {
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		dsn = "host=localhost user=lumora password=lumorapassword dbname=lumora_db port=5432 sslmode=disable"
	}

	var err error
	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to PostgreSQL:", err)
	}

	fmt.Println("Successfully connected to PostgreSQL.")

	// Auto-migrate the models
	err = DB.AutoMigrate(
		&models.Repository{},
		&models.Commit{},
		&models.Review{},
		&models.ReviewIssue{},
	)
	if err != nil {
		log.Fatal("Failed to auto-migrate database:", err)
	}

	fmt.Println("Database migration completed.")
}
