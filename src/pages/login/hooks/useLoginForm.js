import { useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { useAuthSession } from "../../../hooks/useAuthSession.js";
import {
  signInWithEmailPassword,
  signUpWithInvite,
} from "../../../lib/authInvite.js";

export function useLoginForm() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("login");
  const [authNotice, setAuthNotice] = useState("");
  const { data: session } = useAuthSession();

  const loginForm = useForm({
    defaultValues: { email: "", password: "" },
  });

  const signupForm = useForm({
    defaultValues: {
      email: "",
      username: "",
      passwordSignup: "",
      passwordConfirm: "",
    },
  });

  useEffect(() => {
    if (session) {
      navigate("/circle", { replace: true });
    }
  }, [session, navigate]);

  const loginMutation = useMutation({
    mutationFn: async ({ email, password }) => {
      const { error } = await signInWithEmailPassword(email, password);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => navigate("/circle", { replace: true }),
    onError: (err) => setAuthNotice(err.message || "Login failed"),
  });

  const signupMutation = useMutation({
    mutationFn: async (values) => {
      const result = await signUpWithInvite({
        email: values.email,
        username: values.username,
        password: values.passwordSignup,
        passwordConfirm: values.passwordConfirm,
      });
      if (!result.ok) {
        const err = new Error(result.message || "Sign up failed");
        err.switchToLogin = result.switchToLogin;
        throw err;
      }
    },
    onSuccess: (_, variables) => {
      setMode("login");
      setAuthNotice("Rite complete. You may now enter.");
      loginForm.reset({
        email: variables.email.trim(),
        password: "",
      });
      signupForm.reset({
        email: "",
        username: "",
        passwordSignup: "",
        passwordConfirm: "",
      });
    },
    onError: (err) => {
      setAuthNotice(err.message || "Sign up failed");
      if (err.switchToLogin) setMode("login");
    },
  });

  function loginSubmit(values) {
    setAuthNotice("");
    loginMutation.mutate({
      email: values.email.trim(),
      password: values.password,
    });
  }

  function signupSubmit(values) {
    setAuthNotice("");
    signupMutation.mutate(values);
  }

  function switchToSignup() {
    setMode("signup");
    setAuthNotice("");
    loginMutation.reset();
    signupMutation.reset();
  }

  function switchToLogin() {
    setMode("login");
    setAuthNotice("");
    loginMutation.reset();
    signupMutation.reset();
  }

  return {
    mode,
    authNotice,
    loginForm,
    signupForm,
    loginSubmit: loginForm.handleSubmit(loginSubmit),
    signupSubmit: signupForm.handleSubmit(signupSubmit),
    switchToSignup,
    switchToLogin,
    loginPending: loginMutation.isPending,
    signupPending: signupMutation.isPending,
  };
}
