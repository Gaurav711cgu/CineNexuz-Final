"""
CineNexus AI Agent with Tool Calling
Agentic AI — autonomous multi-step task completion via tool calling.

Tools: search_movies, get_movie_details, check_streaming_availability,
       get_theatre_shows, get_ai_recommendation
Max iterations: 5 (prevents infinite loops)
Each tool call is logged to tool_trace for full transparency.
"""
import os
import json
import time
import httpx
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional, Callable
from bson import ObjectId

# Environment
TMDB_API_KEY = os.environ.get("TMDB_API_KEY", "")
TMDB_BASE = "https://api.themoviedb.org/3"
EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY", "")

# Tool definitions for LLM
CINENEXUS_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "search_movies",
            "description": "Search the CineNexus movie catalog by query, genre, mood, or actor name",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "Search query"},
                    "genre": {"type": "string", "description": "Filter by genre"},
                    "min_rating": {"type": "number", "description": "Minimum rating (0-10)"},
                    "limit": {"type": "integer", "description": "Max results", "default": 5}
                },
                "required": ["query"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_movie_details",
            "description": "Get full details of a movie: cast, rating, genres, overview",
            "parameters": {
                "type": "object",
                "properties": {
                    "movie_id": {"type": "string", "description": "Movie ID from database"}
                },
                "required": ["movie_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "check_streaming_availability",
            "description": "Check which OTT platforms (Netflix, Prime, Hotstar) a movie is on in India",
            "parameters": {
                "type": "object",
                "properties": {
                    "movie_id": {"type": "string", "description": "Movie ID from database"},
                    "tmdb_id": {"type": "integer", "description": "TMDB ID if known"}
                },
                "required": ["movie_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_theatre_shows",
            "description": "Find theatre shows for a movie with seat availability and pricing",
            "parameters": {
                "type": "object",
                "properties": {
                    "movie_id": {"type": "string", "description": "Movie ID"},
                    "city": {"type": "string", "description": "City name"},
                    "date": {"type": "string", "description": "Date in YYYY-MM-DD format"}
                },
                "required": ["movie_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_ai_recommendation",
            "description": "Get AI-powered movie recommendations by mood, taste, or similar title",
            "parameters": {
                "type": "object",
                "properties": {
                    "mood": {"type": "string", "description": "Mood like happy, sad, thrilling"},
                    "similar_to": {"type": "string", "description": "Movie title to find similar to"},
                    "user_id": {"type": "string", "description": "User ID for personalized recs"}
                }
            }
        }
    }
]


class CineNexusAgent:
    """
    Agentic AI — autonomous multi-step task completion via tool calling.

    Tools: search_movies, get_movie_details, check_streaming_availability,
           get_theatre_shows, get_ai_recommendation
    Max iterations: 5 (prevents infinite loops)
    Each tool call is logged to tool_trace for full transparency.
    """
    
    def __init__(self):
        self.max_iterations = 5
        self.tools = CINENEXUS_TOOLS
        self.db = None
        self.vector_store = None

    def set_dependencies(self, db, vector_store=None):
        """Set database and vector store dependencies."""
        self.db = db
        self.vector_store = vector_store

    async def execute_tool(self, tool_name: str, tool_input: Dict, user_id: str = None) -> Dict:
        """
        Execute a tool and return result.
        Routes to actual backend functions.
        """
        start_time = time.time()
        result = {"error": "Unknown tool"}
        
        try:
            if tool_name == "search_movies":
                result = await self._search_movies(tool_input)
            elif tool_name == "get_movie_details":
                result = await self._get_movie_details(tool_input)
            elif tool_name == "check_streaming_availability":
                result = await self._check_streaming_availability(tool_input)
            elif tool_name == "get_theatre_shows":
                result = await self._get_theatre_shows(tool_input)
            elif tool_name == "get_ai_recommendation":
                result = await self._get_ai_recommendation(tool_input, user_id)
            else:
                result = {"error": f"Unknown tool: {tool_name}"}
                
        except Exception as e:
            result = {"error": str(e)}
        
        execution_time = int((time.time() - start_time) * 1000)
        return {"result": result, "execution_time_ms": execution_time}

    async def _search_movies(self, params: Dict) -> Dict:
        """Search movies in MongoDB."""
        if not self.db:
            return {"error": "Database not available"}
        
        query = params.get("query", "")
        genre = params.get("genre")
        min_rating = params.get("min_rating", 0)
        limit = params.get("limit", 5)
        
        mongo_query = {}
        if query:
            mongo_query["$or"] = [
                {"title": {"$regex": query, "$options": "i"}},
                {"overview": {"$regex": query, "$options": "i"}},
                {"cast_names": {"$regex": query, "$options": "i"}}
            ]
        if genre:
            mongo_query["genres"] = genre
        if min_rating:
            mongo_query["vote_average"] = {"$gte": min_rating}
        
        movies = await self.db.movies.find(mongo_query).sort("popularity", -1).limit(limit).to_list(limit)
        
        return {
            "movies": [
                {
                    "id": str(m["_id"]),
                    "title": m.get("title"),
                    "genres": m.get("genres", []),
                    "vote_average": m.get("vote_average"),
                    "overview": m.get("overview", "")[:150]
                }
                for m in movies
            ],
            "count": len(movies)
        }

    async def _get_movie_details(self, params: Dict) -> Dict:
        """Get movie details from MongoDB."""
        if not self.db:
            return {"error": "Database not available"}
        
        movie_id = params.get("movie_id")
        if not movie_id:
            return {"error": "movie_id required"}
        
        try:
            movie = await self.db.movies.find_one({"_id": ObjectId(movie_id)})
        except:
            movie = await self.db.movies.find_one({"tmdb_id": int(movie_id)}) if movie_id.isdigit() else None
        
        if not movie:
            return {"error": "Movie not found"}
        
        return {
            "id": str(movie["_id"]),
            "title": movie.get("title"),
            "overview": movie.get("overview"),
            "genres": movie.get("genres", []),
            "cast": movie.get("cast_names", [])[:5],
            "vote_average": movie.get("vote_average"),
            "runtime": movie.get("runtime"),
            "release_date": movie.get("release_date"),
            "in_theatres": movie.get("in_theatres", False),
            "rent_price": movie.get("rent_price"),
            "buy_price": movie.get("buy_price"),
            "tmdb_id": movie.get("tmdb_id")
        }

    async def _check_streaming_availability(self, params: Dict) -> Dict:
        """Check OTT availability via TMDB Watch Providers API."""
        movie_id = params.get("movie_id")
        tmdb_id = params.get("tmdb_id")
        
        # Get tmdb_id from database if not provided
        if not tmdb_id and self.db:
            try:
                movie = await self.db.movies.find_one({"_id": ObjectId(movie_id)})
                if movie:
                    tmdb_id = movie.get("tmdb_id")
            except:
                pass
        
        if not tmdb_id or not TMDB_API_KEY:
            return {"error": "TMDB ID or API key not available"}
        
        try:
            url = f"{TMDB_BASE}/movie/{tmdb_id}/watch/providers"
            async with httpx.AsyncClient() as client:
                resp = await client.get(url, params={"api_key": TMDB_API_KEY}, timeout=10)
            data = resp.json()
            
            india_data = data.get("results", {}).get("IN", {})
            
            providers = {
                "flatrate": [p.get("provider_name") for p in india_data.get("flatrate", [])],
                "rent": [p.get("provider_name") for p in india_data.get("rent", [])],
                "buy": [p.get("provider_name") for p in india_data.get("buy", [])]
            }
            
            return {
                "available": bool(india_data),
                "region": "IN",
                "providers": providers
            }
            
        except Exception as e:
            return {"error": str(e)}

    async def _get_theatre_shows(self, params: Dict) -> Dict:
        """Get theatre shows from MongoDB."""
        if not self.db:
            return {"error": "Database not available"}
        
        movie_id = params.get("movie_id")
        city = params.get("city")
        date = params.get("date")
        
        query = {"movie_id": movie_id}
        if city:
            city_doc = await self.db.cities.find_one({"name": {"$regex": city, "$options": "i"}})
            if city_doc:
                query["city_id"] = str(city_doc["_id"])
        if date:
            query["date"] = date
        
        shows = await self.db.shows.find(query).limit(10).to_list(10)
        
        return {
            "shows": [
                {
                    "id": str(s["_id"]),
                    "theatre": s.get("theatre_name"),
                    "screen": s.get("screen_name"),
                    "date": s.get("date"),
                    "time": s.get("time"),
                    "booked_seats": len(s.get("booked_seats", []))
                }
                for s in shows
            ],
            "count": len(shows)
        }

    async def _get_ai_recommendation(self, params: Dict, user_id: str = None) -> Dict:
        """Get AI recommendations via vector store or content-based."""
        mood = params.get("mood")
        similar_to = params.get("similar_to")
        
        if self.vector_store and self.vector_store.is_ready:
            query = mood or similar_to or "popular entertaining movie"
            results = self.vector_store.retrieve(query, top_k=5)
            return {
                "recommendations": results,
                "method": "vector_similarity"
            }
        
        # Fallback to popular
        if self.db:
            movies = await self.db.movies.find().sort("popularity", -1).limit(5).to_list(5)
            return {
                "recommendations": [
                    {"movie_id": str(m["_id"]), "title": m.get("title"), "vote_average": m.get("vote_average")}
                    for m in movies
                ],
                "method": "popularity_fallback"
            }
        
        return {"error": "No recommendation method available"}

    async def run(self, user_message: str, user_id: str = None, session_id: str = None) -> Dict:
        """
        Agentic loop:
        1. Send message + tools to LLM
        2. If tool_use in response: execute tool, append result to messages, loop
        3. If text response: task complete, return
        4. Track full tool_trace for transparency
        """
        if not EMERGENT_LLM_KEY:
            return {
                "response": "AI agent not available - missing API key",
                "tool_calls": [],
                "iterations": 0,
                "agent_mode": False
            }
        
        messages = [
            {
                "role": "system",
                "content": """You are CineNexus AI Agent, an intelligent movie assistant with access to tools.
Use the tools to search for movies, get details, check streaming availability, find theatre shows, and get recommendations.
Always use tools to get accurate, real-time information before responding.
Be helpful, concise, and include specific movie recommendations with details."""
            },
            {"role": "user", "content": user_message}
        ]
        tool_trace = []
        
        for iteration in range(self.max_iterations):
            try:
                # Call LLM with tools
                async with httpx.AsyncClient() as client:
                    response = await client.post(
                        "https://api.emergentai.xyz/v1/chat/completions",
                        headers={
                            "Authorization": f"Bearer {EMERGENT_LLM_KEY}",
                            "Content-Type": "application/json"
                        },
                        json={
                            "model": "gpt-4o-mini",
                            "messages": messages,
                            "tools": self.tools,
                            "tool_choice": "auto",
                            "temperature": 0.7
                        },
                        timeout=30
                    )
                
                if not response.is_success:
                    return {
                        "response": f"LLM error: {response.status_code}",
                        "tool_calls": tool_trace,
                        "iterations": iteration + 1,
                        "agent_mode": True
                    }
                
                result = response.json()
                choice = result.get("choices", [{}])[0]
                message = choice.get("message", {})
                
                # Check for tool calls
                tool_calls = message.get("tool_calls", [])
                
                if tool_calls:
                    # Add assistant message with tool calls
                    messages.append(message)
                    
                    # Execute each tool
                    for tc in tool_calls:
                        func = tc.get("function", {})
                        tool_name = func.get("name")
                        tool_args_str = func.get("arguments", "{}")
                        
                        try:
                            tool_args = json.loads(tool_args_str)
                        except:
                            tool_args = {}
                        
                        # Execute tool
                        tool_result = await self.execute_tool(tool_name, tool_args, user_id)
                        
                        # Log to trace
                        tool_trace.append({
                            "tool_name": tool_name,
                            "input": tool_args,
                            "output": tool_result.get("result"),
                            "time_ms": tool_result.get("execution_time_ms")
                        })
                        
                        # Add tool result to messages
                        messages.append({
                            "role": "tool",
                            "tool_call_id": tc.get("id"),
                            "content": json.dumps(tool_result.get("result", {}))
                        })
                else:
                    # No tool calls - return text response
                    final_text = message.get("content", "I couldn't process that request.")
                    return {
                        "response": final_text,
                        "tool_calls": tool_trace,
                        "iterations": iteration + 1,
                        "agent_mode": True
                    }
                    
            except Exception as e:
                return {
                    "response": f"Agent error: {str(e)}",
                    "tool_calls": tool_trace,
                    "iterations": iteration + 1,
                    "agent_mode": True
                }
        
        # Max iterations reached
        return {
            "response": "I've gathered the information but reached the maximum steps. Here's what I found based on the tools executed.",
            "tool_calls": tool_trace,
            "iterations": self.max_iterations,
            "agent_mode": True,
            "max_iterations_reached": True
        }

    def get_tools_info(self) -> List[Dict]:
        """Return information about available tools."""
        return [
            {
                "name": t["function"]["name"],
                "description": t["function"]["description"],
                "parameters": list(t["function"]["parameters"].get("properties", {}).keys())
            }
            for t in self.tools
        ]


# Global instance
cinenexus_agent = CineNexusAgent()
