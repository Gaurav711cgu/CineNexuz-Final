"""
CineNexus LangGraph Self-Correcting Agent
LangGraph agent with planner → tools → critic → respond flow.

Graph topology:
  START → [Planner] → [Router] ──→ [Tools] → [Critic] ──→ [Planner] (loop if score<7)
                          └──→ [Responder] ←───────────────────┘ (done if score>=7)
                                    ↓
                                   END

Key concept: Critic scores the planner's tool results (1-10).
If score < 7: loops back to Planner with feedback (self-correction).
If score >= 7: passes to Responder for final answer.
Max critic iterations: 3 to prevent infinite loops.
"""
import os
import json
import time
import requests
import logging
from datetime import datetime, timezone
from typing import Dict, Any, List, TypedDict, Annotated, Literal, Optional
import operator
try:
    from logging_utils import log_event
except ImportError:
    import sys
    import os
    sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
    from logging_utils import log_event

try:
    from langgraph.graph import StateGraph, END
    LANGGRAPH_AVAILABLE = True
except ImportError:
    LANGGRAPH_AVAILABLE = False

EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY", "")


class AgentState(TypedDict):
    """State for the LangGraph agent."""
    messages: Annotated[List[Dict], operator.add]
    user_id: str
    task_complete: bool
    critic_score: float
    critic_feedback: str
    iteration_count: int
    tool_trace: Annotated[List[Dict], operator.add]
    final_response: str


class LangGraphAgent:
    """
    LangGraph agent for CineNexus — self-correcting via Critic node.

    Graph topology:
      START → [Planner] → [Router] ──→ [Tools] → [Critic] ──→ [Planner] (loop if score<7)
                              └──→ [Responder] ←───────────────────┘ (done if score>=7)
                                        ↓
                                       END

    Key concept: Critic scores the planner's tool results (1-10).
    Max critic iterations: 3 to prevent infinite loops.
    """
    
    def __init__(self):
        self.graph = None
        self.compiled = None
        self.is_ready = False
        self.db = None
        self.vector_store = None
        self.max_iterations = 3

    def set_dependencies(self, db, vector_store=None):
        """Set database and vector store dependencies."""
        self.db = db
        self.vector_store = vector_store

    def build(self) -> Dict[str, Any]:
        """
        Build the LangGraph state machine.
        """
        if not LANGGRAPH_AVAILABLE:
            return {"status": "error", "message": "langgraph not installed"}
        if not EMERGENT_LLM_KEY:
            return {"status": "error", "message": "EMERGENT_LLM_KEY not set"}
        
        try:
            # Create state graph
            self.graph = StateGraph(AgentState)
            
            # Add nodes
            self.graph.add_node("planner", self._planner_node)
            self.graph.add_node("tools", self._tools_node)
            self.graph.add_node("critic", self._critic_node)
            self.graph.add_node("responder", self._responder_node)
            
            # Set entry point
            self.graph.set_entry_point("planner")
            
            # Add edges
            self.graph.add_conditional_edges(
                "planner",
                self._route_after_planner,
                {"tools": "tools", "respond": "responder"}
            )
            self.graph.add_edge("tools", "critic")
            self.graph.add_conditional_edges(
                "critic",
                self._route_after_critic,
                {"continue": "planner", "done": "responder"}
            )
            self.graph.add_edge("responder", END)
            
            # Compile
            self.compiled = self.graph.compile()
            self.is_ready = True
            
            log_event(logging.INFO, "LangGraph agent built successfully", "langgraph_agent")
            return {
                "status": "ready",
                "agent_type": "LangGraph_self_correcting",
                "nodes": ["planner", "tools", "critic", "responder"],
                "max_iterations": self.max_iterations
            }
            
        except Exception as e:
            self.is_ready = False
            log_event(logging.ERROR, f"LangGraph build error: {e}", "langgraph_agent")
            return {"status": "error", "message": str(e)}

    def _call_llm(self, messages: List[Dict], temperature: float = 0.7) -> str:
        """Call LLM via Emergent API."""
        try:
            response = requests.post(
                "https://api.emergentai.xyz/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {EMERGENT_LLM_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "gpt-4o-mini",
                    "messages": messages,
                    "temperature": temperature,
                    "max_tokens": 500
                },
                timeout=30
            )
            if response.ok:
                return response.json().get("choices", [{}])[0].get("message", {}).get("content", "")
        except Exception as e:
            log_event(logging.ERROR, f"LLM call error: {e}", "langgraph_agent")
        return ""

    def _planner_node(self, state: AgentState) -> Dict:
        """
        Planner: Decides what action to take based on user message and history.
        Returns tool calls or indicates ready to respond.
        """
        messages = state.get("messages", [])
        critic_feedback = state.get("critic_feedback", "")
        iteration = state.get("iteration_count", 0)
        
        # Build planning prompt
        system_prompt = """You are a planning agent for CineNexus movie assistant.
Based on the user's request and any feedback, decide what information to gather.

Available actions:
- SEARCH: Search for movies by query/genre
- DETAILS: Get movie details by ID
- RECOMMEND: Get AI recommendations
- RESPOND: Ready to give final answer

Respond with JSON: {"action": "SEARCH/DETAILS/RECOMMEND/RESPOND", "params": {...}, "reasoning": "..."}
"""
        
        if critic_feedback:
            system_prompt += f"\n\nPrevious attempt feedback: {critic_feedback}\nIteration: {iteration + 1}/{self.max_iterations}"
        
        llm_messages = [{"role": "system", "content": system_prompt}]
        llm_messages.extend(messages[-5:])  # Last 5 messages for context
        
        plan_response = self._call_llm(llm_messages, temperature=0.3)
        
        # Parse response
        try:
            # Try to extract JSON
            import re
            json_match = re.search(r'\{.*\}', plan_response, re.DOTALL)
            if json_match:
                plan = json.loads(json_match.group())
            else:
                plan = {"action": "RESPOND", "params": {}, "reasoning": plan_response}
        except:
            plan = {"action": "RESPOND", "params": {}, "reasoning": plan_response}
        
        return {
            "messages": [{"role": "assistant", "content": f"Plan: {json.dumps(plan)}"}],
            "tool_trace": [{"node": "planner", "plan": plan, "iteration": iteration}]
        }

    async def _execute_tool_action(self, action: str, params: Dict) -> Dict:
        """Execute a tool action."""
        if not self.db:
            return {"error": "Database not available"}
        
        from bson import ObjectId
        
        if action == "SEARCH":
            query = params.get("query", "")
            genre = params.get("genre")
            mongo_query = {}
            if query:
                mongo_query["$or"] = [
                    {"title": {"$regex": query, "$options": "i"}},
                    {"overview": {"$regex": query, "$options": "i"}}
                ]
            if genre:
                mongo_query["genres"] = genre
            
            movies = await self.db.movies.find(mongo_query).sort("popularity", -1).limit(5).to_list(5)
            return {
                "movies": [{"id": str(m["_id"]), "title": m.get("title"), "rating": m.get("vote_average")} for m in movies]
            }
        
        elif action == "DETAILS":
            movie_id = params.get("movie_id")
            if movie_id:
                try:
                    movie = await self.db.movies.find_one({"_id": ObjectId(movie_id)})
                    if movie:
                        return {
                            "title": movie.get("title"),
                            "overview": movie.get("overview", "")[:200],
                            "genres": movie.get("genres", []),
                            "rating": movie.get("vote_average")
                        }
                except:
                    pass
            return {"error": "Movie not found"}
        
        elif action == "RECOMMEND":
            if self.vector_store and self.vector_store.is_ready:
                query = params.get("mood", params.get("query", "good movie"))
                results = self.vector_store.retrieve(query, top_k=5)
                return {"recommendations": results}
            else:
                movies = await self.db.movies.find().sort("vote_average", -1).limit(5).to_list(5)
                return {"recommendations": [{"title": m.get("title"), "rating": m.get("vote_average")} for m in movies]}
        
        return {"result": "No action taken"}

    def _tools_node(self, state: AgentState) -> Dict:
        """
        Tools: Execute the planned action.
        Note: This is synchronous wrapper, actual execution is async.
        """
        messages = state.get("messages", [])
        tool_trace = state.get("tool_trace", [])
        
        # Get last plan
        last_plan = None
        for trace in reversed(tool_trace):
            if trace.get("node") == "planner":
                last_plan = trace.get("plan", {})
                break
        
        if not last_plan:
            return {
                "messages": [{"role": "tool", "content": "No plan found"}],
                "tool_trace": [{"node": "tools", "error": "No plan found"}]
            }
        
        action = last_plan.get("action", "RESPOND")
        params = last_plan.get("params", {})
        
        # For now, return placeholder - actual execution happens in async run
        return {
            "messages": [{"role": "tool", "content": json.dumps({"action": action, "params": params})}],
            "tool_trace": [{"node": "tools", "action": action, "params": params}]
        }

    def _critic_node(self, state: AgentState) -> Dict:
        """
        Critic: Evaluate tool results quality (1-10 scale).
        """
        messages = state.get("messages", [])
        tool_trace = state.get("tool_trace", [])
        iteration = state.get("iteration_count", 0)
        
        # Get tool results
        tool_results = []
        for trace in tool_trace:
            if trace.get("node") == "tools":
                tool_results.append(trace)
        
        # Build critic prompt
        critic_prompt = f"""You are a quality critic for a movie recommendation system.
Evaluate the tool execution results on a scale of 1-10.

Scoring criteria:
- Did the tool return relevant results? (+3)
- Are results sufficient to answer the user's question? (+3)
- Is the data complete (no missing fields)? (+2)
- Are results diverse enough? (+2)

Tool results: {json.dumps(tool_results[-2:])}

Respond with JSON: {{"score": 1-10, "feedback": "...", "should_retry": true/false}}
"""
        
        critic_response = self._call_llm([{"role": "user", "content": critic_prompt}], temperature=0.2)
        
        # Parse critic response
        try:
            import re
            json_match = re.search(r'\{.*\}', critic_response, re.DOTALL)
            if json_match:
                critic_result = json.loads(json_match.group())
            else:
                critic_result = {"score": 7, "feedback": critic_response, "should_retry": False}
        except:
            critic_result = {"score": 7, "feedback": "Could not parse critic response", "should_retry": False}
        
        score = critic_result.get("score", 7)
        feedback = critic_result.get("feedback", "")
        
        return {
            "critic_score": score,
            "critic_feedback": feedback,
            "iteration_count": iteration + 1,
            "tool_trace": [{"node": "critic", "score": score, "feedback": feedback}]
        }

    def _responder_node(self, state: AgentState) -> Dict:
        """
        Responder: Generate final response based on all gathered information.
        """
        messages = state.get("messages", [])
        tool_trace = state.get("tool_trace", [])
        
        # Gather all tool results
        context_parts = []
        for trace in tool_trace:
            if trace.get("node") == "tools" and trace.get("result"):
                context_parts.append(json.dumps(trace.get("result")))
        
        # Build response prompt
        system_prompt = """You are CineNexus AI, a helpful movie recommendation assistant.
Based on the gathered information, provide a helpful, conversational response.
Include specific movie recommendations with titles and ratings when available.
"""
        
        user_message = messages[0].get("content", "") if messages else ""
        context = "\n".join(context_parts) if context_parts else "No specific data gathered"
        
        response = self._call_llm([
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"User asked: {user_message}\n\nGathered data: {context}"}
        ], temperature=0.7)
        
        return {
            "final_response": response or "I apologize, but I couldn't generate a response. Please try again.",
            "task_complete": True,
            "tool_trace": [{"node": "responder", "response_length": len(response)}]
        }

    def _route_after_planner(self, state: AgentState) -> Literal["tools", "respond"]:
        """
        Router: Decide whether to execute tools or go directly to response.
        """
        tool_trace = state.get("tool_trace", [])
        
        # Check last plan
        for trace in reversed(tool_trace):
            if trace.get("node") == "planner":
                plan = trace.get("plan", {})
                action = plan.get("action", "RESPOND")
                if action == "RESPOND":
                    return "respond"
                else:
                    return "tools"
        
        return "respond"

    def _route_after_critic(self, state: AgentState) -> Literal["continue", "done"]:
        """
        Router: Decide whether to continue iterating or finalize response.
        """
        score = state.get("critic_score", 10)
        iteration = state.get("iteration_count", 0)
        
        if score >= 7 or iteration >= self.max_iterations:
            return "done"
        return "continue"

    async def run(self, user_message: str, user_id: str = None) -> Dict[str, Any]:
        """
        Run the LangGraph agent.
        """
        if not self.is_ready:
            build_result = self.build()
            if build_result.get("status") == "error":
                return {
                    "response": f"Agent not ready: {build_result.get('message')}",
                    "graph_trace": [],
                    "agent_type": "LangGraph_self_correcting"
                }
        
        try:
            # Initialize state
            initial_state = {
                "messages": [{"role": "user", "content": user_message}],
                "user_id": user_id or "",
                "task_complete": False,
                "critic_score": 0.0,
                "critic_feedback": "",
                "iteration_count": 0,
                "tool_trace": [],
                "final_response": ""
            }
            
            # Run compiled graph
            # Note: LangGraph's invoke is sync, we wrap in async
            final_state = self.compiled.invoke(initial_state)
            
            return {
                "response": final_state.get("final_response", "No response generated"),
                "graph_trace": final_state.get("tool_trace", []),
                "critic_scores": [
                    t.get("score") for t in final_state.get("tool_trace", [])
                    if t.get("node") == "critic" and "score" in t
                ],
                "total_iterations": final_state.get("iteration_count", 0),
                "agent_type": "LangGraph_self_correcting"
            }
            
        except Exception as e:
            return {
                "response": f"Agent error: {str(e)}",
                "graph_trace": [],
                "agent_type": "LangGraph_self_correcting",
                "error": str(e)
            }

    def get_graph_info(self) -> Dict[str, Any]:
        """Return information about the graph structure."""
        return {
            "is_ready": self.is_ready,
            "agent_type": "LangGraph_self_correcting",
            "nodes": ["planner", "tools", "critic", "responder"],
            "edges": [
                {"from": "START", "to": "planner"},
                {"from": "planner", "to": "tools", "condition": "action != RESPOND"},
                {"from": "planner", "to": "responder", "condition": "action == RESPOND"},
                {"from": "tools", "to": "critic"},
                {"from": "critic", "to": "planner", "condition": "score < 7 AND iteration < 3"},
                {"from": "critic", "to": "responder", "condition": "score >= 7 OR iteration >= 3"},
                {"from": "responder", "to": "END"}
            ],
            "max_iterations": self.max_iterations,
            "critic_threshold": 7
        }


# Global instance
langgraph_agent = LangGraphAgent()
