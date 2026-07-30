"""
Unit Tests for Database ACID Transactions & Concurrency Controls (PART 4)
"""
import pytest
from unittest.mock import MagicMock, AsyncMock
from resilience.feature_flags import feature_flags, FeatureFlagManager


def test_feature_flag_manager_toggles():
    ff = FeatureFlagManager()
    assert ff.is_enabled("enable_acid_transactions") is True

    ff.set_flag("enable_acid_transactions", False)
    assert ff.is_enabled("enable_acid_transactions") is False

    all_flags = ff.get_all_flags()
    assert "enable_acid_transactions" in all_flags


@pytest.mark.asyncio
async def test_transactional_context_manager_rollback():
    from db_transactions import TransactionalContextManager

    mock_db = MagicMock()
    mock_pool = MagicMock()
    mock_conn = AsyncMock()
    mock_tx = AsyncMock()

    mock_pool.acquire.return_value.__aenter__.return_value = mock_conn
    mock_conn.transaction.return_value = mock_tx
    mock_db.pool = mock_pool

    tx_mgr = TransactionalContextManager(mock_db)

    # Test automatic rollback on error inside transaction block
    with pytest.raises(ValueError, match="Database Write Error"):
        async with tx_mgr.transaction(isolation_level="REPEATABLE READ") as conn:
            raise ValueError("Database Write Error")

    mock_tx.start.assert_called_once()
    mock_tx.rollback.assert_called_once()
    mock_tx.commit.assert_not_called()
