package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Repository struct {
	ID            uuid.UUID      `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	Name          string         `gorm:"not null" json:"name"`
	URL           string         `gorm:"not null" json:"url"`
	Provider      string         `gorm:"not null" json:"provider"` // github, bitbucket
	DefaultBranch string         `gorm:"default:'main'" json:"default_branch"`
	AIEnabled     bool           `gorm:"default:true" json:"ai_enabled"`
	CreatedAt     time.Time      `json:"created_at"`
	UpdatedAt     time.Time      `json:"updated_at"`
	DeletedAt     gorm.DeletedAt `gorm:"index" json:"-"`
}

type Commit struct {
	ID           uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	RepositoryID uuid.UUID `gorm:"type:uuid;not null" json:"repository_id"`
	CommitHash   string    `gorm:"not null;index" json:"commit_hash"`
	Branch       string    `gorm:"not null" json:"branch"`
	Author       string    `gorm:"not null" json:"author"`
	Message      string    `json:"message"`
	CreatedAt    time.Time `json:"created_at"`
	UserID       *string   `gorm:"index" json:"user_id"`

	Repository Repository `gorm:"foreignKey:RepositoryID" json:"repository"`
}
