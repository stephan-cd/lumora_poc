# AI Code Review Platform (V1)

An event-driven, full-stack AI Code Review Platform. It listens to GitHub Webhooks, generates code embeddings to retrieve custom coding rules from a Qdrant Vector Database, and uses Groq's fast inference API with Llama 3.3 70B to generate strict JSON code reviews.

## 🛠️ Prerequisites

Before you begin, ensure you have the following installed on your system:
- **Go** (v1.21+) - For the backend API
- **Node.js** (v18+) & **npm** - For the Next.js frontend
- **Docker** & **Docker Compose** - For PostgreSQL and Qdrant
- **Ollama** - For running the local embedding model
- **ngrok** (Optional) - For exposing your local server to real GitHub webhooks

## 📥 1. Setup Local AI Models
Open your terminal and pull the required models via Ollama. 
*(Ensure the Ollama desktop app is running in the background before executing these).*
```bash
# Pull the embedding model used for Qdrant Vector Search
ollama pull nomic-embed-text
```

## 🐳 2. Start the Databases
We need to start PostgreSQL (for relational data) and Qdrant (for vector embeddings). 
Run the following Docker commands in your terminal:

```bash
# Start Qdrant Vector DB
docker run -d -p 6333:6333 -p 6334:6334 --name qdrant qdrant/qdrant

# Start PostgreSQL DB
docker run -d -p 5432:5432 -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgrespassword -e POSTGRES_DB=lumora --name postgres postgres
```

## ⚙️ 3. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create a `.env` file in the `backend` folder:
   ```env
   # backend/.env
   GITHUB_ACCESS_TOKEN=your_github_personal_access_token
   DATABASE_URL=host=localhost user=postgres password=postgrespassword dbname=lumora port=5432 sslmode=disable
   GROQ_API_KEY=your_groq_api_key
   ```
3. Install Go dependencies and run the server:
   ```bash
   go mod tidy
   go run cmd/server/main.go
   ```
   *The Go API will start on `http://localhost:8080`.*

## 🎨 4. Frontend Setup
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Create a `.env` file in the `frontend` folder:
   ```env
   DATABASE_URL="postgresql://postgres:postgrespassword@localhost:5432/lumora?schema=public"
   NEXTAUTH_SECRET="your_nextauth_secret"
   NEXTAUTH_URL="http://localhost:3000"
   GROQ_API_KEY="your_groq_api_key"
   ```
3. Install the Next.js dependencies, setup Prisma, and start the development server:
   ```bash
   npm install
   npx prisma generate
   npx prisma db push
   npm run dev
   ```
   *The Next.js dashboard will be accessible at `http://localhost:3000`.*

## 🚀 5. How to Test the Platform

### Step 1: Add a Coding Rule to Qdrant
Seed your Vector Database with a custom organizational rule using the REST API. (You can run this in a new terminal tab):
```bash
curl -X POST http://localhost:8080/api/v1/rules \
-H "Content-Type: application/json" \
-d '{
  "text": "Always handle potentially nil pointers using if err != nil in Go", 
  "technology": "Go" 
}'
```

### Step 2: Trigger a Webhook Simulation
You can simulate a GitHub Push event to trigger the AI code review pipeline without actually using GitHub webhooks. 
**Note:** You must use a real commit hash from a repository your GitHub Token has access to!
```bash
curl -X POST http://localhost:8080/api/v1/webhooks/github \
-H "X-GitHub-Event: push" \
-H "Content-Type: application/json" \
-d '{
  "ref": "refs/heads/main",
  "after": "YOUR_ACTUAL_COMMIT_HASH",
  "repository": {
    "full_name": "your-github-username/your-repo-name"
  }
}'
```

### Step 3: View the Results
Open your Next.js Frontend (`http://localhost:3000`). Once the background Go worker finishes parsing the diff and generating the LLM review, you will see the new AI review populated on the dashboard. Click **View Details** to see the side-by-side Git Diff with the AI suggestions overlay!
