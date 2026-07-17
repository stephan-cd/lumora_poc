package ai

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"os"
	"strings"
)

type GroqMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type GroqRequest struct {
	Model       string        `json:"model"`
	Messages    []GroqMessage `json:"messages"`
	Temperature float32       `json:"temperature,omitempty"`
}

type GroqResponse struct {
	Choices []struct {
		Message struct {
			Content string `json:"content"`
		} `json:"message"`
	} `json:"choices"`
}

type EmbeddingRequest struct {
	Model  string `json:"model"`
	Prompt string `json:"prompt"`
}

type EmbeddingResponse struct {
	Embedding []float32 `json:"embedding"`
}

func GenerateEmbedding(text string) ([]float32, error) {
	reqBody := EmbeddingRequest{
		Model:  "nomic-embed-text",
		Prompt: text,
	}

	jsonData, err := json.Marshal(reqBody)
	if err != nil {
		return nil, err
	}

	resp, err := http.Post("http://localhost:11434/api/embeddings", "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("ollama embedding failed with status %d", resp.StatusCode)
	}

	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var embedResp EmbeddingResponse
	if err := json.Unmarshal(body, &embedResp); err != nil {
		return nil, err
	}

	return embedResp.Embedding, nil
}

func GenerateReview(diff string, rules []string) (string, error) {
	prompt := BuildReviewPrompt(diff, rules)

	apiKey := os.Getenv("GROQ_API_KEY")
	if apiKey == "" {
		return "", fmt.Errorf("GROQ_API_KEY environment variable is not set")
	}

	reqBody := GroqRequest{
		Model: "llama-3.3-70b-versatile",
		Messages: []GroqMessage{
			{
				Role:    "user",
				Content: prompt,
			},
		},
		Temperature: 0.2, // low temp for more factual reviews
	}

	jsonData, err := json.Marshal(reqBody)
	if err != nil {
		return "", err
	}

	req, err := http.NewRequest("POST", "https://api.groq.com/openai/v1/chat/completions", bytes.NewBuffer(jsonData))
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+apiKey)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := ioutil.ReadAll(resp.Body)
		return "", fmt.Errorf("Groq API failed with status %d: %s", resp.StatusCode, string(body))
	}

	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}

	var groqResp GroqResponse
	err = json.Unmarshal(body, &groqResp)
	if err != nil {
		return "", err
	}

	if len(groqResp.Choices) == 0 {
		return "", fmt.Errorf("no response choices returned from Groq API")
	}

	// Clean up potential markdown code blocks returned by LLM
	cleanJson := strings.TrimSpace(groqResp.Choices[0].Message.Content)
	if strings.HasPrefix(cleanJson, "```json") {
		cleanJson = strings.TrimPrefix(cleanJson, "```json")
		cleanJson = strings.TrimSuffix(cleanJson, "```")
	} else if strings.HasPrefix(cleanJson, "```") {
		cleanJson = strings.TrimPrefix(cleanJson, "```")
		cleanJson = strings.TrimSuffix(cleanJson, "```")
	}

	return strings.TrimSpace(cleanJson), nil
}
