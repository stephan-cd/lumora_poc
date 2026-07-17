package github

import (
	"fmt"
	"io/ioutil"
	"net/http"
	"os"
)

// FetchCommitDiff calls the GitHub REST API to get the raw diff for a specific commit
func FetchCommitDiff(repoFullName string, commitHash string) (string, error) {
	url := fmt.Sprintf("https://api.github.com/repos/%s/commits/%s", repoFullName, commitHash)

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return "", err
	}

	// Request the raw diff format instead of JSON
	req.Header.Set("Accept", "application/vnd.github.v3.diff")
	req.Header.Set("X-GitHub-Api-Version", "2022-11-28")

	// Inject the PAT if available in .env
	pat := os.Getenv("GITHUB_ACCESS_TOKEN")
	if pat != "" {
		req.Header.Set("Authorization", "Bearer "+pat)
	}

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("GitHub API returned status: %d", resp.StatusCode)
	}

	diffBytes, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}

	return string(diffBytes), nil
}
