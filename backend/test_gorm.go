package main

import (
	"fmt"
	"log"
	"os"
	"strings"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

type User struct {
	ID             string `gorm:"column:id;primaryKey"`
	GithubUsername string `gorm:"column:githubUsername"`
	UseLocalLLM    bool   `gorm:"column:useLocalLLM"`
}

func (User) TableName() string {
	return "User"
}

func main() {
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		dsn = "postgresql://lumora:lumorapassword@localhost:5433/lumora_db"
	}
	dsn = strings.ReplaceAll(dsn, "?schema=public", "")
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal(err)
	}

	var user User
	err = db.Debug().Where("\"githubUsername\" = ?", "StephanJohnKennadi").First(&user).Error
	if err != nil {
		log.Fatal(err)
	}
	fmt.Printf("User: %+v\n", user)
}
