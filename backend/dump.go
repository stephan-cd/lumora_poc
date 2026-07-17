package main

import (
	"fmt"
	"log"
	

	"github.com/lumora/backend/internal/models"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func main() {
	dsn := "host=localhost user=lumora password=lumorapassword dbname=lumora_db port=5433 sslmode=disable"
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal(err)
	}

	var reviews []models.Review
	db.Order("created_at desc").Limit(5).Find(&reviews)
	
	fmt.Println("Recent Reviews:")
	for _, r := range reviews {
		var count int64
		db.Model(&models.ReviewIssue{}).Where("review_id = ?", r.ID).Count(&count)
		fmt.Printf("Review ID: %s, Commit ID: %s, Status: %s, Score: %d, Issues Count: %d\n", r.ID, r.CommitID, r.Status, r.Score, count)
	}
}
