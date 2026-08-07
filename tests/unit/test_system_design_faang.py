"""
Unit test suite for 5 FAANG System Design Hardening Modules:
  12. Asynchronous Distributed Event Bus
  13. L1/L2 Singleflight Cache Stampede Protection
  14. Zero-Downtime Fallback Shelf Manager
  15. HLS / DASH Adaptive Bitrate (ABR) Video Streaming Engine
  16. Binary Protocol Buffer / gRPC Inter-Service Serializer
"""

import sys
import os
import asyncio
import pytest

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
BACKEND_DIR = os.path.join(ROOT_DIR, "backend")
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)


class TestDistributedEventBus:

    @pytest.mark.asyncio
    async def test_publish_and_process_event(self):
        from events.event_bus import event_bus, EventType
        handled_events = []

        def mock_handler(evt):
            handled_events.append(evt)

        event_bus.register_handler(EventType.CLICK.value, mock_handler)
        success = await event_bus.publish_event(EventType.CLICK.value, "user_123", {"movie_id": "mov_101"})
        assert success is True

        stats = event_bus.get_stats()
        assert stats["status"] == "healthy"


class TestSingleflightCache:

    @pytest.mark.asyncio
    async def test_singleflight_stampede_prevention(self):
        from cache.singleflight import singleflight_cache
        fetch_counter = 0

        async def expensive_db_query():
            nonlocal fetch_counter
            await asyncio.sleep(0.05)
            fetch_counter += 1
            return {"data": "trending_shelf_data"}

        # Simulate 10 concurrent requests hitting expired key simultaneously
        tasks = [singleflight_cache.get_or_fetch("hot_trending_key", expensive_db_query, ttl_sec=60) for _ in range(10)]
        results = await asyncio.gather(*tasks)

        assert len(results) == 10
        # Singleflight MUST ensure DB query was executed ONLY 1 time!
        assert fetch_counter == 1
        for val, source in results:
            assert val["data"] == "trending_shelf_data"
            assert source in ["DB_FETCH", "SINGLEFLIGHT_SHARED"]


class TestFallbackShelfManager:

    def test_fallback_recommendations(self):
        from resilience.fallback_shelves import fallback_shelf_manager
        res = fallback_shelf_manager.get_fallback_recommendations(shelf_type="trending", top_k=5, failure_reason="redis_down")

        assert res["status"] == "degraded_fallback"
        assert res["fallback_applied"] is True
        assert len(res["recommendations"]) == 5
        assert res["recommendations"][0]["id"] == "mov_101"


class TestHLSServerEngine:

    def test_master_and_variant_playlists(self):
        from streaming.hls_encoder import hls_server_engine
        
        master_m3u8 = hls_server_engine.generate_master_playlist("mov_101")
        assert "#EXTM3U" in master_m3u8
        assert "1080p" in master_m3u8
        assert "720p" in master_m3u8

        variant_m3u8 = hls_server_engine.generate_variant_playlist("mov_101", resolution="720p", total_duration_sec=60)
        assert "#EXTM3U" in variant_m3u8
        assert "#EXT-X-TARGETDURATION:4" in variant_m3u8
        assert "segment_000.ts" in variant_m3u8


class TestProtobufSerializer:

    def test_protobuf_serialization_and_compression(self):
        from protocols.grpc_serializer import protobuf_serializer

        items = [
            {"id": "mov_101", "svd_score": 0.95, "vote_average": 8.8},
            {"id": "mov_102", "svd_score": 0.88, "vote_average": 8.7},
            {"id": "mov_103", "svd_score": 0.82, "vote_average": 9.0}
        ]

        binary_data = protobuf_serializer.serialize_recommendation_list(items)
        assert isinstance(binary_data, bytes)
        assert binary_data.startswith(b"CNXS")

        unpacked = protobuf_serializer.deserialize_recommendation_list(binary_data)
        assert len(unpacked) == 3
        assert unpacked[0]["id"] == "mov_101"
        assert unpacked[0]["score"] == 0.95

        stats = protobuf_serializer.get_compression_stats(items)
        assert "size_reduction_pct" in stats
        assert stats["size_reduction_pct"] > 0.0
