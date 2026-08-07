"""
CineNexus Two-Tower Neural Candidate Retrieval Engine
=====================================================
Implements a PyTorch Two-Tower Deep Learning Recommender (YouTube/Pinterest Architecture).
- User Tower: Encodes user demographics, watch history, genre affinity, and recency -> 64d embedding
- Item Tower: Encodes movie features, title embeddings, genres, ratings, and release era -> 64d embedding
- Scoring: Cosine dot-product similarity <UserEmbedding, ItemEmbedding>
"""

import os
import json
import logging
import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F
from typing import Dict, List, Any, Tuple, Optional

logger = logging.getLogger("ml.two_tower")


class UserTower(nn.Module):
    """Encodes user interaction features into a dense 64d latent space."""

    def __init__(self, input_dim: int = 32, embedding_dim: int = 64):
        super().__init__()
        self.fc1 = nn.Linear(input_dim, 128)
        self.bn1 = nn.BatchNorm1d(128)
        self.fc2 = nn.Linear(128, 128)
        self.bn2 = nn.BatchNorm1d(128)
        self.fc3 = nn.Linear(128, embedding_dim)
        self.dropout = nn.Dropout(0.2)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        h = F.relu(self.bn1(self.fc1(x)))
        h = self.dropout(h)
        h = F.relu(self.bn2(self.fc2(h)))
        embedding = F.normalize(self.fc3(h), p=2, dim=1)
        return embedding


class ItemTower(nn.Module):
    """Encodes movie metadata features into a dense 64d latent space."""

    def __init__(self, input_dim: int = 32, embedding_dim: int = 64):
        super().__init__()
        self.fc1 = nn.Linear(input_dim, 128)
        self.bn1 = nn.BatchNorm1d(128)
        self.fc2 = nn.Linear(128, 128)
        self.bn2 = nn.BatchNorm1d(128)
        self.fc3 = nn.Linear(128, embedding_dim)
        self.dropout = nn.Dropout(0.2)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        h = F.relu(self.bn1(self.fc1(x)))
        h = self.dropout(h)
        h = F.relu(self.bn2(self.fc2(h)))
        embedding = F.normalize(self.fc3(h), p=2, dim=1)
        return embedding


class TwoTowerModel(nn.Module):
    """Combined Two-Tower Neural Network."""

    def __init__(self, user_feature_dim: int = 32, item_feature_dim: int = 32, embedding_dim: int = 64):
        super().__init__()
        self.user_tower = UserTower(user_feature_dim, embedding_dim)
        self.item_tower = ItemTower(item_feature_dim, embedding_dim)
        self.temperature = nn.Parameter(torch.tensor(0.07))

    def forward(self, user_features: torch.Tensor, item_features: torch.Tensor) -> torch.Tensor:
        u_emb = self.user_tower(user_features)  # (batch_size, 64)
        i_emb = self.item_tower(item_features)  # (batch_size, 64)
        
        # Cosine dot-product similarity
        similarity = torch.sum(u_emb * i_emb, dim=1) / torch.clamp(self.temperature, min=0.01)
        return torch.sigmoid(similarity)


class TwoTowerRecommender:
    """High-level wrapper for Two-Tower training and inference."""

    def __init__(self, user_dim: int = 32, item_dim: int = 32, embedding_dim: int = 64):
        self.user_dim = user_dim
        self.item_dim = item_dim
        self.embedding_dim = embedding_dim
        self.model = TwoTowerModel(user_dim, item_dim, embedding_dim)
        self.model.eval()

    def predict_score(self, user_vec: np.ndarray, item_vec: np.ndarray) -> float:
        """Computes similarity score between user vector and item vector."""
        self.model.eval()
        with torch.no_grad():
            u_t = torch.tensor(user_vec, dtype=torch.float32).reshape(1, -1)
            i_t = torch.tensor(item_vec, dtype=torch.float32).reshape(1, -1)
            
            u_emb = self.model.user_tower(u_t)
            i_emb = self.model.item_tower(i_t)
            
            score = torch.sum(u_emb * i_emb, dim=1).item()
            return round(float((score + 1.0) / 2.0), 4)

    def train_mock_batch(self, batch_size: int = 64) -> Dict[str, float]:
        """Trains model on synthetic batch to verify PyTorch gradient flow."""
        self.model.train()
        optimizer = torch.optim.AdamW(self.model.parameters(), lr=1e-3)
        criterion = nn.BCELoss()

        user_feats = torch.randn(batch_size, self.user_dim)
        item_feats = torch.randn(batch_size, self.item_dim)
        targets = torch.randint(0, 2, (batch_size,), dtype=torch.float32)

        optimizer.zero_grad()
        outputs = self.model(user_feats, item_feats)
        loss = criterion(outputs, targets)
        loss.backward()
        optimizer.step()

        self.model.eval()
        return {"loss": round(float(loss.item()), 4), "batch_size": batch_size}


two_tower_recommender = TwoTowerRecommender()
