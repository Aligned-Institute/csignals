import { NextRequest, NextResponse } from 'next/server';
import { getToken } from '@/lib/auth';

const API_URL = process.env.API_URL || 'http://localhost:8000';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ modelId: string }> }
) {
  const { modelId } = await params;
  const token = await getToken();
  if (!token) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  try {
    const res = await fetch(`${API_URL}/api/v1/signal/portfolio/${modelId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({ detail: res.statusText }));
      return NextResponse.json({ error: body.detail || 'Failed' }, { status: res.status });
    }
    return NextResponse.json(await res.json());
  } catch {
    return NextResponse.json({ error: 'Backend unreachable' }, { status: 503 });
  }
}
