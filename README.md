# Trader Performance Agent (OrionAI Coach)

An AI-powered system that analyzes trading patterns, identifies behavioral risks, and generates personalized coaching insights.

## Project Structure

```
trader-performance-agent/
├── backend/          # Node.js + Express backend
│   ├── src/         # TypeScript source files
│   └── package.json
├── frontend/        # React + TypeScript + TailwindCSS frontend
│   ├── src/         # React components
│   └── package.json
└── .env.example     # Environment variables template
```

## Prerequisites

- Node.js v22.x (managed via nvm)
- npm v10.x
- Google Gemini API key
- Qdrant instance (cloud or local)
- AI/ML API access (for anomaly detection)

## Setup

### 1. Install Dependencies

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd frontend
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` in both backend and frontend directories and fill in your API keys:

```bash
cp .env.example backend/.env
cp .env.example frontend/.env
```

### 3. Run Development Servers

**Backend:**
```bash
cd backend
npm run dev
```

**Frontend:**
```bash
cd frontend
npm run dev
```

The backend will run on `http://localhost:3001` and the frontend on `http://localhost:5173`.

## Technology Stack

### Backend
- Node.js with Express
- TypeScript
- Google Gemini API (embeddings & coaching)
- Qdrant (vector database)
- AI/ML API (anomaly detection)
- Opus Workflows (orchestration)

### Frontend
- React 19
- TypeScript
- TailwindCSS
- Vite

## Features

- **Trade Analysis**: View recent trading activity with mock data
- **Pattern Detection**: Identify over-leverage, revenge trading, and tilt behavior
- **Vector Similarity**: Find similar historical trading patterns using Qdrant
- **AI Coaching**: Get personalized feedback from Google Gemini
- **Workflow Orchestration**: Automated pipeline via Opus

## Development

### Backend Scripts
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Run production build

### Frontend Scripts
- `npm run dev` - Start Vite development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## API Endpoints

- `GET /health` - Health check
- `POST /api/coaching/trigger` - Trigger coaching workflow
- `GET /api/coaching/status/:workflowId` - Check workflow status
- `GET /api/trades` - Get mock trade data

## License

ISC
