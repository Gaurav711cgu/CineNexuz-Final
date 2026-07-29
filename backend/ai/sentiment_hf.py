"""
CineNexus Sentiment Classifier
Local sentiment analysis using HuggingFace Transformers — no external API, no cost per inference.

Model: distilbert-base-uncased-finetuned-sst-2-english (HuggingFace)
Parameters: 66M | Task: Binary (POSITIVE/NEGATIVE) | Device: CPU
Latency: ~15ms per review | Loaded lazily on first inference
"""
import time
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
try:
    from logging_utils import log_event
except ImportError:
    import sys
    import os
    sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
    from logging_utils import log_event

try:
    from transformers import pipeline, AutoModelForSequenceClassification, AutoTokenizer
    TRANSFORMERS_AVAILABLE = True
except ImportError:
    TRANSFORMERS_AVAILABLE = False


class SentimentClassifier:
    """
    Local sentiment analysis — no external API, no cost per inference.

    Model: distilbert-base-uncased-finetuned-sst-2-english (HuggingFace)
    Parameters: 66M | Task: Binary (POSITIVE/NEGATIVE) | Device: CPU
    Latency: ~15ms per review | Loaded lazily on first inference
    """
    
    def __init__(self):
        self.classifier = None
        self.model_name = "distilbert-base-uncased-finetuned-sst-2-english"
        self.is_loaded = False
        self.load_time_ms = 0
        self.total_inferences = 0
        self.total_inference_time_ms = 0

    def load(self) -> Dict[str, Any]:
        """
        Lazy load the model — only when first called, not at startup.
        """
        if self.is_loaded and self.classifier is not None:
            return {"status": "already_loaded", "model": self.model_name}
        
        if not TRANSFORMERS_AVAILABLE:
            return {"status": "error", "message": "transformers library not installed"}
        
        try:
            start_time = time.time()
            
            # Load pipeline (device=-1 means CPU)
            self.classifier = pipeline(
                "sentiment-analysis",
                model=self.model_name,
                device=-1  # CPU
            )
            
            self.load_time_ms = int((time.time() - start_time) * 1000)
            self.is_loaded = True
            
            log_event(logging.INFO, f"Sentiment classifier loaded: {self.model_name} in {self.load_time_ms}ms", "sentiment_hf")
            
            return {
                "status": "loaded",
                "model": self.model_name,
                "load_time_ms": self.load_time_ms
            }
            
        except Exception as e:
            self.is_loaded = False
            log_event(logging.ERROR, f"Sentiment classifier load error: {e}", "sentiment_hf")
            return {"status": "error", "message": str(e)}

    def analyze(self, texts: List[str]) -> List[Dict[str, Any]]:
        """
        Analyze sentiment of multiple texts.
        
        Returns:
            List of {"label": "POSITIVE"/"NEGATIVE", "score": 0.95, "text_preview": "..."}
        """
        if not self.is_loaded:
            load_result = self.load()
            if load_result.get("status") == "error":
                return [{"error": load_result.get("message"), "text_preview": t[:80]} for t in texts]
        
        if not texts:
            return []
        
        try:
            start_time = time.time()
            
            # Run classifier with truncation
            results = self.classifier(
                texts,
                truncation=True,
                max_length=512,
                batch_size=8
            )
            
            inference_time = int((time.time() - start_time) * 1000)
            self.total_inferences += len(texts)
            self.total_inference_time_ms += inference_time
            
            # Format results
            formatted = []
            for i, result in enumerate(results):
                formatted.append({
                    "label": result["label"],
                    "score": round(result["score"], 4),
                    "text_preview": texts[i][:80] + "..." if len(texts[i]) > 80 else texts[i]
                })
            
            return formatted
            
        except Exception as e:
            log_event(logging.ERROR, f"Sentiment analysis error: {e}", "sentiment_hf")
            return [{"error": str(e), "text_preview": t[:80]} for t in texts]

    def analyze_single(self, text: str) -> Dict[str, Any]:
        """Analyze sentiment of a single text."""
        results = self.analyze([text])
        return results[0] if results else {"error": "No result"}

    def analyze_reviews(self, reviews: List[str]) -> Dict[str, Any]:
        """
        Analyze a list of reviews and compute aggregate statistics.
        
        Returns:
            {
                "overall_sentiment": "Positive"/"Mixed"/"Negative",
                "positive_count": int,
                "negative_count": int,
                "avg_confidence": float,
                "per_review": [...],
                "model_info": {...}
            }
        """
        if not reviews:
            return {
                "overall_sentiment": "Unknown",
                "positive_count": 0,
                "negative_count": 0,
                "avg_confidence": 0.0,
                "per_review": [],
                "model_info": self.get_model_info()
            }
        
        start_time = time.time()
        per_review = self.analyze(reviews)
        inference_time = int((time.time() - start_time) * 1000)
        
        # Count sentiments
        positive_count = sum(1 for r in per_review if r.get("label") == "POSITIVE")
        negative_count = sum(1 for r in per_review if r.get("label") == "NEGATIVE")
        total = len(per_review)
        
        # Average confidence
        scores = [r.get("score", 0) for r in per_review if "score" in r]
        avg_confidence = sum(scores) / len(scores) if scores else 0.0
        
        # Overall sentiment
        if total > 0:
            positive_ratio = positive_count / total
            if positive_ratio > 0.6:
                overall_sentiment = "Positive"
            elif positive_ratio < 0.4:
                overall_sentiment = "Negative"
            else:
                overall_sentiment = "Mixed"
        else:
            overall_sentiment = "Unknown"
        
        return {
            "overall_sentiment": overall_sentiment,
            "positive_count": positive_count,
            "negative_count": negative_count,
            "avg_confidence": round(avg_confidence, 4),
            "per_review": per_review,
            "inference_time_ms": inference_time,
            "model_info": self.get_model_info()
        }

    def get_model_info(self) -> Dict[str, Any]:
        """Return model information."""
        return {
            "name": self.model_name,
            "type": "local_huggingface",
            "cost": "$0.00",
            "parameters": "66M",
            "task": "binary_sentiment",
            "classes": ["POSITIVE", "NEGATIVE"],
            "device": "CPU"
        }

    def get_stats(self) -> Dict[str, Any]:
        """Return classifier statistics."""
        avg_latency = (
            self.total_inference_time_ms / self.total_inferences
            if self.total_inferences > 0 else 0
        )
        return {
            "is_loaded": self.is_loaded,
            "model_name": self.model_name,
            "load_time_ms": self.load_time_ms,
            "total_inferences": self.total_inferences,
            "avg_latency_ms": round(avg_latency, 2),
            "model_info": self.get_model_info()
        }


# Global instance (lazy loaded)
sentiment_classifier = SentimentClassifier()
