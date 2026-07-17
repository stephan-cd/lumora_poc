package rag

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/google/uuid"
	"github.com/lumora/backend/internal/ai"
	"github.com/qdrant/go-client/qdrant"
)

var QdrantClient *qdrant.Client

const collectionName = "coding_rules"

func InitQdrant() {
	var err error
	QdrantClient, err = qdrant.NewClient(&qdrant.Config{
		Host: "localhost",
		Port: 6334, // gRPC port
	})
	if err != nil {
		log.Fatalf("Failed to connect to Qdrant: %v", err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Check if collection exists
	exists, err := QdrantClient.CollectionExists(ctx, collectionName)
	if err != nil {
		log.Fatalf("Failed to check collection: %v", err)
	}

	if !exists {
		err = QdrantClient.CreateCollection(ctx, &qdrant.CreateCollection{
			CollectionName: collectionName,
			VectorsConfig: qdrant.NewVectorsConfig(&qdrant.VectorParams{
				Size:     768, // nomic-embed-text vector size
				Distance: qdrant.Distance_Cosine,
			}),
		})
		if err != nil {
			log.Fatalf("Failed to create collection: %v", err)
		}
		log.Printf("Created Qdrant collection: %s", collectionName)
	}

	fmt.Println("Successfully connected to Qdrant Vector DB")
}

// StoreRule generates an embedding for the rule and stores it in Qdrant
func StoreRule(ctx context.Context, ruleText string, technology string) error {
	// 1. Generate Embedding
	vector, err := ai.GenerateEmbedding(ruleText)
	if err != nil {
		return fmt.Errorf("failed to generate embedding: %v", err)
	}

	// 2. Prepare Point
	id := uuid.New().String()
	point := &qdrant.PointStruct{
		Id:      qdrant.NewIDUUID(id),
		Vectors: qdrant.NewVectors(vector...),
		Payload: qdrant.NewValueMap(map[string]any{
			"text":       ruleText,
			"technology": technology,
		}),
	}

	// 3. Upsert into Qdrant
	_, err = QdrantClient.Upsert(ctx, &qdrant.UpsertPoints{
		CollectionName: collectionName,
		Points:         []*qdrant.PointStruct{point},
	})

	return err
}

// RetrieveRules performs a semantic search for coding rules based on technology
func RetrieveRules(ctx context.Context, diffText string, technology string, topK uint64) ([]string, error) {
	// 1. Truncate diffText to avoid context length limits for embedding models
	searchText := diffText
	if len(searchText) > 2000 {
		searchText = searchText[:2000]
	}

	// 2. Convert the truncated text into a vector to find matching rules
	queryVector, err := ai.GenerateEmbedding(searchText)
	if err != nil {
		return nil, fmt.Errorf("failed to generate search embedding: %v", err)
	}

	// 2. Query Qdrant with a payload filter for the specific technology
	searchResult, err := QdrantClient.Query(ctx, &qdrant.QueryPoints{
		CollectionName: collectionName,
		Query:          qdrant.NewQuery(queryVector...),
		Filter: &qdrant.Filter{
			Must: []*qdrant.Condition{
				qdrant.NewMatch("technology", technology),
			},
		},
		Limit:       &topK,
		WithPayload: qdrant.NewWithPayload(true),
	})
	if err != nil {
		return nil, err
	}

	var rules []string
	for _, point := range searchResult {
		payload := point.GetPayload()
		if textVal, ok := payload["text"]; ok {
			rules = append(rules, textVal.GetStringValue())
		}
	}

	return rules, nil
}
