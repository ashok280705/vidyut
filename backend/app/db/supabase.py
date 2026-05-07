"""Supabase client for backend."""
import os
from supabase import create_client, Client

_client: Client | None = None

def init_supabase() -> Client:
    global _client
    url = os.getenv("SUPABASE_URL", os.getenv("NEXT_PUBLIC_SUPABASE_URL", ""))
    key = os.getenv("SUPABASE_SERVICE_KEY", os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY", ""))
    if url and key:
        _client = create_client(url, key)
        print(f"[VIDYUT] Supabase connected: {url[:30]}...")
    else:
        print("[VIDYUT] WARNING: Supabase not configured")
    return _client  # type: ignore

def get_supabase() -> Client | None:
    return _client
