#!/usr/bin/env python3
"""
CineNexus AI Backend Testing
Tests all 6 sessions of AI/ML features
"""
import requests
import sys
import time
import json
from datetime import datetime

class CineNexusAITester:
    def __init__(self, base_url="https://ai-engine-dev.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def run_test(self, name, method, endpoint, expected_status, data=None, timeout=30):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=timeout)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=timeout)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return True, response.json()
                except:
                    return True, response.text
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}")
                self.failed_tests.append(f"{name}: {response.status_code} - {response.text[:100]}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.failed_tests.append(f"{name}: Exception - {str(e)}")
            return False, {}

    def test_auth(self):
        """Test authentication"""
        print("\n🔐 Testing Authentication...")
        
        # Try bypass login first
        success, response = self.run_test(
            "Bypass Login",
            "POST",
            "api/auth/bypass",
            200
        )
        
        if success and 'token' in response:
            self.token = response['token']
            print(f"✅ Got auth token: {self.token[:20]}...")
            return True
        
        # Try default admin login
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "api/auth/login",
            200,
            data={"email": "admin@cinenexus.com", "password": "admin123"}
        )
        
        if success and 'token' in response:
            self.token = response['token']
            print(f"✅ Got auth token: {self.token[:20]}...")
            return True
            
        return False

    def test_session1_ml_features(self):
        """Test Session 1: ML Engineer Features"""
        print("\n🤖 Testing Session 1: ML Engineer Features...")
        
        # Test TF-IDF comparison
        success, response = self.run_test(
            "TF-IDF Search Comparison",
            "GET",
            "api/search/compare?q=action movie&limit=5",
            200,
            timeout=45
        )
        
        if success:
            print(f"   Overlap: {response.get('overlap_at_5', 0)*100:.1f}%")
            print(f"   Scratch TF-IDF: {len(response.get('scratch_tfidf', {}).get('results', []))} results")
            print(f"   sklearn TF-IDF: {len(response.get('sklearn_tfidf', {}).get('results', []))} results")
        
        # Test collaborative filtering
        success, response = self.run_test(
            "Collaborative Filtering (SVD)",
            "GET",
            "api/recommendations/collaborative?limit=10",
            200,
            timeout=30
        )
        
        if success:
            status = response.get('status', 'unknown')
            print(f"   CF Status: {status}")
            if status == 'insufficient_data':
                print(f"   Expected cold start - need 50+ interactions")
            else:
                print(f"   Movies: {len(response.get('movies', []))}")
        
        # Test HuggingFace sentiment analysis
        success, response = self.run_test(
            "HuggingFace Sentiment Analysis",
            "POST",
            "api/ai/sentiment",
            200,
            data={"texts": ["This movie was amazing!", "Terrible waste of time"]},
            timeout=60  # Model download may take time
        )
        
        if success:
            results = response.get('results', [])
            print(f"   Analyzed {len(results)} texts")
            for i, r in enumerate(results[:2]):
                print(f"   Text {i+1}: {r.get('label')} ({r.get('score', 0)*100:.1f}%)")

    def test_session2_llm_features(self):
        """Test Session 2: LLM Engineer Features"""
        print("\n🧠 Testing Session 2: LLM Engineer Features...")
        
        # Test RAG vector store status
        success, response = self.run_test(
            "RAG Vector Store Status",
            "GET",
            "api/ai/rag/status",
            200
        )
        
        if success:
            print(f"   Indexed: {response.get('total_indexed', 0)} movies")
            print(f"   Model: {response.get('embedding_model', 'unknown')}")
            print(f"   Ready: {response.get('is_ready', False)}")
        
        # Test RAG chat
        success, response = self.run_test(
            "RAG Chat",
            "POST",
            "api/ai/rag/chat",
            200,
            data={"message": "Recommend a sci-fi movie", "session_id": "test"},
            timeout=45
        )
        
        if success:
            print(f"   Response length: {len(response.get('response', ''))}")
            retrieved = response.get('retrieved_movies', [])
            print(f"   Retrieved: {len(retrieved)} movies")
        
        # Test AI Agent with tools
        success, response = self.run_test(
            "AI Agent with Tools",
            "POST",
            "api/ai/agent",
            200,
            data={"message": "Find a horror movie"},
            timeout=60
        )
        
        if success:
            print(f"   Iterations: {response.get('iterations', 0)}")
            tool_calls = response.get('tool_calls', [])
            print(f"   Tool calls: {len(tool_calls)}")
            for tc in tool_calls[:2]:
                print(f"   - {tc.get('tool_name')}: {tc.get('time_ms')}ms")
        
        # Test model card
        success, response = self.run_test(
            "AI Model Card",
            "GET",
            "api/ai/model-card",
            200
        )
        
        if success:
            components = list(response.keys())
            print(f"   Components: {len(components)}")
            for comp in components[:3]:
                print(f"   - {comp}")

    def test_session5_langchain_features(self):
        """Test Session 5: LangChain + LangGraph"""
        print("\n🔗 Testing Session 5: LangChain + LangGraph...")
        
        # Test LangChain RAG
        success, response = self.run_test(
            "LangChain LCEL RAG",
            "POST",
            "api/ai/rag-chain",
            200,
            data={"message": "Recommend a thriller movie"},
            timeout=45
        )
        
        if success:
            print(f"   Chain type: {response.get('chain_type', 'unknown')}")
            print(f"   Retrieved docs: {response.get('retrieval_count', 0)}")
        
        # Test LangGraph self-correcting agent
        success, response = self.run_test(
            "LangGraph Self-Correcting Agent",
            "POST",
            "api/ai/graph-agent",
            200,
            data={"message": "Find action movies with high ratings"},
            timeout=60
        )
        
        if success:
            print(f"   Agent type: {response.get('agent_type', 'unknown')}")
            print(f"   Iterations: {response.get('total_iterations', 0)}")
            critic_scores = response.get('critic_scores', [])
            if critic_scores:
                print(f"   Critic scores: {critic_scores}")

    def test_session6_ott_features(self):
        """Test Session 6: OTT Features"""
        print("\n📺 Testing Session 6: OTT Features...")
        
        # First get a movie ID
        success, response = self.run_test(
            "Get Movies for OTT Test",
            "GET",
            "api/movies?limit=5",
            200
        )
        
        if success and response.get('movies'):
            movie = response['movies'][0]
            movie_id = movie['_id']
            
            # Test watch providers
            success, response = self.run_test(
                "TMDB Watch Providers",
                "GET",
                f"api/movies/{movie_id}/watch-providers",
                200,
                timeout=30
            )
            
            if success:
                print(f"   Movie: {movie.get('title', 'Unknown')}")
                providers = response.get('providers', {})
                print(f"   Available: {response.get('available', False)}")
                if providers:
                    for ptype, plist in providers.items():
                        if plist:
                            print(f"   {ptype}: {', '.join(plist[:3])}")

    def test_ai_lab_page_endpoints(self):
        """Test endpoints used by AI Lab page"""
        print("\n🧪 Testing AI Lab Page Endpoints...")
        
        # Test agent tools info
        success, response = self.run_test(
            "Agent Tools Info",
            "GET",
            "api/ai/agent/tools",
            200
        )
        
        if success:
            tools = response.get('tools', [])
            print(f"   Available tools: {len(tools)}")
            for tool in tools[:3]:
                print(f"   - {tool.get('name')}")
        
        # Test LangChain status
        success, response = self.run_test(
            "LangChain Status",
            "GET",
            "api/ai/langchain/status",
            200
        )
        
        if success:
            print(f"   Chain ready: {response.get('is_ready', False)}")
        
        # Test LangGraph info
        success, response = self.run_test(
            "LangGraph Agent Info",
            "GET",
            "api/ai/graph-agent/info",
            200
        )
        
        if success:
            print(f"   Graph ready: {response.get('is_ready', False)}")
            nodes = response.get('nodes', [])
            print(f"   Nodes: {', '.join(nodes)}")

    def run_all_tests(self):
        """Run all AI feature tests"""
        print("🚀 Starting CineNexus AI Backend Tests")
        print(f"Base URL: {self.base_url}")
        
        start_time = time.time()
        
        # Authentication
        if not self.test_auth():
            print("❌ Authentication failed - stopping tests")
            return False
        
        # Test all sessions
        self.test_session1_ml_features()
        self.test_session2_llm_features()
        self.test_session5_langchain_features()
        self.test_session6_ott_features()
        self.test_ai_lab_page_endpoints()
        
        # Results
        elapsed = time.time() - start_time
        print(f"\n📊 Test Results:")
        print(f"Tests passed: {self.tests_passed}/{self.tests_run}")
        print(f"Success rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        print(f"Total time: {elapsed:.1f}s")
        
        if self.failed_tests:
            print(f"\n❌ Failed tests:")
            for failure in self.failed_tests:
                print(f"   - {failure}")
        
        return self.tests_passed == self.tests_run

def main():
    tester = CineNexusAITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())