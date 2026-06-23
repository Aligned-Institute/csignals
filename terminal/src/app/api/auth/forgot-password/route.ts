import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_KEY || '';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
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
    const res = await fetch(`${cleanUrl}/auth/v1/recover`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    }).catch((fetchErr) => {
      console.error('[FORGOT-PASSWORD] Supabase unreachable:', fetchErr.message);
      return null;
    });

    if (!res) {
      return NextResponse.json(
        { error: 'Unable to reach password recovery service. Please try again.' },
        { status: 503 },
      );
    }

    if (!res.ok) {
      const body = await res.json().catch(() => ({ error_description: res.statusText }));
      return NextResponse.json(
        { error: body.error_description || body.error || 'Password recovery request failed' },
        { status: res.status },
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
