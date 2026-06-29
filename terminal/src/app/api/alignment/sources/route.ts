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

    const res = await fetch(`${API_URL}/sources`, {
      method: 'GET',
      headers,
      cache: 'no-store',
    }).catch(() => null);

    if (!res || !res.ok) {
      return NextResponse.json([]);
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json([]);
  }
}
