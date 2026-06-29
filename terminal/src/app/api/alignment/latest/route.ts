import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_URL = process.env.API_URL || 'http://localhost:8000';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('asi_token')?.value;

    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_URL}/state/latest`, {
      method: 'GET',
      headers,
      cache: 'no-store',
    }).catch(() => null);

    if (!res) {
      return NextResponse.json(
        { error: 'Unable to reach backend service' },
        { status: 503 }
      );
    }

    if (!res.ok) {
      return NextResponse.json(
        { error: 'No latest aligned state found' },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
