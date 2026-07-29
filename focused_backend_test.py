#!/usr/bin/env python3
"""
CineNexus AI Backend Testing - Individual Endpoint Tests
Tests each AI endpoint separately with proper timeouts
"""
import requests
import sys
import time
import json

class CineNexusAITester:
    def __init__(self, base_url="https://ai-engine-dev.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.results = {}

    def test_endpoint(self, name, method, endpoint, data=None, timeout=30, auth_required=False):
        """Test a single endpoint"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if auth_required and self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {endpoint}")
        
        try:
            start_time = time.time()
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=timeout)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=timeout)
            
            elapsed = time.time() - start_time
            
            if response.status_code == 200:
                print(f"✅ Success - {response.status_code} ({elapsed:.1f}s)")
                try:
                    result = response.json()
                    self.results[name] = {"status": "success", "data": result, "time": elapsed}
                    return True, result
                except:
                    self.results[name] = {"status": "success", "data": response.text, "time": elapsed}
                    return True, response.text
            else:
                print(f"❌ Failed - {response.status_code} ({elapsed:.1f}s)")
                print(f"   Response: {response.text[:200]}")
                self.results[name] = {"status": "failed", "error": response.text, "time": elapsed}
                return False, {}

        except requests.exceptions.Timeout:
            print(f"⏰ Timeout after {timeout}s")
            self.results[name] = {"status": "timeout", "timeout": timeout}
            return False, {}
        except Exception as e:
            print(f"❌ Exception: {str(e)}")
            self.results[name] = {"status": "exception", "error": str(e)}
            return False, {}

    def test_auth(self):
        """Test authentication"""
        print("\n🔐 Testing Authentication...")
        success, response = self.test_endpoint("Auth Bypass", "POST", "api/auth/bypass", timeout=10)
        
        if success and isinstance(response, dict) and 'token' in response:
            self.token = response['token']
            print(f"✅ Got auth token")
            return True
        return False

    def test_basic_endpoints(self):
        """Test basic non-AI endpoints"""
        print("\n📋 Testing Basic Endpoints...")
        
        self.test_endpoint("Movies List", "GET", "api/movies?limit=5", timeout=10)
        self.test_endpoint("Movie Genres", "GET", "api/movies/genres", timeout=10)

    def test_session1_endpoints(self):
        """Test Session 1: ML Engineer Features"""
        print("\n🤖 Testing Session 1: ML Engineer Features...")
        
        # TF-IDF Search Comparison
        self.test_endpoint(
            "TF-IDF Search Comparison", 
            "GET", 
            "api/search/compare?q=action&limit=3", 
            timeout=45
        )
        
        # Collaborative Filtering (requires auth)
        self.test_endpoint(
            "Collaborative Filtering", 
            "GET", 
            "api/recommendations/collaborative?limit=5", 
            timeout=30,
            auth_required=True
        )
        
        # HuggingFace Sentiment Analysis
        self.test_endpoint(
            "HuggingFace Sentiment", 
            "POST", 
            "api/ai/sentiment",
            data={"texts": ["This movie was great!", "Terrible film"]},
            timeout=60
        )

    def test_session2_endpoints(self):
        """Test Session 2: LLM Engineer Features"""
        print("\n🧠 Testing Session 2: LLM Engineer Features...")
        
        # RAG Status
        self.test_endpoint("RAG Status", "GET", "api/ai/rag/status", timeout=15)
        
        # Model Card
        self.test_endpoint("Model Card", "GET", "api/ai/model-card", timeout=15)
        
        # Agent Tools
        self.test_endpoint("Agent Tools", "GET", "api/ai/agent/tools", timeout=15)

    def test_session5_endpoints(self):
        """Test Session 5: LangChain Features"""
        print("\n🔗 Testing Session 5: LangChain Features...")
        
        # LangChain Status
        self.test_endpoint("LangChain Status", "GET", "api/ai/langchain/status", timeout=15)
        
        # LangGraph Info
        self.test_endpoint("LangGraph Info", "GET", "api/ai/graph-agent/info", timeout=15)

    def test_session6_endpoints(self):
        """Test Session 6: OTT Features"""
        print("\n📺 Testing Session 6: OTT Features...")
        
        # First get a movie ID
        success, response = self.test_endpoint("Get Movie for OTT", "GET", "api/movies?limit=1", timeout=10)
        
        if success and isinstance(response, dict) and response.get('movies'):
            movie_id = response['movies'][0]['_id']
            self.test_endpoint(
                "Watch Providers", 
                "GET", 
                f"api/movies/{movie_id}/watch-providers", 
                timeout=30
            )

    def run_tests(self):
        """Run all tests"""
        print("🚀 Starting CineNexus AI Backend Tests")
        print(f"Base URL: {self.base_url}")
        
        start_time = time.time()
        
        # Test authentication first
        if not self.test_auth():
            print("❌ Authentication failed - continuing with limited tests")
        
        # Test basic functionality
        self.test_basic_endpoints()
        
        # Test AI features
        self.test_session1_endpoints()
        self.test_session2_endpoints()
        self.test_session5_endpoints()
        self.test_session6_endpoints()
        
        # Summary
        elapsed = time.time() - start_time
        print(f"\n📊 Test Summary:")
        print(f"Total time: {elapsed:.1f}s")
        
        success_count = sum(1 for r in self.results.values() if r.get('status') == 'success')
        total_count = len(self.results)
        
        print(f"Successful: {success_count}/{total_count}")
        
        # Show failed tests
        failed_tests = [name for name, result in self.results.items() if result.get('status') != 'success']
        if failed_tests:
            print(f"\n❌ Failed/Timeout tests:")
            for test_name in failed_tests:
                result = self.results[test_name]
                status = result.get('status', 'unknown')
                if status == 'timeout':
                    print(f"   - {test_name}: Timeout ({result.get('timeout')}s)")
                elif status == 'failed':
                    print(f"   - {test_name}: HTTP Error")
                elif status == 'exception':
                    print(f"   - {test_name}: {result.get('error', 'Unknown error')}")
        
        return success_count, total_count

def main():
    tester = CineNexusAITester()
    success, total = tester.run_tests()
    
    # Save results
    with open('/app/test_results.json', 'w') as f:
        json.dump(tester.results, f, indent=2)
    
    return 0 if success == total else 1

if __name__ == "__main__":
    sys.exit(main())