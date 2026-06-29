import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ahhwzrwszvodxivlfiek.supabase.co';
// Using the service key for active websocket subscription matching the workspace environment
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFoaHd6cndzenZvZHhpdmxmaWVrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTk1ODMzNSwiZXhwIjoyMDk3NTM0MzM1fQ.13RvTw0PXBZLsp7RRXQRfznRFIJQ0sz7bUa0cZ7QRFc';

export const supabase = createClient(supabaseUrl, supabaseKey);
