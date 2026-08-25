import asyncpg
from app.config import DATABASE_URL

_pool: asyncpg.Pool | None = None


async def init_db_pool() -> None:
    """À appeler au démarrage de l'application (startup event)."""
    global _pool
    _pool = await asyncpg.create_pool(
        dsn=DATABASE_URL,
        min_size=1,
        max_size=10,
    )


async def close_db_pool() -> None:
    """À appeler à l'arrêt de l'application (shutdown event)."""
    global _pool
    if _pool is not None:
        await _pool.close()


def get_pool() -> asyncpg.Pool:
    if _pool is None:
        raise RuntimeError("Le pool de connexions n'est pas initialisé.")
    return _pool
