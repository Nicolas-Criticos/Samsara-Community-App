import { supabase } from "./supabase.js";

/**
 * Invite-only signup: verify members row, sign up, link user_id + username.
 * @returns {{ ok: true } | { ok: false, message: string, switchToLogin?: boolean }}
 */
export async function signUpWithInvite({
  email: rawEmail,
  username: rawUsername,
  password,
  passwordConfirm,
}) {
  const email = rawEmail.trim().toLowerCase();
  const username = rawUsername.trim();

  if (!email || !username || !password) {
    return { ok: false, message: "All fields are required." };
  }

  if (password !== passwordConfirm) {
    return { ok: false, message: "Passwords do not match." };
  }

  const { data: member, error: inviteError } = await supabase
    .from("members")
    .select("id, user_id")
    .eq("email", email)
    .maybeSingle();

  if (inviteError) {
    return { ok: false, message: "Invite verification failed." };
  }

  if (!member) {
    return { ok: false, message: "This email has not been invited." };
  }

  if (member.user_id) {
    return {
      ok: false,
      message: "This invite has already been claimed.",
      switchToLogin: true,
    };
  }

  const { data: authData, error: authErr } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authErr) {
    return { ok: false, message: authErr.message };
  }

  if (!authData?.user) {
    return { ok: false, message: "Signup failed. Try again." };
  }

  const { error: claimError } = await supabase
    .from("members")
    .update({
      user_id: authData.user.id,
      username,
    })
    .eq("id", member.id);

  if (claimError) {
    return {
      ok: false,
      message: "Account created, but linking failed. Contact admin.",
    };
  }

  return { ok: true };
}

export async function signInWithEmailPassword(email, password) {
  const e = email.trim().toLowerCase();
  return supabase.auth.signInWithPassword({ email: e, password });
}
