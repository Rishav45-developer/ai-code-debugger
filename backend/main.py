from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from pydantic import BaseModel, validator
from groq import Groq
from dotenv import load_dotenv
from typing import List
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import os
import re

load_dotenv()

# Rate limiter setup
limiter = Limiter(key_func=get_remote_address)

app = FastAPI(title="AI Code Debugger")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# Allow requests from frontend and local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://rishavdev-code-debugger-frontend.hf.space",
        "http://localhost:3000"
    ],
    allow_methods=["POST", "GET"],
    allow_headers=["Content-Type"],
)

# Only allow requests from trusted hosts
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=[
        "rishavdev-code-debugger-api.hf.space",
        "localhost",
        "127.0.0.1"
    ]
)

ALLOWED_LANGUAGES = [
    "python", "javascript", "java", "c++",
    "c#", "go", "rust", "typescript"
]

class CodeRequest(BaseModel):
    code: str
    language: str = "python"

    @validator('code')
    def code_length_check(cls, v):
        if not v.strip():
            raise ValueError('Code cannot be empty')
        if len(v) > 5000:
            raise ValueError('Code too long — maximum 5000 characters allowed')
        return v

    @validator('language')
    def language_check(cls, v):
        if v not in ALLOWED_LANGUAGES:
            raise ValueError(f'Invalid language. Allowed: {ALLOWED_LANGUAGES}')
        return v

class DebugResponse(BaseModel):
    explanation: str
    bugs: str
    fixed_code: str

class ChatMessage(BaseModel):
    role: str
    content: str

    @validator('role')
    def role_check(cls, v):
        if v not in ["user", "assistant"]:
            raise ValueError('Role must be user or assistant')
        return v

    @validator('content')
    def content_check(cls, v):
        if len(v) > 2000:
            raise ValueError('Message too long — maximum 2000 characters allowed')
        return v

class ChatRequest(BaseModel):
    code: str
    language: str
    messages: List[ChatMessage]

    @validator('messages')
    def messages_length_check(cls, v):
        if len(v) > 20:
            raise ValueError('Too many messages — maximum 20 allowed')
        return v

class ChatResponse(BaseModel):
    reply: str

@app.post("/debug", response_model=DebugResponse)
@limiter.limit("5/minute")
async def debug_code(request: Request, body: CodeRequest):
    prompt = f"""
You are an expert code debugger.
Analyze this {body.language} code and respond in this EXACT format:

EXPLANATION:
(explain what the code does)

BUGS FOUND:
(list each bug, or say No bugs found)

FIXED CODE:
(the corrected code here)

Code to analyze:
{body.code}
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
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Something went wrong. Please try again."
        )

@app.post("/chat", response_model=ChatResponse)
@limiter.limit("10/minute")
async def chat(request: Request, body: ChatRequest):
    system_message = f"""You are an expert code debugger and programming assistant.
The user has submitted this {body.language} code:

```{body.language}
{body.code}
```

Answer all follow-up questions about this code clearly and helpfully.
If asked to improve or fix something, provide the updated code."""

    messages = [{"role": "system", "content": system_message}]
    for msg in body.messages:
        messages.append({"role": msg.role, "content": msg.content})

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            max_tokens=2048,
        )
        reply = response.choices[0].message.content
        return ChatResponse(reply=reply)
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Something went wrong. Please try again."
        )

@app.get("/")
async def root():
    return {"message": "API is running!"}