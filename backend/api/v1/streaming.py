"""
CineNexuz API v1 - HLS Adaptive Bitrate Streaming Domain Router
================================================================
Handles HLS master playlists, multi-bitrate variant playlists (1080p, 720p, 480p),
and 4-second video segment delivery.
"""
from typing import Optional
from fastapi import APIRouter, HTTPException, Response

from streaming.hls_encoder import hls_server_engine

router = APIRouter()

@router.get("/{movie_id}/master.m3u8")
async def get_master_playlist(movie_id: str):
    """Serve HLS master playlist for adaptive bitrate selection."""
    content = hls_server_engine.generate_master_playlist(movie_id)
    return Response(content=content, media_type="application/vnd.apple.mpegurl")

@router.get("/{movie_id}/{quality}/index.m3u8")
async def get_variant_playlist(movie_id: str, quality: str):
    """Serve variant playlist for specified quality stream."""
    try:
        content = hls_server_engine.generate_variant_playlist(movie_id, quality)
        return Response(content=content, media_type="application/vnd.apple.mpegurl")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
