import os
import requests
import logging
from typing import Optional, Dict, Any, List
from pathlib import Path
from dotenv import load_dotenv

logger = logging.getLogger(__name__)

# Ensure env vars are loaded
PROJECT_ROOT = Path(__file__).parent.parent.parent.resolve()
load_dotenv(PROJECT_ROOT / "config" / ".env")

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

IS_DB_CONFIGURED = bool(
    SUPABASE_URL 
    and SUPABASE_KEY 
    and not SUPABASE_URL.startswith("https://your-")
)

def get_headers() -> dict:
    return {
        "apikey": SUPABASE_KEY or "",
        "Authorization": f"Bearer {SUPABASE_KEY or ''}",
        "Content-Type": "application/json"
    }

def get_source_registry_entry(connector: str, tenant_id: str = "default-tenant") -> Optional[Dict[str, Any]]:
    """Get active source configuration, falling back to default-tenant if tenant-specific doesn't exist."""
    if not IS_DB_CONFIGURED:
        return None

    url = f"{SUPABASE_URL.rstrip('/')}/rest/v1/source_registry"
    headers = get_headers()
    
    # 1. Try tenant-specific active connector
    try:
        params = {
            "connector": f"eq.{connector}",
            "tenant_id": f"eq.{tenant_id}",
            "active": "eq.true"
        }
        res = requests.get(url, headers=headers, params=params, timeout=5)
        if res.status_code == 200:
            rows = res.json()
            if rows:
                return rows[0]
    except Exception as e:
        logger.warning(f"Error querying tenant source_registry: {e}")

    # 2. Fall back to default-tenant active connector
    if tenant_id != "default-tenant":
        try:
            params = {
                "connector": f"eq.{connector}",
                "tenant_id": "eq.default-tenant",
                "active": "eq.true"
            }
            res = requests.get(url, headers=headers, params=params, timeout=5)
            if res.status_code == 200:
                rows = res.json()
                if rows:
                    return rows[0]
        except Exception as e:
            logger.warning(f"Error querying default source_registry fallback: {e}")
            
    return None

def get_all_sources(tenant_id: str = "default-tenant") -> List[Dict[str, Any]]:
    """List all sources for the tenant, falling back to defaults, prioritizing tenant versions."""
    if not IS_DB_CONFIGURED:
        return []

    url = f"{SUPABASE_URL.rstrip('/')}/rest/v1/source_registry"
    headers = get_headers()
    
    try:
        # Fetch both tenant and default rows
        params = {
            "or": f"(tenant_id.eq.{tenant_id},tenant_id.eq.default-tenant)"
        }
        res = requests.get(url, headers=headers, params=params, timeout=5)
        if res.status_code != 200:
            logger.error(f"Failed to fetch sources: {res.status_code} - {res.text}")
            return []
            
        rows = res.json()
        # Deduplicate: if a connector is present in both tenant_id and default-tenant, keep the tenant_id one.
        deduped = {}
        for r in rows:
            connector = r.get("connector")
            curr_tenant = r.get("tenant_id")
            if connector not in deduped:
                deduped[connector] = r
            else:
                # Prioritize specific tenant over default
                if curr_tenant == tenant_id:
                    deduped[connector] = r
                    
        return list(deduped.values())
    except Exception as e:
        logger.error(f"Error fetching all sources: {e}")
        return []

def insert_aligned_state(state: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Insert a new CanonicalAlignedState into Supabase."""
    if not IS_DB_CONFIGURED:
        return None

    url = f"{SUPABASE_URL.rstrip('/')}/rest/v1/aligned_states"
    headers = get_headers()
    headers["Prefer"] = "return=representation"
    
    try:
        res = requests.post(url, headers=headers, json=state, timeout=10)
        if res.status_code in (200, 201):
            inserted = res.json()
            if inserted and isinstance(inserted, list):
                return inserted[0]
            return inserted
        else:
            logger.error(f"Failed to insert aligned state: {res.status_code} - {res.text}")
    except Exception as e:
        logger.error(f"Error inserting aligned state: {e}")
    return None

def get_latest_aligned_state(tenant_id: str = "default-tenant") -> Optional[Dict[str, Any]]:
    """Retrieve the latest aligned state for the tenant."""
    if not IS_DB_CONFIGURED:
        return None

    url = f"{SUPABASE_URL.rstrip('/')}/rest/v1/aligned_states"
    headers = get_headers()
    
    try:
        params = {
            "tenant_id": f"eq.{tenant_id}",
            "order": "aligned_at.desc",
            "limit": "1"
        }
        res = requests.get(url, headers=headers, params=params, timeout=5)
        if res.status_code == 200:
            rows = res.json()
            if rows:
                return rows[0]
    except Exception as e:
        logger.error(f"Error fetching latest aligned state: {e}")
    return None

def get_aligned_state_by_id(state_id: str, tenant_id: str = "default-tenant") -> Optional[Dict[str, Any]]:
    """Retrieve a specific aligned state by UUID."""
    if not IS_DB_CONFIGURED:
        return None

    url = f"{SUPABASE_URL.rstrip('/')}/rest/v1/aligned_states"
    headers = get_headers()
    
    try:
        params = {
            "id": f"eq.{state_id}",
            "tenant_id": f"eq.{tenant_id}"
        }
        res = requests.get(url, headers=headers, params=params, timeout=5)
        if res.status_code == 200:
            rows = res.json()
            if rows:
                return rows[0]
    except Exception as e:
        logger.error(f"Error fetching aligned state by ID: {e}")
    return None

def get_latest_version(query_context: str, tenant_id: str = "default-tenant") -> int:
    """Get the latest version number for a query_context/tenant combinations."""
    if not IS_DB_CONFIGURED:
        return 0

    url = f"{SUPABASE_URL.rstrip('/')}/rest/v1/aligned_states"
    headers = get_headers()
    
    try:
        params = {
            "tenant_id": f"eq.{tenant_id}",
            "query_context": f"eq.{query_context}",
            "order": "version.desc",
            "limit": "1"
        }
        res = requests.get(url, headers=headers, params=params, timeout=5)
        if res.status_code == 200:
            rows = res.json()
            if rows:
                return int(rows[0].get("version", 0))
    except Exception as e:
        logger.warning(f"Error querying latest version: {e}")
    return 0

def get_version_history(tenant_id: str = "default-tenant", limit: int = 10) -> List[Dict[str, Any]]:
    """Fetch the recent aligned states history for the tenant."""
    if not IS_DB_CONFIGURED:
        return []

    url = f"{SUPABASE_URL.rstrip('/')}/rest/v1/aligned_states"
    headers = get_headers()
    
    try:
        params = {
            "tenant_id": f"eq.{tenant_id}",
            "order": "aligned_at.desc",
            "limit": str(limit),
            "select": "id,version,query_context,aggregate_confidence,aligned_at"
        }
        res = requests.get(url, headers=headers, params=params, timeout=5)
        if res.status_code == 200:
            return res.json()
    except Exception as e:
        logger.error(f"Error fetching version history: {e}")
    return []
