// scripts/auth.js
import { supabaseClient } from "./supabase.js";

const authGate = document.getElementById("authGate");
const authError = document.getElementById("authError");
const authTitle = document.getElementById("authTitle");

const loginStage = document.getElementById("loginStage");
const signupStage = document.getElementById("signupStage");

/* ===========================
   UI HELPERS
=========================== */
function showSignup() {
  authTitle.innerText = "Rite of Entry";
  loginStage.style.display = "none";
  signupStage.style.display = "block";
  authError.innerText = "";
}

function showLogin() {
  authTitle.innerText = "Return";
  signupStage.style.display = "none";
  loginStage.style.display = "block";
  authError.innerText = "";
}

window.showSignup = showSignup;
window.showLogin = showLogin;

/* ===========================
   SIGNUP (INVITE ONLY)
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

  /* 🔍 STEP 1: VERIFY INVITE */
  const { data: member, error: inviteError } = await supabaseClient
    .from("members")
    .select("id, user_id")
    .eq("email", email)
    .maybeSingle();

  if (inviteError) {
    authError.innerText = "Invite verification failed.";
    return;
  }

  if (!member) {
    authError.innerText = "This email has not been invited.";
    return;
  }

  if (member.user_id) {
    authError.innerText = "This invite has already been claimed.";
    showLogin();
    return;
  }

  /* 🔐 STEP 2: CREATE AUTH USER */
  const { data: authData, error: authErr } =
    await supabaseClient.auth.signUp({
      email,
      password
    });

  if (authErr) {
    authError.innerText = authErr.message;
    return;
  }

  if (!authData?.user) {
    authError.innerText = "Signup failed. Try again.";
    return;
  }

  /* 🔗 STEP 3: CLAIM MEMBER RECORD */
  const { error: claimError } = await supabaseClient
    .from("members")
    .update({
      user_id: authData.user.id,
      username
    })
    .eq("id", member.id);

  if (claimError) {
    authError.innerText =
      "Account created, but linking failed. Contact admin.";
    return;
  }

  showLogin();
  authError.innerText = "Rite complete. You may now enter.";
};

/* ===========================
   LOGIN
=========================== */
window.login = async function () {
  const email = document.getElementById("email").value.trim().toLowerCase();
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

  window.location.href = "circle.html";
};

/* ===========================
   SESSION BOOTSTRAP
=========================== */
(async () => {
  const { data: { session } } =
    await supabaseClient.auth.getSession();

  if (session) {
    window.location.href = "circle.html";
  } else {
    authGate.style.display = "flex";
  }
})();
