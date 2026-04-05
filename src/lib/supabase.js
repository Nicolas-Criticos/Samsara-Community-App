import { createClient } from "@supabase/supabase-js";

const url =
  import.meta.env.VITE_SUPABASE_URL ?? "https://toxgvaqctxbqhqitmxkm.supabase.co";
const anonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRveGd2YXFjdHhicWhxaXRteGttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0MDg3NjksImV4cCI6MjA4NDk4NDc2OX0.P0r1zYtuxA0y0Qj8j6BpL1NJCwHn5vB68SI8jR4O4U0";

export const supabase = createClient(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
