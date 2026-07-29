#!/usr/bin/env python3
"""
Simple CineNexus Backend Test
Quick test of basic functionality
"""
import requests
import sys
import time

def test_endpoint(name, url, timeout=10):
    """Test a single endpoint"""
    print(f"Testing {name}...")
    try:
        response = requests.get(url, timeout=timeout)
        print(f"  Status: {response.status_code}")
        if response.status_code == 200:
            try:
                data = response.json()
                print(f"  Response: {str(data)[:100]}...")
                return True
            except:
                print(f"  Response: {response.text[:100]}...")
                return True
        else:
            print(f"  Error: {response.text[:100]}")
            return False
    except Exception as e:
        print(f"  Exception: {str(e)}")
        return False

def main():
    base_url = "https://ai-engine-dev.preview.emergentagent.com"
    
    print(f"Testing CineNexus Backend at {base_url}")
    
    tests = [
        ("Auth Bypass", f"{base_url}/api/auth/bypass"),
        ("Movies List", f"{base_url}/api/movies?limit=5"),
        ("Search Compare", f"{base_url}/api/search/compare?q=action&limit=3"),
        ("RAG Status", f"{base_url}/api/ai/rag/status"),
        ("Model Card", f"{base_url}/api/ai/model-card"),
    ]
    
    passed = 0
    total = len(tests)
    
    for name, url in tests:
        if test_endpoint(name, url):
            passed += 1
        print()
    
    print(f"Results: {passed}/{total} tests passed")
    return 0 if passed == total else 1

if __name__ == "__main__":
    sys.exit(main())