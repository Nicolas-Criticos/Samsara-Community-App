// scripts/auth.js
import { supabaseClient } from "./supabase.js";

const authGate = document.getElementById("authGate");
const authError = document.getElementById("authError");
const authTitle = document.getElementById("authTitle");

const loginStage = document.getElementById("loginStage");
const signupStage = document.getElementById("signupStage");

function showSignup() {
  authTitle.innerText = "Sign up";
  loginStage.style.display = "none";
  signupStage.style.display = "block";
  authError.innerText = "";
}

function showLogin() {
  authTitle.innerText = "Login";
  signupStage.style.display = "none";
  loginStage.style.display = "block";
  authError.innerText = "";
}

window.showSignup = showSignup;
window.showLogin = showLogin;

/* ===========================
   SIGNUP
=========================== */
window.signup = async function () {
  const email = document.getElementById("email").value.trim().toLowerCase();
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("passwordSignup").value;
  const confirm = document.getElementById("passwordConfirm").value;

  authError.innerText = "";

  if (!email || !username || !password) {
    authError.innerText = "All fields are required.";
    return;
  }

  if (password !== confirm) {
    authError.innerText = "Passwords do not match.";
    return;
  }

  // Must already exist in members
  const { data: member, error } = await supabaseClient
    .from("members")
    .select("id, user_id")
    .ilike("email", email)
    .maybeSingle();

  if (!member) {
    authError.innerText = "This email is not invited.";
    return;
  }

  if (member.user_id) {
    authError.innerText = "Account already exists. Please log in.";
    showLogin();
    return;
  }

  const { data: authData, error: authErrorResp } =
    await supabaseClient.auth.signUp({ email, password });

  if (authErrorResp) {
    authError.innerText = authErrorResp.message;
    return;
  }

  await supabaseClient
    .from("members")
    .update({
      user_id: authData.user.id,
      username
    })
    .eq("id", member.id);

  showLogin();
  authError.innerText = "Account created. Please log in.";
};

/* ===========================
   LOGIN
=========================== */
window.login = async function () {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  authError.innerText = "";

  const { error } = await supabaseClient.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    authError.innerText = error.message;
    return;
  }

  window.location.href = "/circle.html";
};

/* ===========================
   SESSION BOOTSTRAP
=========================== */
(async () => {
  const { data: { session } } = await supabaseClient.auth.getSession();

  if (session) {
    window.location.href = "/circle.html";
  } else {
    authGate.style.display = "flex";
  }
})();
