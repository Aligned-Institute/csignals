import { NextRequest, NextResponse } from 'next/server';
import { setToken } from '@/lib/auth';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_KEY || '';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 },
      );
    }

    if (!SUPABASE_URL || !SUPABASE_KEY) {
      return NextResponse.json(
        { error: 'Supabase configuration is missing on the server' },
        { status: 500 },
      );
    }

    const cleanUrl = SUPABASE_URL.replace(/\/$/, '');
    
    // 1. Create a pre-confirmed user via the Admin Users API using service_role key
    const res = await fetch(`${cleanUrl}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        email_confirm: true,
        app_metadata: {
          tenant_id: 'tenant-test-123'
        }
      }),
    }).catch((fetchErr) => {
      console.error('[REGISTER] Supabase admin sign-up unreachable:', fetchErr.message);
      return null;
    });

    if (!res) {
      return NextResponse.json(
        { error: 'Unable to reach registration service. Please try again.' },
        { status: 503 },
      );
    }

    if (!res.ok) {
      const body = await res.json().catch(() => ({ error_description: res.statusText }));
      return NextResponse.json(
        { error: body.error_description || body.error || 'Registration failed' },
        { status: res.status },
      );
    }

    // 2. Since admin user creation succeeds, immediately sign in to retrieve the JWT token
    const loginRes = await fetch(`${cleanUrl}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    }).catch(() => null);

    if (loginRes && loginRes.ok) {
      const data = await loginRes.json();
      if (data.access_token) {
        await setToken(data.access_token);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
