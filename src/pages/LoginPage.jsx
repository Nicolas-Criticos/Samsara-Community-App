import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase.js";
import "../styles/auth.css";

export default function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("login");
  const [authError, setAuthError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [passwordSignup, setPasswordSignup] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/circle", { replace: true });
      }
    });
  }, [navigate]);

  async function signup() {
    setAuthError("");
    const e = email.trim().toLowerCase();
    const u = username.trim();
    const p = passwordSignup;
    const confirm = passwordConfirm;

    if (!e || !u || !p) {
      setAuthError("All fields are required.");
      return;
    }

    if (p !== confirm) {
      setAuthError("Passwords do not match.");
      return;
    }

    const { data: member, error: inviteError } = await supabase
      .from("members")
      .select("id, user_id")
      .eq("email", e)
      .maybeSingle();

    if (inviteError) {
      setAuthError("Invite verification failed.");
      return;
    }

    if (!member) {
      setAuthError("This email has not been invited.");
      return;
    }

    if (member.user_id) {
      setAuthError("This invite has already been claimed.");
      setMode("login");
      return;
    }

    const { data: authData, error: authErr } = await supabase.auth.signUp({
      email: e,
      password: p,
    });

    if (authErr) {
      setAuthError(authErr.message);
      return;
    }

    if (!authData?.user) {
      setAuthError("Signup failed. Try again.");
      return;
    }

    const { error: claimError } = await supabase
      .from("members")
      .update({
        user_id: authData.user.id,
        username: u,
      })
      .eq("id", member.id);

    if (claimError) {
      setAuthError("Account created, but linking failed. Contact admin.");
      return;
    }

    setMode("login");
    setAuthError("Rite complete. You may now enter.");
  }

  async function login() {
    setAuthError("");
    const e = email.trim().toLowerCase();
    const p = password;

    const { error } = await supabase.auth.signInWithPassword({
      email: e,
      password: p,
    });

    if (error) {
      setAuthError(error.message);
      return;
    }

    navigate("/circle", { replace: true });
  }

  return (
    <div className="auth-gate" style={{ display: "flex" }}>
      <div className="auth-card">
        <h2>{mode === "login" ? "Login" : "Rite of Entry"}</h2>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(ev) => setEmail(ev.target.value)}
        />

        {mode === "login" ? (
          <div id="loginStage">
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(ev) => setPassword(ev.target.value)}
            />
            <button type="button" onClick={login}>
              Login
            </button>
            <p>
              <button
                type="button"
                className="link-like"
                onClick={() => {
                  setMode("signup");
                  setAuthError("");
                }}
              >
                No account? Sign up
              </button>
            </p>
          </div>
        ) : (
          <div id="signupStage">
            <input
              placeholder="Username"
              value={username}
              onChange={(ev) => setUsername(ev.target.value)}
            />
            <input
              type="password"
              placeholder="Create password"
              value={passwordSignup}
              onChange={(ev) => setPasswordSignup(ev.target.value)}
            />
            <input
              type="password"
              placeholder="Repeat password"
              value={passwordConfirm}
              onChange={(ev) => setPasswordConfirm(ev.target.value)}
            />
            <button type="button" onClick={signup}>
              Create account
            </button>
            <p>
              <button
                type="button"
                className="link-like"
                onClick={() => {
                  setMode("login");
                  setAuthError("");
                }}
              >
                Back to login
              </button>
            </p>
          </div>
        )}

        {authError ? <p id="authError">{authError}</p> : null}
      </div>
    </div>
  );
}
