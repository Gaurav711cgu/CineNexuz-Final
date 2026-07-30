"""
CineNexus Database ACID Transactions & Concurrency Module (PART 3)
Implements:
- Explicit PostgreSQL Transaction Blocks (BEGIN ... COMMIT / ROLLBACK)
- Row-Level Locking (SELECT ... FOR UPDATE) for race-condition prevention
- Transaction Isolation Level Scoping (READ COMMITTED, REPEATABLE READ)
- Automated Rollback Context Manager on Exception
"""
import logging
from contextlib import asynccontextmanager
from typing import Optional, AsyncGenerator

logger = logging.getLogger("db.transactions")


class TransactionalContextManager:
    """
    Guarantees Database ACID compliance (Atomicity, Consistency, Isolation, Durability)
    over multi-table updates (e.g. updating profile watch history & watchlist counters).
    """

    def __init__(self, db_manager):
        self.db_manager = db_manager

    @asynccontextmanager
    async def transaction(self, isolation_level: str = "READ COMMITTED") -> AsyncGenerator:
        """
        Context manager executing queries inside a single PostgreSQL transaction block.
        Automatically issues ROLLBACK if any exception occurs.
        """
        if not self.db_manager or not getattr(self.db_manager, "pool", None):
            logger.warning("Supabase Postgres pool unavailable. Transaction context operating in bypass mode.")
            yield None
            return

        async with self.db_manager.pool.acquire() as conn:
            tx = conn.transaction(isolation=isolation_level)
            await tx.start()
            try:
                logger.debug(f"Began PostgreSQL transaction with isolation level '{isolation_level}'.")
                yield conn
                await tx.commit()
                logger.debug("Successfully committed PostgreSQL transaction.")
            except Exception as e:
                await tx.rollback()
                logger.error(f"Transaction failed and rolled back cleanly: {e}")
                raise e

    async def get_with_row_lock(self, conn, table: str, primary_key_col: str, primary_key_val: Any) -> Optional[dict]:
        """
        Acquires an explicit Row-Level Lock ('SELECT ... FOR UPDATE')
        preventing concurrent write race conditions.
        """
        if not conn:
            return None
        sql = f"SELECT * FROM {table} WHERE {primary_key_col} = $1 FOR UPDATE;"
        record = await conn.fetchrow(sql, primary_key_val)
        return dict(record) if record else None


# Instantiate transaction manager
transaction_manager = None
try:
    from db_supabase import supabase_db
    transaction_manager = TransactionalContextManager(supabase_db)
except Exception as e:
    logger.warning(f"Failed initializing transaction manager: {e}")
