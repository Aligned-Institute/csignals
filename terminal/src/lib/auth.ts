import { cookies } from 'next/headers';

const COOKIE_NAME = 'asi_token';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export async function getToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value;
}

export async function setToken(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  });
}

export async function clearToken() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
