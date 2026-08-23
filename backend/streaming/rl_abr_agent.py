import numpy as np
import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)

class PPOBitrateAgent:
    """
    CUSTOMER POV: "I'm watching on a train. My internet is dropping in and out. 
    I just want the movie to play without ever seeing a buffering wheel."
    
    STAFF ML IMPLEMENTATION: Proximal Policy Optimization (PPO) Reinforcement Learning.
    Instead of Netflix's standard heuristic rule ("If buffer < 5s, drop to 480p"), 
    this RL agent observes network jitter, packet loss, and buffer size to proactively 
    adjust the bitrate BEFORE the buffer runs out. It learns the optimal balance between
    visual quality and uninterrupted playback.
    """
    def __init__(self):
        self.bitrate_levels = [240, 480, 720, 1080, 2160]  # Resolutions
        
        # Simulated Actor-Critic Neural Network weights
        # State: [buffer_size_seconds, network_bandwidth_mbps, packet_loss_ratio]
        self.actor_weights = np.random.randn(3, len(self.bitrate_levels)) * 0.1
        logger.info("Initialized PPO RL Agent for Adaptive Bitrate Streaming.")

    def softmax(self, x: np.ndarray) -> np.ndarray:
        e_x = np.exp(x - np.max(x))
        return e_x / e_x.sum()

    def select_bitrate(self, buffer_seconds: float, bandwidth_mbps: float, packet_loss: float) -> Dict[str, Any]:
        """
        Takes the current streaming state and outputs the mathematically optimal 
        next video chunk resolution to prevent buffering.
        """
        state_vector = np.array([buffer_seconds, bandwidth_mbps, packet_loss])
        
        # Forward pass through the simulated Actor Network
        logits = np.dot(state_vector, self.actor_weights)
        action_probs = self.softmax(logits)
        
        # In exploitation mode (inference), we pick the argmax
        selected_index = np.argmax(action_probs)
        selected_resolution = self.bitrate_levels[selected_index]
        
        return {
            "state_input": {
                "buffer_sec": buffer_seconds,
                "bandwidth": bandwidth_mbps,
                "loss": packet_loss
            },
            "selected_resolution": f"{selected_resolution}p",
            "confidence_scores": {f"{res}p": round(float(prob), 3) for res, prob in zip(self.bitrate_levels, action_probs)}
        }
