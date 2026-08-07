"""
CineNexus SASRec Self-Attention Sequential Transformer
======================================================
Predicts the next movie a user will watch based on their chronological viewing sequence (S_1 -> S_2 -> ... -> S_t -> S_{t+1}).
Uses multi-head self-attention, positional embeddings, and point-wise Feed-Forward Networks.
"""

import math
import logging
import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F
from typing import List, Dict, Any, Optional

logger = logging.getLogger("ml.sasrec")


class MultiHeadSelfAttention(nn.Module):
    """Multi-Head Self-Attention for sequence modeling."""

    def __init__(self, hidden_units: int = 64, num_heads: int = 4, dropout_rate: float = 0.2):
        super().__init__()
        self.hidden_units = hidden_units
        self.num_heads = num_heads
        self.head_dim = hidden_units // num_heads

        self.q_linear = nn.Linear(hidden_units, hidden_units)
        self.k_linear = nn.Linear(hidden_units, hidden_units)
        self.v_linear = nn.Linear(hidden_units, hidden_units)
        self.out_proj = nn.Linear(hidden_units, hidden_units)
        self.dropout = nn.Dropout(dropout_rate)

    def forward(self, queries: torch.Tensor, keys: torch.Tensor, mask: Optional[torch.Tensor] = None) -> torch.Tensor:
        B, S, _ = queries.size()

        Q = self.q_linear(queries).view(B, S, self.num_heads, self.head_dim).transpose(1, 2)
        K = self.k_linear(keys).view(B, S, self.num_heads, self.head_dim).transpose(1, 2)
        V = self.v_linear(keys).view(B, S, self.num_heads, self.head_dim).transpose(1, 2)

        scores = torch.matmul(Q, K.transpose(-2, -1)) / math.sqrt(self.head_dim)

        if mask is not None:
            scores = scores.masked_fill(mask == 0, -1e9)

        attn_weights = F.softmax(scores, dim=-1)
        attn_weights = self.dropout(attn_weights)

        context = torch.matmul(attn_weights, V).transpose(1, 2).contiguous().view(B, S, self.hidden_units)
        return self.out_proj(context)


class SASRecModel(nn.Module):
    """Self-Attention Sequential Recommendation Transformer."""

    def __init__(
        self,
        item_count: int = 1000,
        max_seq_length: int = 20,
        hidden_units: int = 64,
        num_blocks: int = 2,
        num_heads: int = 4,
        dropout_rate: float = 0.2
    ):
        super().__init__()
        self.item_count = item_count
        self.max_seq_length = max_seq_length
        self.hidden_units = hidden_units

        self.item_emb = nn.Embedding(item_count + 1, hidden_units, padding_idx=0)
        self.pos_emb = nn.Embedding(max_seq_length, hidden_units)
        self.emb_dropout = nn.Dropout(dropout_rate)

        self.attention_blocks = nn.ModuleList([
            MultiHeadSelfAttention(hidden_units, num_heads, dropout_rate) for _ in range(num_blocks)
        ])
        self.ffn_blocks = nn.ModuleList([
            nn.Sequential(
                nn.Linear(hidden_units, hidden_units * 2),
                nn.ReLU(),
                nn.Dropout(dropout_rate),
                nn.Linear(hidden_units * 2, hidden_units)
            ) for _ in range(num_blocks)
        ])
        self.ln_blocks1 = nn.ModuleList([nn.LayerNorm(hidden_units) for _ in range(num_blocks)])
        self.ln_blocks2 = nn.ModuleList([nn.LayerNorm(hidden_units) for _ in range(num_blocks)])

    def forward(self, input_seqs: torch.Tensor) -> torch.Tensor:
        B, S = input_seqs.size()
        positions = torch.arange(S, device=input_seqs.device).unsqueeze(0).expand(B, S)

        seq_emb = self.item_emb(input_seqs) + self.pos_emb(positions)
        h = self.emb_dropout(seq_emb)

        # Causal attention mask (prevent looking into future sequence items)
        causal_mask = torch.tril(torch.ones((S, S), device=input_seqs.device)).unsqueeze(0).unsqueeze(0)

        for attn, ffn, ln1, ln2 in zip(self.attention_blocks, self.ffn_blocks, self.ln_blocks1, self.ln_blocks2):
            # Attention block + residual connection
            attn_out = attn(ln1(h), ln1(h), mask=causal_mask)
            h = h + attn_out
            # FFN block + residual connection
            h = h + ffn(ln2(h))

        return h  # (B, S, hidden_units)


class SASRecRecommender:
    """Wrapper for training and sequence inference."""

    def __init__(self, item_count: int = 1000, max_len: int = 20, hidden_dim: int = 64):
        self.item_count = item_count
        self.max_len = max_len
        self.model = SASRecModel(item_count=item_count, max_seq_length=max_len, hidden_units=hidden_dim)
        self.model.eval()

    def predict_next_item_scores(self, sequence_item_ids: List[int], top_k: int = 10) -> List[Tuple[int, float]]:
        """Predicts the most probable next items given historical sequence."""
        self.model.eval()
        seq = sequence_item_ids[-self.max_len:]
        pad_len = max(0, self.max_len - len(seq))
        padded_seq = [0] * pad_len + seq

        with torch.no_grad():
            inp_t = torch.tensor([padded_seq], dtype=torch.long)
            seq_reps = self.model(inp_t)  # (1, max_len, hidden_units)
            last_rep = seq_reps[0, -1, :]  # Final position embedding vector

            # Score against all item embeddings
            all_item_embs = self.model.item_emb.weight[1:]  # Exclude padding index 0
            scores = torch.matmul(all_item_embs, last_rep)
            probs = F.softmax(scores, dim=-1).numpy()

            top_indices = np.argsort(probs)[::-1][:top_k]
            return [(int(idx + 1), round(float(probs[idx]), 4)) for idx in top_indices]


sasrec_recommender = SASRecRecommender()
