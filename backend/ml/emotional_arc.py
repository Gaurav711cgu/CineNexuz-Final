import numpy as np
import logging
from typing import Dict, Any

try:
    from fastdtw import fastdtw
    from scipy.spatial.distance import euclidean
    HAS_DTW = True
except ImportError:
    HAS_DTW = False

logger = logging.getLogger(__name__)

class EmotionalArcMatcher:
    """
    CUSTOMER POV: "I don't care about the genre. I want a movie that starts 
    depressing, slowly builds tension, and ends with an explosive, happy climax."
    
    STAFF ML IMPLEMENTATION: Dynamic Time Warping (DTW) on Sentiment Time-Series.
    We represent movies not as tags, but as a sequence of emotional vectors 
    (extracted from subtitle/audio sentiment analysis minute-by-minute).
    """
    def __init__(self):
        self.mock_mode = not HAS_DTW
        if self.mock_mode:
            logger.warning("fastdtw or scipy not installed. Running in mock mode.")
            
        # Simulated database of movie emotional arcs (Shape: [Minutes, Sentiment_Score])
        # -1 = Sad/Tense, 1 = Happy/Uplifting
        self.movie_arcs = {
            "movie_1_redemption": np.array([-0.8, -0.6, -0.2, 0.4, 0.9]), # Depressing -> Happy
            "movie_2_tragedy": np.array([0.8, 0.5, 0.0, -0.7, -0.9]),     # Happy -> Tragedy
            "movie_3_thriller": np.array([0.0, -0.2, -0.8, -0.9, 0.1]),   # Tense build-up -> Relief
        }

    def generate_target_arc(self, nlp_prompt: str) -> np.ndarray:
        """
        Translates user natural language ("Starts sad, ends happy") into a math vector.
        In production, an LLM maps the prompt to a target time-series tensor.
        """
        if "starts sad" in nlp_prompt.lower() and "happy" in nlp_prompt.lower():
            return np.array([-1.0, -0.5, 0.0, 0.5, 1.0])
        elif "tragedy" in nlp_prompt.lower():
            return np.array([1.0, 0.5, 0.0, -0.5, -1.0])
        return np.array([0.0, 0.0, 0.0, 0.0, 0.0])

    def find_best_arc_match(self, user_prompt: str) -> Dict[str, Any]:
        """Uses DTW to find the movie whose emotional pacing matches the user's request."""
        target_arc = self.generate_target_arc(user_prompt)
        
        if self.mock_mode:
            return {"recommended_movie": "movie_1_redemption", "dtw_distance": 0.0}

        best_match = None
        min_distance = float('inf')
        
        for movie_id, arc in self.movie_arcs.items():
            # DTW aligns sequences of different lengths (e.g. a 90 min vs 120 min movie)
            # finding the true mathematical similarity in their emotional trajectory.
            distance, path = fastdtw(target_arc, arc, dist=euclidean)
            
            if distance < min_distance:
                min_distance = distance
                best_match = movie_id
                
        return {
            "user_intent": user_prompt,
            "recommended_movie": best_match,
            "dtw_distance": round(min_distance, 3)
        }
