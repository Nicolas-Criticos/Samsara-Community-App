// scripts/supabase.js
// scripts/supabase.js

const SUPABASE_URL = "https://recqyhjooukkdwsrjslp.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJlY3F5aGpvb3Vra2R3c3Jqc2xwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxMjkzMTAsImV4cCI6MjA4MzcwNTMxMH0.vN0bzTBBrtSBzicjniXXyCUAdn9YIWKHmXIKMJKb0rg";

export const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
);


