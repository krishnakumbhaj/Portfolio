# FastAPI - AI Gateway for Portfolio Chat
# Architecture: Frontend → FastAPI (SSE) → LangGraph Brain (streaming) → Response + Async MongoDB Storage

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional
import httpx
import asyncio
import json
import os
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

# LangGraph Brain
from Brain import handle_query_stream, handle_query, handle_confirm, llm

# =============================================================================
# APP CONFIGURATION
# =============================================================================

PORT = int(os.getenv("PORT", "8000"))

app = FastAPI(
    title="Portfolio AI Gateway",
    description="Session-based AI chat gateway for portfolio",
    version="1.0.0"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        # Add your production domain here
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Next.js API URL for storing chat history
NEXTJS_API_URL = os.getenv("NEXTJS_API_URL", "http://localhost:3000/api/portfolio-chat")

# =============================================================================
# MODELS
# =============================================================================

class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None

class ChatResponse(BaseModel):
    response: str
    session_id: str
    remembered_info: dict = {}

class ConfirmRequest(BaseModel):
    session_id: str
    action: str  # "confirmed" or "cancelled"
    reason: Optional[str] = None

class SummarizeRequest(BaseModel):
    session_id: str

# =============================================================================
# IN-MEMORY SESSION STORAGE (will be replaced by LangGraph memory)
# =============================================================================

sessions: dict = {}

# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

async def store_chat_async(session_id: str, user_message: str, ai_response: str):
    """
    Asynchronously send chat data to Next.js API for MongoDB storage.
    This runs in the background and doesn't block the response.
    """
    try:
        async with httpx.AsyncClient() as client:
            payload = {
                "session_id": session_id,
                "user_message": user_message,
                "ai_response": ai_response,
                "timestamp": datetime.utcnow().isoformat()
            }
            response = await client.post(
                f"{NEXTJS_API_URL}/message",
                json=payload,
                timeout=10.0
            )
            if response.status_code == 200:
                print(f"✅ Chat stored for session: {session_id}")
            else:
                print(f"⚠️ Failed to store chat: {response.status_code}")
    except Exception as e:
        print(f"❌ Error storing chat: {e}")

# =============================================================================
# ROUTES
# =============================================================================

@app.get("/")
async def root():
    return {
        "status": "online",
        "service": "Portfolio AI Gateway",
        "version": "1.0.0"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.post("/portfolio/chat", response_model=ChatResponse)
async def portfolio_chat(request: ChatRequest):
    """
    Non-streaming fallback endpoint.
    """
    session_id = request.session_id or f"server_{datetime.now().timestamp()}"
    
    if session_id not in sessions:
        sessions[session_id] = {
            "created_at": datetime.utcnow().isoformat(),
            "message_count": 0,
            "remembered_info": {}
        }
    sessions[session_id]["message_count"] += 1
    
    try:
        ai_response = await handle_query(request.message, session_id)
    except Exception as e:
        print(f"❌ Brain error: {e}")
        ai_response = "I'm having trouble processing your request right now. Please try again."
    
    asyncio.create_task(
        store_chat_async(session_id, request.message, ai_response)
    )
    
    return ChatResponse(
        response=ai_response,
        session_id=session_id,
        remembered_info=sessions[session_id].get("remembered_info", {})
    )


@app.post("/portfolio/chat/stream")
async def portfolio_chat_stream(request: ChatRequest):
    """
    Real streaming SSE endpoint.
    Streams actual LangGraph token-level chunks as they are generated.
    """
    session_id = request.session_id or f"server_{datetime.now().timestamp()}"
    
    if session_id not in sessions:
        sessions[session_id] = {
            "created_at": datetime.utcnow().isoformat(),
            "message_count": 0,
            "remembered_info": {}
        }
    sessions[session_id]["message_count"] += 1

    async def event_generator():
        full_response = ""
        try:
            async for sse_chunk in handle_query_stream(request.message, session_id):
                yield sse_chunk
                # Capture the full response from the done event
                if sse_chunk.startswith("data: "):
                    try:
                        payload = json.loads(sse_chunk[6:].strip())
                        if payload.get("type") == "done":
                            full_response = payload.get("full_response", "")
                    except json.JSONDecodeError:
                        pass
        except Exception as e:
            print(f"❌ Stream error: {e}")
            yield f"data: {json.dumps({'type': 'error', 'content': 'Stream interrupted'})}\n\n"
        
        # Store to MongoDB after stream completes
        if full_response:
            asyncio.create_task(
                store_chat_async(session_id, request.message, full_response)
            )
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Session-Id": session_id,
        },
    )


@app.post("/portfolio/chat/confirm")
async def portfolio_chat_confirm(request: ConfirmRequest):
    """
    Resume the LangGraph after human-in-the-loop confirmation.
    Called when user clicks Confirm or Cancel on the connection card.
    Streams the continuation response (tool execution + AI follow-up).
    """
    session_id = request.session_id
    decision = {
        "action": request.action,
        "reason": request.reason or "",
    }

    async def event_generator():
        full_response = ""
        try:
            async for sse_chunk in handle_confirm(session_id, decision):
                yield sse_chunk
                if sse_chunk.startswith("data: "):
                    try:
                        payload = json.loads(sse_chunk[6:].strip())
                        if payload.get("type") == "done":
                            full_response = payload.get("full_response", "")
                    except json.JSONDecodeError:
                        pass
        except Exception as e:
            print(f"❌ Confirm stream error: {e}")
            yield f"data: {json.dumps({'type': 'error', 'content': 'Confirmation failed'})}\n\n"

        if full_response:
            asyncio.create_task(
                store_chat_async(session_id, "Confirmed", full_response)
            )

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    )


@app.post("/portfolio/chat/summarize")
async def summarize_chat(request: SummarizeRequest):
    """
    Summarize a portfolio chat session using Gemini.
    Fetches messages from Next.js API and returns an AI summary.
    """
    try:
        # Fetch chat from MongoDB via Next.js API
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{NEXTJS_API_URL}/session/{request.session_id}",
                timeout=10.0,
            )
            if resp.status_code != 200:
                raise HTTPException(status_code=404, detail="Chat session not found")

            data = resp.json()
            messages = data.get("messages", [])

        if not messages:
            return {"success": True, "summary": "No messages in this chat session."}

        # Build conversation text for the LLM
        conversation = "\n".join(
            f"{'Visitor' if m.get('role') == 'user' else 'AI Assistant'}: {m.get('content', '')}"
            for m in messages
            if m.get('content')
        )

        from langchain_core.messages import HumanMessage, SystemMessage

        summary_response = await llm.ainvoke([
            SystemMessage(content=(
                "You are summarizing a portfolio chat conversation between a visitor and Krishna Sharma's AI assistant. "
                "Provide a concise 2-4 sentence summary covering: "
                "1) What the visitor was interested in, "
                "2) Key topics discussed, "
                "3) Any outcomes (connection request, email sent, etc). "
                "Be direct and factual."
            )),
            HumanMessage(content=f"Summarize this conversation:\n\n{conversation}"),
        ])

        summary_text = summary_response.content
        if isinstance(summary_text, list):
            summary_text = " ".join(
                block.get("text", "") if isinstance(block, dict) else str(block)
                for block in summary_text
            )

        return {"success": True, "summary": summary_text}

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Summary error: {e}")
        return {"success": False, "summary": "Failed to generate summary."}


@app.delete("/portfolio/session/{session_id}")
async def delete_session(session_id: str):
    """
    Delete/reset a session.
    Called when user clicks "New Chat" or clears session.
    """
    
    # Clear local session memory
    if session_id in sessions:
        del sessions[session_id]
        print(f"🗑️ Session deleted: {session_id}")
    
    # Also clear from MongoDB via Next.js API
    try:
        async with httpx.AsyncClient() as client:
            await client.delete(
                f"{NEXTJS_API_URL}/session/{session_id}",
                timeout=10.0
            )
    except Exception as e:
        print(f"⚠️ Error clearing session from DB: {e}")
    
    return {"success": True, "message": f"Session {session_id} cleared"}

@app.get("/portfolio/session/{session_id}")
async def get_session(session_id: str):
    """
    Get session info (for debugging/admin purposes).
    """
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return {
        "session_id": session_id,
        "data": sessions[session_id]
    }

# =============================================================================
# RUN SERVER
# =============================================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=PORT, reload=True)