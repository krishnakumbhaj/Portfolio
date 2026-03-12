# =============================================================================
# Brain.py — LangGraph AI Agent for Portfolio Chat
# Architecture: StateGraph with tools, MemorySaver persistence, thread_id = session_id
# Supports both full invoke and real token-level streaming
# =============================================================================

# ─────────────────────── Imports ─────────────────────────
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from langgraph.checkpoint.memory import MemorySaver
from langgraph.prebuilt import ToolNode, tools_condition
from langgraph.types import interrupt, Command
# from langchain_groq import ChatGroq
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, SystemMessage, ToolMessage

from dotenv import load_dotenv
import os
import json
from typing import TypedDict, Annotated, AsyncGenerator

# Tools
from tools import all_tools

# ─────────────────────── Environment ─────────────────────────
load_dotenv()


GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")

# ─────────────────────── Resume Context ─────────────────────────

RESUME_CONTEXT = """
KRISHNA SHARMA
Location: Pandav Nagar, Meerut 250001, Uttar Pradesh, India
Phone: +91 8899101201
Email: krishnakumbhaj@gmail.com
LinkedIn: https://www.linkedin.com/in/krishna-sharma-92a441279/
GitHub: github.com/krishnakumbhaj

─── EDUCATION ───
• B.Tech in Computer Science (Data Science) — Meerut Institute of Engineering & Technology (Aug 2022 – Aug 2026)
• Senior Secondary Education — BNG International School, Meerut (Mar 2020 – Mar 2022) — 87.6%

─── SKILLS ───
• Languages: HTML5, CSS3, JavaScript (ES6+), TypeScript, Python
• Frameworks: React.js, Next.js, Tailwind CSS, LangChain, Scikit-learn
• Databases: MongoDB, PostgreSQL
• Developer Tools: Git, GitHub, Docker, Postman, Power BI

─── PROJECTS ───
1. Zella — AI-powered chatbot that reads, explains, and sends emails automatically. Smart conversational assistant for queries and response generation. (LangChain, Python)
2. Vox — AI-powered web app for data analysis (CSV/databases) using natural language questions. Generates tables, charts, and insights instantly. (Next.js, LlamaIndex, MongoDB, Python, TypeScript)
3. WorkLink — Unified platform for traditional jobs and freelance opportunities. Users can post jobs or freelance tasks, acting as both client and freelancer. (Next.js, MongoDB, TypeScript, Tailwind CSS)
4. Sotrian — AI-powered full-stack platform using specialized ML models for multi-modal fraud detection (credit card, UPI, phishing) with an AI Chat Assistant for real-time risk advisory. (Next.js, Python, LangGraph, Scikit-Learn)

─── EXPERIENCE ───
• WebWeavers, MIET | Frontend Developer (June 2024 – Oct 2024, Volunteering)
  - Enhanced web application performance by 20% through optimized responsive design
  - Streamlined development workflow, reducing delivery time by 25%
• Codsoft | Fullstack Developer Intern — MERN (June 2024 – July 2024, Remote Internship)
  - Developed and deployed MERN apps with improved performance and scalability

─── CERTIFICATIONS ───
• HackerRank SQL (Basic)
• HackerRank Python (Basic)
• MongoDB Certification (Atlas, CRUD, Aggregation, Indexing, Transactions)
"""

# ─────────────────────── System Prompt ─────────────────────────

SYSTEM_PROMPT = f"""You are Krishna Sharma's portfolio AI assistant name Raven. You represent Krishna on his personal portfolio website. Your role is to help visitors learn about Krishna, his skills, projects, experience, and how to connect with him.

## Your Knowledge Base (Krishna's Resume):
{RESUME_CONTEXT}

## CRITICAL — Response Formatting Rules:
- **NEVER copy-paste or dump the raw resume content.** The resume above is your internal knowledge base, NOT something to regurgitate.
- When asked about skills, projects, experience, etc., **synthesize and rephrase the information in your own conversational words.**
- For example, if asked "What are Krishna's skills?", DO NOT list the resume bullet points verbatim. Instead, describe his skills naturally: "Krishna is a full-stack developer with strong expertise in React, Next.js, and TypeScript on the frontend, paired with Python and MongoDB on the backend..."
- Structure responses with clear headings, bullet points, and highlights — but use YOUR OWN phrasing, not the resume's exact formatting.
- Add context, enthusiasm, and connecting insights rather than flat lists.
- Keep responses concise: 2-4 paragraphs or a short intro + focused bullet points. Don't over-explain.

## Your Personality & Behavior:
- Be friendly, professional, and enthusiastic about Krishna's work
- Speak in third person about Krishna (e.g., "Krishna has experience with..." not "I have experience with...")
- Use markdown formatting for better readability (bold, lists, code blocks where appropriate)
- If asked something you genuinely don't know about Krishna, say so honestly rather than making things up
- Show genuine enthusiasm when discussing Krishna's projects and skills

## Tools Available:
- You can fetch Krishna's GitHub profile, repos, and pinned projects using the GitHub tools
- You can help visitors send connection/contact emails using the email tool
- Use tools when visitors ask about specific repos, GitHub activity, or want to connect

## Connection/Email Flow:
When a visitor wants to connect or reach out to Krishna, run this structured flow:

**Required info to collect (ask naturally during conversation):**
1. **Name** — their full name
2. **Email** — their email address
3. **Reason** — why they want to connect (e.g., job opportunity, collaboration, freelance project, just networking)

**Optional info (ask but don't push):**
4. **Mobile Number** — their phone number (mention it's optional)
5. **About Them** — a brief description of who they are / what they do (mention it's optional)
6. **Message** — any additional message for Krishna (optional)

**Flow steps:**
- Collect required info first (name, email, reason) through natural conversation — don't dump all questions at once
- After getting the required fields, casually ask if they'd also like to share their phone number and a brief intro about themselves
- Once you have enough info, call `send_connection_email` directly with all the collected details
- The system will automatically show the user a confirmation card with all their details before actually sending
- The user can confirm or edit from the card — you don't need to ask for text-based confirmation yourself
- Pass ALL collected info to the tool: visitor_name, visitor_email, reason, message, mobile_number, about_user
- The tool will automatically: send confirmation email to visitor, notify Krishna, and save to dashboard

## Rate Limits (enforced automatically by the system):
- **Email cooldown**: The same email address can only receive a connection request once every 7 days. If blocked, the tool will return an error — inform the user politely that a request was already sent to that email recently and they should wait.
- **Session limit**: Each chat session can send connection requests to a maximum of 2 different email addresses. If blocked, let the user know they've reached the session limit.

## Guidelines:
- For technical questions about Krishna's stack, refer to his skills and projects
- For project-specific questions, use GitHub tools to fetch latest info when helpful
- Keep the conversation engaging and guide visitors toward learning more about Krishna
- If asked about topics unrelated to Krishna or his work, politely redirect the conversation
- Never share sensitive personal information beyond what's in the resume
"""

# ─────────────────────── Graph State ─────────────────────────

class GraphState(TypedDict):
    messages: Annotated[list, add_messages]

# ─────────────────────── LLM with Tools ─────────────────────────


llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    temperature=0.7,
    google_api_key=GOOGLE_API_KEY,
)

llm_with_tools = llm.bind_tools(all_tools)

# ─────────────────────── Graph Nodes ─────────────────────────

# Tool names that need human confirmation before executing
TOOLS_REQUIRING_CONFIRMATION = {"send_connection_email"}

async def chatbot(state: GraphState):
    """Main chatbot node — invokes LLM with system prompt + conversation history."""
    messages = state["messages"]

    # Prepend system prompt if not already present
    if not messages or not isinstance(messages[0], SystemMessage):
        messages = [SystemMessage(content=SYSTEM_PROMPT)] + messages

    response = await llm_with_tools.ainvoke(messages)
    return {"messages": [response]}


def confirmation_gate(state: GraphState):
    """
    Human-in-the-loop gate: checks if the AI wants to call a tool that
    requires user confirmation (like send_connection_email).
    If so, interrupts the graph and sends confirmation data to the frontend.
    The graph resumes only when the user confirms/edits via the /confirm endpoint.
    """
    last_message = state["messages"][-1]

    # Check if the last message has tool calls
    if not hasattr(last_message, "tool_calls") or not last_message.tool_calls:
        return {"messages": []}  # pass-through, don't modify state

    for tool_call in last_message.tool_calls:
        if tool_call["name"] in TOOLS_REQUIRING_CONFIRMATION:
            # Extract the connection details from tool call args
            args = tool_call["args"]
            confirmation_data = {
                "tool": tool_call["name"],
                "tool_call_id": tool_call["id"],
                "details": {
                    "name": args.get("visitor_name", ""),
                    "email": args.get("visitor_email", ""),
                    "reason": args.get("reason", ""),
                    "mobile_number": args.get("mobile_number", ""),
                    "about_user": args.get("about_user", ""),
                    "message": args.get("message", ""),
                },
            }
            # Interrupt! This pauses the graph and sends data to frontend.
            # The graph will resume when user calls /confirm with Command(resume=...)
            user_decision = interrupt(confirmation_data)

            # After resume — check what user decided
            if user_decision.get("action") == "confirmed":
                # User confirmed — don't modify state, let tool node execute
                return {"messages": []}
            else:
                # User cancelled — inject a ToolMessage saying "cancelled"
                # and let the chatbot respond naturally
                return {
                    "messages": [
                        ToolMessage(
                            content=json.dumps({
                                "success": False,
                                "cancelled": True,
                                "reason": user_decision.get("reason", "User cancelled the connection request."),
                            }),
                            tool_call_id=tool_call["id"],
                        )
                    ]
                }

    # No tools requiring confirmation — pass through to tool execution
    return {"messages": []}


def route_after_confirmation(state: GraphState):
    """Route after confirmation gate — either go to tools or back to chatbot."""
    last_message = state["messages"][-1]

    # If we just added a ToolMessage (cancelled), go back to chatbot
    if hasattr(last_message, "type") and last_message.type == "tool":
        return "chatbot"

    # Otherwise proceed to tool execution
    return "tools"


# ─────────────────────── Build Graph ─────────────────────────

tool_node = ToolNode(tools=all_tools)

graph_builder = StateGraph(GraphState)

# Add nodes
graph_builder.add_node("chatbot", chatbot)
graph_builder.add_node("confirmation_gate", confirmation_gate)
graph_builder.add_node("tools", tool_node)

# Edges:
# START → chatbot
graph_builder.add_edge(START, "chatbot")

# chatbot → confirmation_gate (if tool calls) or END (if no tool calls)
# We use a custom routing function instead of tools_condition
# so that tool calls go through confirmation_gate first
def chatbot_router(state: GraphState):
    """Route from chatbot: if tool calls → confirmation_gate, else → END."""
    last_message = state["messages"][-1]
    if hasattr(last_message, "tool_calls") and last_message.tool_calls:
        return "confirmation_gate"
    return END

graph_builder.add_conditional_edges("chatbot", chatbot_router)

# confirmation_gate → tools (if confirmed/no confirmation needed) or chatbot (if cancelled)
graph_builder.add_conditional_edges("confirmation_gate", route_after_confirmation)

# tools → chatbot (process tool results)
graph_builder.add_edge("tools", "chatbot")

# Compile with persistence
memory = MemorySaver()
graph = graph_builder.compile(checkpointer=memory)

# ─────────────────────── Public API ─────────────────────────

def _extract_text(content) -> str:
    """Extract plain text from Gemini's content (which may be str or list of blocks)."""
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        parts = []
        for block in content:
            if isinstance(block, dict) and "text" in block:
                parts.append(block["text"])
            elif isinstance(block, str):
                parts.append(block)
        return "\n".join(parts) if parts else str(content)
    return str(content)


async def handle_query_stream(query: str, session_id: str) -> AsyncGenerator[str, None]:
    """
    Stream a user query through the LangGraph agent using astream_events.
    Yields Server-Sent Event formatted strings with real token-level chunks.
    Detects interrupts for human-in-the-loop confirmation.

    Uses session_id as thread_id for conversation persistence.
    """
    config = {"configurable": {"thread_id": session_id}}
    full_response = ""

    try:
        async for event in graph.astream_events(
            {"messages": [HumanMessage(content=query)]},
            config=config,
            version="v2",
        ):
            kind = event.get("event", "")

            # Token-level streaming from the chatbot LLM node
            if kind == "on_chat_model_stream":
                chunk = event.get("data", {}).get("chunk")
                if chunk and hasattr(chunk, "content") and chunk.content:
                    text = _extract_text(chunk.content)
                    if text:
                        full_response += text
                        yield f"data: {json.dumps({'type': 'token', 'content': text})}\n\n"

            # Tool calls — notify frontend
            elif kind == "on_tool_start":
                tool_name = event.get("name", "")
                # astream_events v2 may put the tool name in metadata
                if not tool_name or tool_name == "tools":
                    tool_name = (event.get("metadata", {}) or {}).get("langgraph_node", "")
                    # Also try to get from data.input
                    if not tool_name or tool_name == "tools":
                        data = event.get("data", {})
                        if isinstance(data, dict) and "input" in data:
                            inp = data["input"]
                            if isinstance(inp, dict):
                                tool_name = inp.get("name", inp.get("type", "tool"))
                            elif hasattr(inp, "name"):
                                tool_name = inp.name
                if tool_name:
                    yield f"data: {json.dumps({'type': 'tool_start', 'tool': tool_name})}\n\n"

            elif kind == "on_tool_end":
                tool_name = event.get("name", "")
                if not tool_name or tool_name == "tools":
                    tool_name = (event.get("metadata", {}) or {}).get("langgraph_node", "")
                if tool_name:
                    yield f"data: {json.dumps({'type': 'tool_end', 'tool': tool_name})}\n\n"

        # Check if graph is interrupted (waiting for confirmation)
        state = await graph.aget_state(config)
        if state.next:
            # Graph is paused at an interrupt — extract confirmation data
            # The interrupt value is stored in state.tasks
            for task in state.tasks:
                if hasattr(task, "interrupts") and task.interrupts:
                    for intr in task.interrupts:
                        confirmation_data = intr.value
                        yield f"data: {json.dumps({'type': 'confirmation_required', 'data': confirmation_data})}\n\n"
                        return  # Don't send 'done' — graph is paused

        # Signal stream complete with the full response for storage
        yield f"data: {json.dumps({'type': 'done', 'full_response': full_response})}\n\n"

    except Exception as e:
        error_msg = "I'm having trouble processing your request right now. Please try again."
        yield f"data: {json.dumps({'type': 'error', 'content': error_msg})}\n\n"
        print(f"❌ Stream error: {e}")


async def handle_confirm(session_id: str, decision: dict) -> AsyncGenerator[str, None]:
    """
    Resume the graph after user confirms or cancels a connection request.
    decision = {"action": "confirmed"} or {"action": "cancelled", "reason": "..."}
    Streams the continuation response.
    """
    config = {"configurable": {"thread_id": session_id}}
    full_response = ""

    try:
        async for event in graph.astream_events(
            Command(resume=decision),
            config=config,
            version="v2",
        ):
            kind = event.get("event", "")

            if kind == "on_chat_model_stream":
                chunk = event.get("data", {}).get("chunk")
                if chunk and hasattr(chunk, "content") and chunk.content:
                    text = _extract_text(chunk.content)
                    if text:
                        full_response += text
                        yield f"data: {json.dumps({'type': 'token', 'content': text})}\n\n"

            elif kind == "on_tool_start":
                tool_name = event.get("name", "")
                if not tool_name or tool_name == "tools":
                    tool_name = (event.get("metadata", {}) or {}).get("langgraph_node", "")
                    if not tool_name or tool_name == "tools":
                        data = event.get("data", {})
                        if isinstance(data, dict) and "input" in data:
                            inp = data["input"]
                            if isinstance(inp, dict):
                                tool_name = inp.get("name", inp.get("type", "tool"))
                            elif hasattr(inp, "name"):
                                tool_name = inp.name
                if tool_name:
                    yield f"data: {json.dumps({'type': 'tool_start', 'tool': tool_name})}\n\n"

            elif kind == "on_tool_end":
                tool_name = event.get("name", "")
                if not tool_name or tool_name == "tools":
                    tool_name = (event.get("metadata", {}) or {}).get("langgraph_node", "")
                if tool_name:
                    yield f"data: {json.dumps({'type': 'tool_end', 'tool': tool_name})}\n\n"

        yield f"data: {json.dumps({'type': 'done', 'full_response': full_response})}\n\n"

    except Exception as e:
        error_msg = "Something went wrong processing your confirmation. Please try again."
        yield f"data: {json.dumps({'type': 'error', 'content': error_msg})}\n\n"
        print(f"❌ Confirm stream error: {e}")


async def handle_query(query: str, session_id: str) -> str:
    """
    Non-streaming fallback. Process a user query and return full response.
    """
    config = {"configurable": {"thread_id": session_id}}

    result = await graph.ainvoke(
        {"messages": [HumanMessage(content=query)]},
        config=config,
    )

    ai_messages = [
        msg for msg in result["messages"]
        if hasattr(msg, "type") and msg.type == "ai" and msg.content
    ]

    if ai_messages:
        return _extract_text(ai_messages[-1].content)

    return "I'm sorry, I couldn't generate a response. Please try again."
