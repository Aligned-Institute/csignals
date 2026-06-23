import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Server-side API endpoint pointing to python FastAPI backend
const API_URL = process.env.API_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  try {
    const { message, context, model } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: 'Message query is required' },
        { status: 400 },
      );
    }

    const cookieStore = await cookies();
    const token = cookieStore.get('asi_token')?.value;

    const res = await fetch(`${API_URL}/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: message, context, token, model }),
    }).catch((fetchErr) => {
      console.error('[SAGE API] Backend unreachable:', fetchErr.message);
      return null;
    });

    if (!res) {
      return NextResponse.json(
        { error: 'Unable to reach the AI query service. Please check if your FastAPI backend is running.' },
        { status: 503 },
      );
    }

    if (!res.ok) {
      const body = await res.json().catch(() => ({ detail: res.statusText }));
      return NextResponse.json(
        { error: body.detail || 'Failed to execute query' },
        { status: res.status },
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
