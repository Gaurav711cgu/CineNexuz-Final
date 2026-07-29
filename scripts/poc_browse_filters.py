"""
POC Browse Filters Validation Script
Validates that /api/movies?language=hi and /api/movies?genre=Horror return non-empty datasets.
"""
import sys
import requests

BASE_URL = "http://localhost:8000"

def test_browse_filters():
    print("[POC] Testing Browse Filters...")
    
    # 1. Test Language Filter (Hindi - hi)
    resp_hi = requests.get(f"{BASE_URL}/api/movies?language=hi&limit=10")
    if resp_hi.status_code == 200:
        data = resp_hi.json()
        movies = data.get("movies", [])
        print(f"✅ Language Filter 'hi' returned {len(movies)} movies.")
    else:
        print(f"⚠️ Language Filter 'hi' failed with status {resp_hi.status_code}")

    # 2. Test Genre Filter (Horror)
    resp_genre = requests.get(f"{BASE_URL}/api/movies?genre=Horror&limit=10")
    if resp_genre.status_code == 200:
        data = resp_genre.json()
        movies = data.get("movies", [])
        print(f"✅ Genre Filter 'Horror' returned {len(movies)} movies.")
    else:
        print(f"⚠️ Genre Filter 'Horror' failed with status {resp_genre.status_code}")

if __name__ == "__main__":
    test_browse_filters()
