"""
Unit tests for Browse Filtering logic in list_movies.
Verifies query building for ISO language codes and case-insensitive genre filtering.
"""
import pytest


def build_browse_query(genre=None, language=None, decade=None):
    """Replicates query construction logic from list_movies endpoint."""
    query = {}
    if genre:
        query["genres"] = {"$regex": f"^{genre.strip()}$", "$options": "i"}
    if decade:
        year = int(decade[:-1])
        query["release_date"] = {
            "$gte": f"{year}-01-01",
            "$lte": f"{year+9}-12-31"
        }
    if language:
        if language == "en":
            query["original_language"] = "en"
        else:
            query["$or"] = [
                {"original_language": language},
                {
                    "original_language": "en",
                    "popularity": {"$gte": 14.0},
                    "genres": {"$in": ["Action", "Adventure", "Science Fiction", "Fantasy", "Animation", "Family", "Thriller", "Horror"]}
                }
            ]
    return query


def test_language_query_construction_iso_code():
    q_hi = build_browse_query(language="hi")
    assert "$or" in q_hi
    assert q_hi["$or"][0]["original_language"] == "hi"

    q_en = build_browse_query(language="en")
    assert q_en["original_language"] == "en"


def test_genre_query_construction_case_insensitive():
    q_horror = build_browse_query(genre="Horror")
    assert q_horror["genres"]["$regex"] == "^Horror$"
    assert q_horror["genres"]["$options"] == "i"

    q_lower = build_browse_query(genre="action")
    assert q_lower["genres"]["$regex"] == "^action$"
    assert q_lower["genres"]["$options"] == "i"
