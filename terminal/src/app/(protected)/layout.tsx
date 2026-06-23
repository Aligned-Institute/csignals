import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { IdleTimer } from "@/components/auth/IdleTimer";
import { AppShell } from "@/components/layout/AppShell";

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_KEY || '';

async function validateToken(token: string): Promise<boolean> {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return false;
  }
  const cleanUrl = SUPABASE_URL.replace(/\/$/, '');
  try {
    const res = await fetch(`${cleanUrl}/auth/v1/user`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${token}`,
      },
      cache: 'no-store',
    });
    return res.status === 200;
  } catch (err) {
    console.error('[AUTH LAYOUT] Failed to validate session token:', err);
    return false;
  }
}

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isSupabaseConfigured = (
    SUPABASE_URL &&
    SUPABASE_KEY &&
    !SUPABASE_URL.includes('your-project-id')
  );

  if (isSupabaseConfigured) {
    const cookieStore = await cookies();
    const token = cookieStore.get("asi_token");
    if (!token) {
      redirect("/login");
    }
    const isValid = await validateToken(token.value);
    if (!isValid) {
      redirect("/login");
    }
  }

  return (
    <div className="flex flex-col min-h-screen w-full">
      <IdleTimer />
      <AppShell>{children}</AppShell>
    </div>
  );
}
