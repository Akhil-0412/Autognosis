import os
import re
import json
from typing import Optional
from pydantic import BaseModel, Field
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage
from langgraph.prebuilt import create_react_agent
from langchain_community.tools.tavily_search import TavilySearchResults
from langchain_core.tools import tool
from database import query_history_rag, fetch_warranty_status


# Models drift back into markdown and typographic dashes however firmly the
# prompt forbids them, and the dashboard renders replies as plain text, so the
# markup lands on screen verbatim. Strip it on the way out rather than trusting
# the model to comply.
# An em dash or horizontal bar is always punctuation, spaced or not, and the
# unspaced one is the giveaway. Always becomes a comma.
_EM_DASH_RE = re.compile(r"\s*[—―]\s*")
# An en dash, figure dash or minus sign is punctuation when it has space around
# it, and a range or a join when it does not (5-60k miles).
_SPACED_DASH_RE = re.compile(r"\s+[–‒−]\s+")
# Whatever is left, plus the non-breaking hyphen, sits inside a word.
_TIGHT_DASH_RE = re.compile(r"[–‒−‑]")

_HEADING_RE = re.compile(r"^\s{0,3}#{1,6}\s*", re.MULTILINE)
_TABLE_ROW_RE = re.compile(r"^\s*\|.*\|\s*$", re.MULTILINE)
_EMPHASIS_RE = re.compile(r"\*{1,3}(\S.*?\S|\S)\*{1,3}")


def _flatten_table_row(match: "re.Match[str]") -> str:
    cells = [c.strip() for c in match.group(0).strip().strip("|").split("|")]
    # Drop the |---|---| separator row entirely.
    if all(set(c) <= set("-: ") for c in cells):
        return ""
    return ": ".join(c for c in cells if c)


def _plain_text(value: str) -> str:
    """Reduce a model reply to plain prose the dashboard can render as-is."""
    if not value:
        return value

    value = _EM_DASH_RE.sub(", ", value)
    value = _SPACED_DASH_RE.sub(", ", value)
    value = _TIGHT_DASH_RE.sub("-", value)

    value = _HEADING_RE.sub("", value)
    value = _TABLE_ROW_RE.sub(_flatten_table_row, value)
    value = _EMPHASIS_RE.sub(r"\1", value)
    value = value.replace("`", "")

    # Tidy the artefacts the substitutions above leave behind.
    value = re.sub(r" ,", ",", value)
    value = re.sub(r",\s*,", ",", value)
    value = re.sub(r"[ \t]{2,}", " ", value)
    value = re.sub(r"\n{3,}", "\n\n", value)
    return value.strip()


# The schema and the prompt both tell the model to stay inside its abilities and
# it still offers to book a garage slot now and then. Suggestions are a fixed
# short list rendered as tappable buttons, so a wrong one is a promise the app
# cannot keep. Drop them outright rather than asking more nicely.
_UNSUPPORTED_SUGGESTION_RE = re.compile(
    r"\b(schedul\w*|book\w*|appointment|reserv\w*|order\w*|purchas\w*|buy|"
    r"call|phone|contact\w*|navigat\w*|directions|tow\w*|nearby|"
    r"charging station\w*|locate)\b",
    re.IGNORECASE,
)

_FALLBACK_SUGGESTIONS = [
    "Look up service history",
    "Check warranty cover",
    "Ask about maintenance",
]


def _supported_suggestions(suggestions: list) -> list:
    kept = [
        s for s in suggestions
        if isinstance(s, str) and s.strip() and not _UNSUPPORTED_SUGGESTION_RE.search(s)
    ]
    # Never leave the user with a single lonely button.
    for spare in _FALLBACK_SUGGESTIONS:
        if len(kept) >= 2:
            break
        if spare not in kept:
            kept.append(spare)
    return kept[:3]


def _clean_result(result: dict) -> dict:
    for key in ("advice", "response"):
        if isinstance(result.get(key), str):
            result[key] = _plain_text(result[key])
    if isinstance(result.get("suggestions"), list):
        result["suggestions"] = _supported_suggestions(
            [_plain_text(s) for s in result["suggestions"] if isinstance(s, str)]
        )
    return result


class Diagnosis(BaseModel):
    """Structured diagnostic response returned to the Autognosis dashboard."""

    # These descriptions are the only instructions that reach LangGraph's final
    # structured-output call, which does not carry the agent's system prompt.
    # Rules that matter for the returned shape have to live here, not there.
    advice: str = Field(
        description=(
            "Plain text response to the user. No markdown headings, no asterisks, "
            "no tables, no backticks, and no em or en dashes."
        )
    )
    suggestions: list[str] = Field(
        default_factory=list,
        description=(
            "Two or three follow-up actions, each under about six words. Only "
            "actions this assistant can carry out in conversation: diagnose a "
            "symptom, look up the service history, check warranty cover, research "
            "a repair, or advise on maintenance. Never booking or scheduling, "
            "ordering parts, contacting a garage, or navigation, as it cannot do "
            "those. Each must suit the vehicle's powertrain: no charging for a "
            "petrol vehicle, no oil or exhaust service for an electric one."
        ),
    )
    video_link: Optional[str] = Field(default=None, description="URL to a relevant video, if any.")
    video_label: Optional[str] = Field(default=None, description="Label for the video, if any.")


# RAG tools connected to Neon pgvector
@tool
async def query_vehicle_history(query: str, vehicle_id: str) -> str:
    """Searches the vehicle's historical service records, receipts, and inspections."""
    return await query_history_rag(query, vehicle_id)

@tool
async def check_warranty_status(part_name: str, vehicle_id: str) -> str:
    """Checks if a specific part is covered under warranty based on past service invoices."""
    return await fetch_warranty_status(part_name, vehicle_id)

async def run_agent(query: str, history: list[dict], vehicle_context: str):
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        return {"response": "Error: GROQ_API_KEY not found.", "suggestions": []}

    try:
        model_name = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")
        llm = ChatGroq(
            api_key=api_key,
            model=model_name,
            temperature=0.3
        )

        system_prompt = f"""You are the Autognosis AI, a persistent intelligent vehicle brain.

        **VEHICLE CONTEXT:**
        {vehicle_context}

        **PERSONA:**
        - Professional, precise, and evidence-based, but friendly and accessible.
        - You act as the central reasoning layer for this vehicle.
        - NEVER expose your underlying architecture, tools, LLM model, or RAG details to the user.
        - Ground your responses in retrieved evidence (service records, warranties). Distinguish between documented facts and inference.

        **DIAGNOSTIC & WARRANTY PROCESS:**
        1. **Retrieve History**: If the user asks about past repairs, use `query_vehicle_history`.
        2. **Check Warranty**: If evaluating a part failure, use `check_warranty_status`.
        3. **External Research**: Use `tavily_search_results_json` if you need external or up-to-date information (e.g. standard repair procedures, recall notices, or typical costs).

        **FOLLOW-UP SUGGESTIONS:**
        - Work out the powertrain from the year, make and model before you suggest
          anything. An F-150 EcoBoost is a turbocharged petrol V6, an F-150
          Lightning is electric, a Prius is a hybrid. Never offer an action that
          does not apply to that powertrain: no charging stations for a petrol
          vehicle, no oil changes or exhaust checks for an EV.
        - Only suggest things you can actually do in this conversation: diagnose a
          symptom, look up the service history, check warranty cover, research a
          repair, or advise on maintenance. You cannot book appointments, order
          parts, or contact a garage, so never offer to.
        - Follow on from what was just said. Do not fall back to generic app
          features.

        **HOW TO WRITE (STRICT):**
        - Write plain text. The dashboard renders your reply exactly as you write it,
          so any markup shows up on screen as punctuation the user has to read around.
        - No headings. Never start a line with # or ##.
        - No asterisks for bold or italics. No markdown tables. No backticks.
        - Never use an em dash, an en dash, or a non-breaking hyphen. Use a comma,
          use a full stop, or rewrite the sentence. Ordinary hyphens inside words
          such as heat-shield are fine.
        - Plain numbered lines like "1. Check the exhaust brackets" are fine.
        - Sound like an experienced mechanic talking to the owner. Short sentences,
          concrete detail, no filler, no throat-clearing preamble.
        - Do not wrap your answer in JSON and do not invent a tool to format it,
          the response is structured for you.
        """

        # Handle Dynamic Initialization
        if query.strip() == "[SYSTEM_INIT]":
            query = (
                "The user has just opened the dashboard. Introduce yourself briefly, acknowledge the vehicle context, "
                "and ask how you can assist them today. Be welcoming."
            )

        # Agent Tools
        tavily_tool = TavilySearchResults(max_results=3)
        tools = [tavily_tool, query_vehicle_history, check_warranty_status]

        # Build message history
        messages = []
        for msg in history:
            if msg["role"] == "user":
                messages.append(HumanMessage(content=msg["content"]))
            elif msg["role"] == "bot":
                messages.append(AIMessage(content=msg["content"]))

        messages.append(HumanMessage(content=query))

        # Reason first with the tools, then package the answer in a second call.
        # Doing both at once (response_format on the agent) makes Groq demand a
        # tool call on turns where the model has nothing to look up, so short
        # replies like the greeting fail with tool_use_failed. Splitting them
        # keeps the tool loop and the schema out of each other's way.
        agent_executor = create_react_agent(llm, tools, prompt=system_prompt)
        response = await agent_executor.ainvoke({"messages": messages})
        final_message = response["messages"][-1].content.strip()

        # No tools are bound to this call, so there is no tool_choice to conflict
        # with, and the schema's field descriptions are the instructions that
        # actually reach it.
        try:
            packager = llm.with_structured_output(Diagnosis)
            packaged = await packager.ainvoke(
                [
                    SystemMessage(
                        content=(
                            "You format a vehicle assistant's reply for its dashboard. "
                            "Copy the reply into `advice` with its meaning unchanged, "
                            "converting any markdown to plain text. Then write the "
                            "follow-up suggestions described by the schema, based on "
                            "what the reply actually discussed."
                        )
                    ),
                    HumanMessage(content=f"Vehicle: {vehicle_context}\n\nReply:\n{final_message}"),
                ]
            )
            if isinstance(packaged, Diagnosis) and packaged.advice.strip():
                return _clean_result(packaged.model_dump())
        except Exception as packaging_err:
            print(f"Response packaging failed, returning prose: {packaging_err}")

        # The model may still have emitted JSON on its own; accept it if valid.
        match = re.search(r'\{.*\}', final_message, re.DOTALL)
        if match:
            try:
                parsed = json.loads(match.group(0))
                if isinstance(parsed, dict) and "advice" in parsed:
                    return _clean_result(parsed)
            except json.JSONDecodeError:
                pass

        # Otherwise the prose itself is the advice, never surface an empty reply.
        return _clean_result({
            "advice": final_message,
            "suggestions": ["Tell me more", "Cost estimate?"],
            "video_link": None,
            "video_label": None
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"response": f"Error during agent execution: {str(e)}", "suggestions": []}
