import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_KEY || '';

export async function POST(request: NextRequest) {
  try {
    const { token, new_password } = await request.json();

    if (!token || !new_password) {
      return NextResponse.json(
        { error: 'Token and new password are required' },
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
    const res = await fetch(`${cleanUrl}/auth/v1/user`, {
      method: 'PUT',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password: new_password }),
    }).catch((fetchErr) => {
      console.error('[RESET-PASSWORD] Supabase unreachable:', fetchErr.message);
      return null;
    });

    if (!res) {
      return NextResponse.json(
        { error: 'Unable to reach password reset service. Please try again.' },
        { status: 503 },
      );
    }

    if (!res.ok) {
      const body = await res.json().catch(() => ({ error_description: res.statusText }));
      return NextResponse.json(
        { error: body.error_description || body.error || 'Password reset failed' },
        { status: res.status },
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
