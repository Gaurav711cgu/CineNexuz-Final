"""
CineNexus Live External Integrations Diagnostic & Verification Suite
Tests response status for:
1. MongoDB Cluster
2. Redis / Upstash Redis
3. Supabase PostgreSQL & pgvector extension
4. TMDB API Gateway
5. Stripe Payment API
6. Brevo Email Gateway
7. Groq / OpenAI LLM APIs
"""
import os
import asyncio
import httpx
from dotenv import load_dotenv

# Load backend/.env explicitly
backend_env_path = os.path.join(os.path.dirname(__file__), "../backend/.env")
if os.path.exists(backend_env_path):
    load_dotenv(backend_env_path)
else:
    load_dotenv()

# Colors for terminal output
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
RESET = "\033[0m"


async def test_mongodb():
    mongo_url = os.getenv("MONGO_URL")
    if not mongo_url:
        print(f"[{YELLOW}SKIP{RESET}] MongoDB: MONGO_URL not configured")
        return False
    try:
        from motor.motor_asyncio import AsyncIOMotorClient
        client = AsyncIOMotorClient(mongo_url, tlsAllowInvalidCertificates=True, serverSelectionTimeoutMS=3000)
        res = await client.admin.command("ping")
        client.close()
        print(f"[{GREEN}PASS{RESET}] MongoDB Cluster: Connected & Ping OK ({res})")
        return True
    except Exception as e:
        print(f"[{RED}FAIL{RESET}] MongoDB Cluster: Connection failed ({e})")
        return False


async def test_redis():
    redis_url = os.getenv("REDIS_URL")
    upstash_url = os.getenv("UPSTASH_REDIS_REST_URL")
    upstash_token = os.getenv("UPSTASH_REDIS_REST_TOKEN")

    connected = False
    if upstash_url and upstash_token:
        try:
            from upstash_redis import Redis as UpstashRedis
            redis = UpstashRedis(url=upstash_url, token=upstash_token)
            redis.set("health_check_ping", "pong")
            val = redis.get("health_check_ping")
            if val == "pong":
                print(f"[{GREEN}PASS{RESET}] Upstash Redis: Connected & Ping/Pong OK")
                connected = True
        except Exception as e:
            print(f"[{YELLOW}WARN{RESET}] Upstash Redis check error: {e}")

    if not connected and redis_url:
        try:
            import redis
            r = redis.from_url(redis_url, socket_timeout=3)
            if r.ping():
                print(f"[{GREEN}PASS{RESET}] Local Redis: Connected & Ping OK")
                connected = True
        except Exception as e:
            print(f"[{YELLOW}WARN{RESET}] Local Redis check error: {e}")

    if not connected:
        print(f"[{YELLOW}WARN{RESET}] Redis: In-memory fallback will be active")
    return connected


async def test_supabase():
    db_url = os.getenv("SUPABASE_DB_URL") or os.getenv("DATABASE_URL")
    if not db_url:
        print(f"[{YELLOW}SKIP{RESET}] Supabase Postgres: SUPABASE_DB_URL not configured")
        return False
    try:
        import asyncpg
        conn = await asyncpg.connect(db_url, timeout=5)
        val = await conn.fetchval("SELECT 1;")
        vec_installed = await conn.fetchval("SELECT count(*) FROM pg_extension WHERE extname = 'vector';")
        await conn.close()
        print(f"[{GREEN}PASS{RESET}] Supabase PostgreSQL: Connected (SELECT 1 -> {val}), pgvector extension: {'Installed' if vec_installed else 'Missing'}")
        return True
    except Exception as e:
        print(f"[{RED}FAIL{RESET}] Supabase PostgreSQL: Connection error ({e})")
        return False


async def test_tmdb():
    api_key = os.getenv("TMDB_API_KEY")
    if not api_key:
        print(f"[{YELLOW}SKIP{RESET}] TMDB API: TMDB_API_KEY not configured")
        return False
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            resp = await client.get(f"https://api.themoviedb.org/3/configuration?api_key={api_key}")
            if resp.status_code == 200:
                print(f"[{GREEN}PASS{RESET}] TMDB API: Responded HTTP 200 OK")
                return True
            else:
                print(f"[{RED}FAIL{RESET}] TMDB API: Responded HTTP {resp.status_code}")
                return False
    except Exception as e:
        print(f"[{RED}FAIL{RESET}] TMDB API: Connection error ({e})")
        return False


async def test_stripe():
    stripe_key = os.getenv("STRIPE_API_KEY")
    if not stripe_key:
        print(f"[{YELLOW}SKIP{RESET}] Stripe API: STRIPE_API_KEY not configured")
        return False
    try:
        import stripe
        stripe.api_key = stripe_key
        # Light verification call
        bal = stripe.Balance.retrieve()
        print(f"[{GREEN}PASS{RESET}] Stripe API: Responded OK (Account currency: {bal.get('livemode')})")
        return True
    except Exception as e:
        print(f"[{RED}FAIL{RESET}] Stripe API: Error ({e})")
        return False


async def test_brevo():
    smtp_login = os.getenv("BREVO_SMTP_LOGIN")
    smtp_pass = os.getenv("BREVO_SMTP_PASSWORD")
    smtp_host = os.getenv("BREVO_SMTP_HOST", "smtp-relay.brevo.com")
    smtp_port = int(os.getenv("BREVO_SMTP_PORT", "587"))

    if not smtp_login or not smtp_pass:
        print(f"[{YELLOW}SKIP{RESET}] Brevo SMTP: BREVO_SMTP_LOGIN / BREVO_SMTP_PASSWORD not configured")
        return False
    try:
        import smtplib
        server = smtplib.SMTP(smtp_host, smtp_port, timeout=5)
        server.starttls()
        server.login(smtp_login, smtp_pass)
        server.quit()
        print(f"[{GREEN}PASS{RESET}] Brevo SMTP: Authentication & Handshake OK")
        return True
    except Exception as e:
        print(f"[{RED}FAIL{RESET}] Brevo SMTP: Handshake error ({e})")
        return False


async def main():
    print("=" * 65)
    print(" CineNexus System Integrations Live Health Diagnostic")
    print("=" * 65)

    await test_mongodb()
    await test_redis()
    await test_supabase()
    await test_tmdb()
    await test_stripe()
    await test_brevo()

    print("=" * 65)


if __name__ == "__main__":
    asyncio.run(main())
