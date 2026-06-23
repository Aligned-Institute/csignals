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
    const res = await fetch(`${cleanUrl}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    }).catch((fetchErr) => {
      console.error('[LOGIN] Supabase unreachable:', fetchErr.message);
      return null;
    });

    if (!res) {
      return NextResponse.json(
        { error: 'Unable to reach authentication service. Please try again.' },
        { status: 503 },
      );
    }

    if (!res.ok) {
      const body = await res.json().catch(() => ({ error_description: res.statusText }));
      return NextResponse.json(
        { error: body.error_description || body.error || 'Login failed' },
        { status: res.status },
      );
    }

    const data: { access_token: string; token_type: string } = await res.json();

    await setToken(data.access_token);

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
