package ai

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"os"
	"strings"
	"time"
)

type LLMMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type LLMRequest struct {
	Model       string       `json:"model"`
	Messages    []LLMMessage `json:"messages"`
	Temperature float32      `json:"temperature,omitempty"`
}

type LLMResponse struct {
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

func GenerateReview(diff string, rules []string, useLocalLLM bool) (string, error) {
	prompt := BuildReviewPrompt(diff, rules)

	fmt.Printf("\n[LLM] ================= PROMPT =================\n%s\n==========================================\n\n", prompt)

	var req *http.Request
	var err error

	if useLocalLLM {
		// Using Local LLM API.
		reqBody := LLMRequest{
			Model: "qwen2:0.5b",
			Messages: []LLMMessage{
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

		req, err = http.NewRequest("POST", "http://localhost:11434/v1/chat/completions", bytes.NewBuffer(jsonData))
		if err != nil {
			return "", err
		}
		req.Header.Set("Content-Type", "application/json")
		fmt.Println("[LLM] Sending request to Local LLM (qwen2:0.5b)...")
	} else {
		// Using Groq API.
		reqBody := LLMRequest{
			Model: "llama-3.3-70b-versatile",
			Messages: []LLMMessage{
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

		req, err = http.NewRequest("POST", "https://api.groq.com/openai/v1/chat/completions", bytes.NewBuffer(jsonData))
		if err != nil {
			return "", err
		}
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer "+os.Getenv("GROQ_API_KEY"))
		fmt.Println("[LLM] Sending request to Groq (llama-3.3-70b-versatile)...")
	}

	client := &http.Client{
		Timeout: 2 * time.Minute,
	}
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := ioutil.ReadAll(resp.Body)
		return "", fmt.Errorf("LLM API failed with status %d: %s", resp.StatusCode, string(body))
	}

	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}

	var llmResp LLMResponse
	err = json.Unmarshal(body, &llmResp)
	if err != nil {
		return "", err
	}

	if len(llmResp.Choices) == 0 {
		return "", fmt.Errorf("no response choices returned from Local LLM API")
	}

	rawOutput := llmResp.Choices[0].Message.Content
	fmt.Printf("\n[LLM] ================= OUTPUT =================\n%s\n==========================================\n\n", rawOutput)

	// Clean up potential markdown code blocks returned by LLM
	cleanJson := strings.TrimSpace(llmResp.Choices[0].Message.Content)
	if strings.HasPrefix(cleanJson, "```json") {
		cleanJson = strings.TrimPrefix(cleanJson, "```json")
		cleanJson = strings.TrimSuffix(cleanJson, "```")
	} else if strings.HasPrefix(cleanJson, "```") {
		cleanJson = strings.TrimPrefix(cleanJson, "```")
		cleanJson = strings.TrimSuffix(cleanJson, "```")
	}

	return strings.TrimSpace(cleanJson), nil
}

func GenerateText(prompt string, useLocalLLM bool) (string, error) {
	fmt.Printf("\n[LLM] ================= TEXT GENERATION PROMPT =================\n%s\n==========================================\n\n", prompt)

	var req *http.Request
	var err error

	if useLocalLLM {
		reqBody := LLMRequest{
			Model: "qwen2:0.5b",
			Messages: []LLMMessage{
				{
					Role:    "user",
					Content: prompt,
				},
			},
			Temperature: 0.7,
		}

		jsonData, err := json.Marshal(reqBody)
		if err != nil {
			return "", err
		}

		req, err = http.NewRequest("POST", "http://localhost:11434/v1/chat/completions", bytes.NewBuffer(jsonData))
		if err != nil {
			return "", err
		}
		req.Header.Set("Content-Type", "application/json")
		fmt.Println("[LLM] Sending text generation request to Local LLM (qwen2:0.5b)...")
	} else {
		reqBody := LLMRequest{
			Model: "llama-3.3-70b-versatile",
			Messages: []LLMMessage{
				{
					Role:    "user",
					Content: prompt,
				},
			},
			Temperature: 0.7,
		}

		jsonData, err := json.Marshal(reqBody)
		if err != nil {
			return "", err
		}

		req, err = http.NewRequest("POST", "https://api.groq.com/openai/v1/chat/completions", bytes.NewBuffer(jsonData))
		if err != nil {
			return "", err
		}
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer "+os.Getenv("GROQ_API_KEY"))
		fmt.Println("[LLM] Sending text generation request to Groq (llama-3.3-70b-versatile)...")
	}

	client := &http.Client{
		Timeout: 2 * time.Minute,
	}
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := ioutil.ReadAll(resp.Body)
		return "", fmt.Errorf("Local LLM API failed with status %d: %s", resp.StatusCode, string(body))
	}

	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}

	var llmResp LLMResponse
	err = json.Unmarshal(body, &llmResp)
	if err != nil {
		return "", err
	}

	if len(llmResp.Choices) == 0 {
		return "", fmt.Errorf("no response choices returned from Local LLM API")
	}

	fmt.Println("[LLM] Successfully received text response from Local LLM!")

	rawOutput := llmResp.Choices[0].Message.Content
	fmt.Printf("\n[LLM] ================= TEXT GENERATION OUTPUT =================\n%s\n==========================================\n\n", rawOutput)

	return strings.TrimSpace(rawOutput), nil
}
