import os
import uuid
import pytest
import requests
from pathlib import Path
from dotenv import load_dotenv

# Setup Paths & load env
PROJECT_ROOT = Path(__file__).parent.parent.resolve()
load_dotenv(PROJECT_ROOT / "config" / ".env")

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")  # Service role key

IS_SUPABASE_CONFIGURED = (
    SUPABASE_URL 
    and SUPABASE_KEY 
    and not SUPABASE_URL.startswith("https://your-")
)

@pytest.mark.skipif(not IS_SUPABASE_CONFIGURED, reason="Supabase is not configured in config/.env")
def test_supabase_auth_rls_multi_tenancy():
    """
    Automated RLS Multi-Tenancy Validation:
    1. Register a test user
    2. Set tenant_id = 'tenant-test-123' in user's app_metadata using Admin API
    3. Login to retrieve the user's JWT access token
    4. Insert two documents: one for 'tenant-test-123' and one for 'tenant-other-456'
    5. Query using the user's JWT token and verify ONLY the allowed document is returned
    6. Cleanup test assets
    """
    url = SUPABASE_URL.rstrip('/')
    headers_admin = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json"
    }

    # 1. Sign up test user via Admin API (pre-confirmed with tenant metadata)
    email = f"test.user.{uuid.uuid4()}@gmail.com"
    password = "SuperSecretPassword123!"
    
    admin_create_url = f"{url}/auth/v1/admin/users"
    signup_res = requests.post(admin_create_url, headers=headers_admin, json={
        "email": email,
        "password": password,
        "email_confirm": True,
        "app_metadata": {
            "tenant_id": "tenant-test-123"
        }
    })
    assert signup_res.status_code in (200, 201), f"Admin signup failed: {signup_res.text}"
    user_data = signup_res.json()
    user_id = user_data["id"]

    try:

        # 3. Login to retrieve the user JWT access token
        login_url = f"{url}/auth/v1/token?grant_type=password"
        login_res = requests.post(login_url, headers=headers_admin, json={
            "email": email,
            "password": password
        })
        assert login_res.status_code == 200, f"Login failed: {login_res.text}"
        user_jwt = login_res.json()["access_token"]

        # 4. Insert two documents using the service_role key (which bypasses RLS)
        mock_embedding = [0.1] * 768
        doc_allowed = {
            "id": f"test-allowed-{uuid.uuid4()}",
            "document": "huntsman-test-report.pdf",
            "content": "Secret RAG content for tenant-test-123",
            "embedding": mock_embedding,
            "tenant_id": "tenant-test-123"
        }
        doc_blocked = {
            "id": f"test-blocked-{uuid.uuid4()}",
            "document": "dow-test-report.pdf",
            "content": "Secret RAG content for tenant-other-456",
            "embedding": mock_embedding,
            "tenant_id": "tenant-other-456"
        }

        # Post documents to standard Postgrest table endpoint
        docs_url = f"{url}/rest/v1/rag_documents"
        headers_post = headers_admin.copy()
        headers_post["Prefer"] = "resolution=merge-duplicates"
        post_res = requests.post(docs_url, headers=headers_post, json=[doc_allowed, doc_blocked])
        assert post_res.status_code in (200, 201), f"Post RAG documents failed: {post_res.text}"

        # 5. Query using match_documents RPC with the user's JWT (enforcing RLS)
        rpc_url = f"{url}/rest/v1/rpc/match_documents"
        headers_jwt = {
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {user_jwt}",
            "Content-Type": "application/json"
        }
        query_body = {
            "query_embedding": mock_embedding,
            "match_threshold": 0.0,  # match anything
            "match_count": 5
        }
        query_res = requests.post(rpc_url, headers=headers_jwt, json=query_body)
        assert query_res.status_code == 200, f"RPC query failed: {query_res.text}"
        results = query_res.json()

        # Extract IDs from the returned records
        returned_ids = [row["id"] for row in results]
        
        # ASSERT: The allowed document is retrieved, and the blocked document is completely omitted!
        assert doc_allowed["id"] in returned_ids, "Allowed document was not returned by RAG search"
        assert doc_blocked["id"] not in returned_ids, "RLS Violation! Blocked tenant document was returned"

    finally:
        # 6. Cleanup: Delete test documents
        delete_url = f"{url}/rest/v1/rag_documents?tenant_id=in.(tenant-test-123,tenant-other-456)"
        requests.delete(delete_url, headers=headers_admin)

        # Delete test user
        requests.delete(f"{url}/auth/v1/admin/users/{user_id}", headers=headers_admin)
