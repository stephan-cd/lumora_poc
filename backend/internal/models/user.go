package models

// User represents the Prisma User model in the Next.js database.
// We only map the fields we need to query for linking commits.
type User struct {
	ID             string `gorm:"column:id;primaryKey" json:"id"`
	Name           string `gorm:"column:name" json:"name"`
	GithubUsername string `gorm:"column:githubUsername" json:"githubUsername"`
	UseLocalLLM    bool   `gorm:"column:useLocalLLM" json:"useLocalLLM"`
}

// TableName overrides the table name used by User to exactly match Prisma's output
func (User) TableName() string {
	return "User"
}
