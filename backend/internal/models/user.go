package models

// User represents the Prisma User model in the Next.js database.
// We only map the fields we need to query for linking commits.
type User struct {
	ID             string `gorm:"column:id;primaryKey"`
	GithubUsername string `gorm:"column:githubUsername"`
}

// TableName overrides the table name used by User to exactly match Prisma's output
func (User) TableName() string {
	return "User"
}
