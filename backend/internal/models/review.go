package models

import (
	"time"

	"github.com/google/uuid"
)

type Review struct {
	ID        uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	CommitID  uuid.UUID `gorm:"type:uuid;not null" json:"commit_id"`
	Status    string    `gorm:"not null;default:'pending'" json:"status"` // pending, processing, completed, failed
	Score     int       `gorm:"default:0" json:"score"`
	Diff      string    `json:"diff"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`

	Commit Commit `gorm:"foreignKey:CommitID" json:"commit"`
	Issues []ReviewIssue `gorm:"foreignKey:ReviewID" json:"issues"`
}

type ReviewIssue struct {
	ID             uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	ReviewID       uuid.UUID `gorm:"type:uuid;not null;index" json:"review_id"`
	FilePath       string    `gorm:"not null" json:"file_path"`
	LineNumber     int       `json:"line_number"`
	Severity       string    `gorm:"not null" json:"severity"` // high, medium, low
	RuleViolated   string    `json:"rule_violated"`
	Explanation    string    `json:"explanation"`
	Recommendation string    `json:"recommendation"`
	SuggestedFix   string    `json:"suggested_fix"`
	Resolved       bool      `gorm:"default:false" json:"resolved"`
	CreatedAt      time.Time `json:"created_at"`
}
