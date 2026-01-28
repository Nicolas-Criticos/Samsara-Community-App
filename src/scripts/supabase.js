// scripts/supabase.js
// scripts/supabase.js

const SUPABASE_URL = "https://toxgvaqctxbqhqitmxkm.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRveGd2YXFjdHhicWhxaXRteGttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0MDg3NjksImV4cCI6MjA4NDk4NDc2OX0.P0r1zYtuxA0y0Qj8j6BpL1NJCwHn5vB68SI8jR4O4U0";

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

window.supabaseClient = supabaseClient;
