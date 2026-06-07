from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from groq import Groq
from dotenv import load_dotenv
from typing import List
import os
import re

load_dotenv()

app = FastAPI(title="AI Code Debugger")
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_methods=["*"],
    allow_headers=["*"],
)
class CodeRequest(BaseModel):
    code: str
    language: str = "python"

class DebugResponse(BaseModel):
    explanation: str
    bugs: str
    fixed_code: str

# --- NEW: Chat models ---
class ChatMessage(BaseModel):
    role: str   # "user" or "assistant"
    content: str

class ChatRequest(BaseModel):
    code: str
    language: str
    messages: List[ChatMessage]

class ChatResponse(BaseModel):
    reply: str

# --- existing debug endpoint (unchanged) ---
@app.post("/debug", response_model=DebugResponse)
async def debug_code(request: CodeRequest):
    prompt = f"""
You are an expert code debugger.
Analyze this {request.language} code and respond in this EXACT format:

EXPLANATION:
(explain what the code does)

BUGS FOUND:
(list each bug, or say No bugs found)

FIXED CODE:
(the corrected code here)

Code to analyze:
{request.code}
"""
    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=2048,
        )
        text = response.choices[0].message.content

        def get_section(t, start, end):
            s = t.find(start)
            if s == -1: return "Not found"
            s += len(start)
            e = t.find(end, s) if end else len(t)
            result = t[s:e].strip()
            result = re.sub(r'^```[\w]*\n?', '', result)
            result = re.sub(r'\n?```$', '', result)
            return result.strip()

        return DebugResponse(
            explanation=get_section(text, "EXPLANATION:", "BUGS FOUND:"),
            bugs=get_section(text, "BUGS FOUND:", "FIXED CODE:"),
            fixed_code=get_section(text, "FIXED CODE:", None)
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- NEW: Chat endpoint ---
@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    # System message gives the AI full context about the code
    system_message = f"""You are an expert code debugger and programming assistant.
The user has submitted this {request.language} code:

```{request.language}
{request.code}
```

Answer all follow-up questions about this code clearly and helpfully.
If asked to improve or fix something, provide the updated code."""

    # Build the full message history for the LLM
    messages = [{"role": "system", "content": system_message}]
    for msg in request.messages:
        messages.append({"role": msg.role, "content": msg.content})

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            max_tokens=2048,
        )
        reply = response.choices[0].message.content
        return ChatResponse(reply=reply)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
async def root():
    return {"message": "API is running!"}
