package db

import (
	"fmt"
	"log"
	"os"

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

	// Note: Auto-migrate has been disabled.
	// Schema definitions and seed data are now managed via raw SQL scripts in the /db directory.
	fmt.Println("Database connection established (schema managed via init scripts).")
}
