package ai

import "fmt"

func BuildReviewPrompt(diff string, rules []string) string {
	prompt := "You are an expert AI Code Reviewer.\n\n"
	prompt += "Review the following git diff against the provided organizational coding rules.\n"
	prompt += "Return the response strictly as a JSON array of issues.\n\n"

	prompt += "Coding Rules:\n"
	for _, rule := range rules {
		prompt += fmt.Sprintf("- %s\n", rule)
	}

	prompt += "\nGit Diff:\n"
	prompt += diff

	prompt += `

Expected JSON format:
[
  {
    "file_path": "path/to/file",
    "line_number": 12,
    "severity": "high",
    "rule_violated": "Rule Name",
    "explanation": "Why this is an issue",
    "recommendation": "How to fix it",
    "suggested_fix": "code snippet"
  }
]
Ensure the output is ONLY valid JSON without any markdown formatting.
`
	return prompt
}
