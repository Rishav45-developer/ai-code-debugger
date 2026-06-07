# AI Code Debugger

> An intelligent, full-stack code analysis platform powered by large language models. Paste any code, get a structured breakdown of logic, identified vulnerabilities, corrected implementation, and a context-aware follow-up chat — all in real time.
![AI Code Debugger](https://img.shields.io/badge/AI-Code%20Debugger-blue?style=for-the-badge)
![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)
![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![HuggingFace](https://img.shields.io/badge/Hugging%20Face-FFD21E?style=for-the-badge&logo=huggingface&logoColor=black)
---

## Live Demo

**[Launch Application](https://huggingface.co/spaces/rishavdev/code-debugger-frontend)**

---

## Overview

AI Code Debugger is a production-ready, containerized web application that leverages state-of-the-art large language models to perform deep static analysis on source code. The system is designed around a decoupled microservice architecture — a high-performance Python backend handles all LLM orchestration and prompt engineering, while a modern React-based frontend delivers a fluid, responsive user experience inspired by leading AI interfaces.

The platform supports multi-turn conversational debugging, enabling users to not only receive automated analysis but also engage in context-aware dialogue about their codebase.

---

## Features

- **Deep Code Analysis** — Comprehensive explanation of code logic, control flow, and intent
- **Automated Bug Detection** — Identifies logical errors, edge cases, type mismatches, and runtime vulnerabilities
- **Intelligent Code Correction** — Returns production-ready fixed code with improvements applied
- **Multi-turn Chat Interface** — Context-aware follow-up conversation with full code history retained
- **Multi-language Support** — Python, JavaScript, TypeScript, Java, C++, C#, Go, Rust
- **Real-time Processing** — Sub-second response pipeline via optimized LLM inference
- **Containerized Deployment** — Fully Dockerized, deployed on Hugging Face Spaces infrastructure

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                        Client                           │
│              Next.js 16 + TypeScript                    │
│           Gemini-inspired dark UI (Tailwind)            │
└────────────────────────┬────────────────────────────────┘
                         │ HTTP REST
                         ▼
┌─────────────────────────────────────────────────────────┐
│                    FastAPI Backend                       │
│         Prompt Engineering + Response Parsing           │
│              /debug endpoint + /chat endpoint           │
└────────────────────────┬────────────────────────────────┘
                         │ API Call
                         ▼
┌─────────────────────────────────────────────────────────┐
│                  LLM Inference Layer                     │
│            Llama 3.3 70B (High-speed inference)         │
└─────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | Next.js 16, TypeScript | React framework, type safety |
| Styling | Tailwind CSS | Utility-first UI design |
| Backend | FastAPI, Python 3.11 | REST API, LLM orchestration |
| LLM | Llama 3.3 70B | Code analysis and generation |
| Containerization | Docker | Reproducible builds |
| Deployment | Hugging Face Spaces | Cloud hosting infrastructure |

---

## Project Structure

```
code-debugger/
├── backend/
│   ├── main.py              # FastAPI application
│   │                        # — /debug endpoint (analysis)
│   │                        # — /chat endpoint (multi-turn)
│   │                        # — Prompt engineering logic
│   │                        # — Structured response parsing
│   ├── requirements.txt     # Python dependencies
│   ├── Dockerfile           # Container configuration
│   └── .gitignore
│
└── frontend/
    ├── app/
    │   └── page.tsx         # Core application UI
    │                        # — Gemini-style interface
    │                        # — Tabbed result view
    │                        # — Real-time chat panel
    ├── Dockerfile           # Container configuration
    ├── next.config.ts       # Next.js configuration
    └── .gitignore
```

---

## Local Development

### Prerequisites

- Python 3.11 or higher
- Node.js 20 or higher
- Docker (optional, for containerized run)

### 1. Clone the repository

```bash
git clone https://github.com/rishavdev/code-debugger.git
cd code-debugger
```

### 2. Backend setup

```bash
cd backend
pip install -r requirements.txt
```

Create a `.env` file:

```
GROQ_API_KEY=your_api_key_here
```

Start the server:

```bash
python -m uvicorn main:app --reload
```

API runs at `http://localhost:8000`
Interactive API docs at `http://localhost:8000/docs`

### 3. Frontend setup

```bash
cd frontend
npm install
npm run dev
```

Application runs at `http://localhost:3000`

---

## API Reference

### `POST /debug`

Performs full static analysis on submitted code.

**Request body:**
```json
{
  "code": "def add(a, b):\n    return a - b",
  "language": "python"
}
```

**Response:**
```json
{
  "explanation": "This function accepts two numeric parameters and is intended to return their sum. However, the implementation contains a logical error.",
  "bugs": "Line 2: Subtraction operator (-) used instead of addition (+). The function named 'add' performs subtraction, producing incorrect results for all inputs.",
  "fixed_code": "def add(a, b):\n    return a + b"
}
```

### `POST /chat`

Multi-turn conversational endpoint with full code context.

**Request body:**
```json
{
  "code": "your code here",
  "language": "python",
  "messages": [
    { "role": "user", "content": "Can you optimize this further?" }
  ]
}
```

**Response:**
```json
{
  "reply": "Here is an optimized version with time complexity analysis..."
}
```

---


## Deployment

The application is split into two independent services, each containerized using Docker and deployed separately on **Hugging Face Spaces**.

The backend FastAPI service is packaged into a Docker container using a Python 3.11 slim base image. Dependencies are installed from `requirements.txt` and the server is exposed on port 7860 as required by the Hugging Face Spaces infrastructure. The API key is injected at runtime through Hugging Face's encrypted secrets vault — it is never stored in the codebase or container image.

The frontend Next.js application is containerized using a Node.js 20 Alpine base image. The application is built at container build time using `npm run build` and served via the Next.js production server on port 7860. The frontend communicates with the backend via its live Hugging Face Spaces URL.

Both containers are automatically built and deployed by Hugging Face whenever new code is pushed to the respective Space repositories via Git.

All secrets and API credentials are managed through Hugging Face's encrypted secrets vault — no sensitive data is present in the codebase.

---

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GROQ_API_KEY` | LLM inference API key | Yes |

---

## License

MIT License — open for use, modification, and distribution.

---

## Author

Developed by [Rishav](https://huggingface.co/rishavdev)