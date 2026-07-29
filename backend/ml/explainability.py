"""Data-derived recommendation explanations."""


def explain_recommendation(movie: dict, user_taste: dict, algorithm: str) -> str:
    genre_weights = user_taste.get("genre_weights", {})
    movie_genres = movie.get("genres", [])
    matched = [(genre, genre_weights.get(genre, 0)) for genre in movie_genres if genre in genre_weights]
    matched.sort(key=lambda item: item[1], reverse=True)
    rating = movie.get("vote_average", 0) or 0

    if algorithm == "cf_svd":
        if matched:
            return f"Users who share your love of {matched[0][0]} also watched this"
        return "Recommended by users with similar taste profiles"
    if algorithm == "embedding":
        if matched:
            genres = " & ".join(genre for genre, _ in matched[:2])
            return f"Semantically similar to your {genres} favorites"
        return "High semantic similarity to your watch history"
    if algorithm == "hybrid":
        reasons = []
        if matched:
            reasons.append(f"matches your {matched[0][0]} preference")
        if rating >= 7.5:
            reasons.append(f"rated {rating:.1f}/10")
        return "Because it " + " · ".join(reasons) if reasons else "Top pick based on your viewing history"
    if matched:
        return f"Matches your top genre: {matched[0][0]}"
    return f"Highly rated ({rating:.1f}/10) in genres you explore"
