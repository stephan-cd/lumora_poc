package main

import (
	"fmt"
	"log"

	"github.com/lumora/backend/internal/db"
	"github.com/lumora/backend/internal/models"
)

func main() {
	db.InitDB()
	var user models.User
	// Assuming there's a user, grab the first one
	err := db.DB.Debug().First(&user).Error
	if err != nil {
		log.Fatal(err)
	}
	fmt.Printf("User: %+v\n", user)
}
