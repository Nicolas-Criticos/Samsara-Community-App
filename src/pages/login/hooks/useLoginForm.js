import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../../lib/supabase.js";
import {
  signInWithEmailPassword,
  signUpWithInvite,
} from "../../../lib/authInvite.js";

export function useLoginForm() {
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
    const result = await signUpWithInvite({
      email,
      username,
      password: passwordSignup,
      passwordConfirm,
    });

    if (!result.ok) {
      setAuthError(result.message);
      if (result.switchToLogin) setMode("login");
      return;
    }

    setMode("login");
    setAuthError("Rite complete. You may now enter.");
  }

  async function login() {
    setAuthError("");
    const { error } = await signInWithEmailPassword(email, password);

    if (error) {
      setAuthError(error.message);
      return;
    }

    navigate("/circle", { replace: true });
  }

  return {
    mode,
    setMode,
    authError,
    setAuthError,
    email,
    setEmail,
    password,
    setPassword,
    username,
    setUsername,
    passwordSignup,
    setPasswordSignup,
    passwordConfirm,
    setPasswordConfirm,
    login,
    signup,
  };
}
