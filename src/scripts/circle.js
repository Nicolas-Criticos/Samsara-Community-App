// scripts/circle.js
import { supabaseClient } from "./supabase.js";

/* ===========================
   DOM REFERENCES
=========================== */
const titleEl = document.querySelector(".circle-title");
const riteField = document.getElementById("riteField");
const particles = document.getElementById("particles");

const profileModal = document.getElementById("memberProfile");
const profileUsername = document.getElementById("profileUsername");
const profileBio = document.getElementById("profileBio");
const profileProjects = document.getElementById("profileProjects");
const profileSaveBtn = document.getElementById("profileSaveBtn");

let currentUserId = null;
let activeProfileUserId = null;

/* ===========================
   SESSION GUARD
=========================== */
(async () => {
  const { data } = await supabaseClient.auth.getSession();

  if (!data?.session) {
    window.location.href = "/index.html";
    return;
  }

  currentUserId = data.session.user.id;
  await enterCircle(currentUserId);
})();

/* ===========================
   ENTER CIRCLE
=========================== */
async function enterCircle(userId) {
  const { data, error } = await supabaseClient
    .from("members")
    .select("username, archetype")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) {
    console.error("❌ Member not found:", error);
    return;
  }

  titleEl.textContent = `Welcome, ${data.username}`;
  spawnParticles();
  loadRiteMembers();
}

/* ===========================
   PARTICLES
=========================== */
function spawnParticles() {
  particles.innerHTML = "";
  for (let i = 0; i < 60; i++) {
    const p = document.createElement("div");
    p.className = "particle";
    p.style.left = Math.random() * 100 + "%";
    p.style.top = Math.random() * 100 + "%";
    p.style.setProperty("--speed", `${14 + Math.random() * 18}s`);
    p.style.setProperty("--size", `${2 + Math.random() * 2.5}px`);
    particles.appendChild(p);
  }
}

/* ===========================
   LOAD MEMBERS
=========================== */
async function loadRiteMembers() {
  riteField.innerHTML = "";

  const { data, error } = await supabaseClient
    .from("members")
    .select("user_id, username, archetype, bio")
    .not("username", "is", null)
    .not("archetype", "is", null)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("❌ Failed to load members:", error);
    return;
  }

  data.forEach((member, i) => {
    setTimeout(() => spawnBubble(member), i * 900);
  });
}

/* ===========================
   SPAWN BUBBLE
=========================== */
function spawnBubble(member) {
  const bubble = document.createElement("div");
  bubble.className = "rite-bubble";

  bubble.innerHTML = `
    <div class="bubble-inner">
      <span class="bubble-name">${member.username}</span>
      <span class="bubble-archetype">${member.archetype}</span>
    </div>
  `;

  bubble.addEventListener("click", () => openMemberProfile(member));

  const size = 110;
  const w = window.innerWidth;
  const h = window.innerHeight;
  const cx = w / 2;
  const cy = h / 2;
  const forbidden = Math.min(w, h) * 0.22;

  let x, y;
  for (let i = 0; i < 120; i++) {
    const tx = Math.random() * (w - size);
    const ty = Math.random() * (h - size);
    const dx = tx + size / 2 - cx;
    const dy = ty + size / 2 - cy;
    if (Math.sqrt(dx * dx + dy * dy) > forbidden) {
      x = tx;
      y = ty;
      break;
    }
  }

  if (x === undefined) {
    const a = Math.random() * Math.PI * 2;
    x = cx + Math.cos(a) * (forbidden + 80) - size / 2;
    y = cy + Math.sin(a) * (forbidden + 80) - size / 2;
  }

  bubble.style.left = `${x}px`;
  bubble.style.top = `${y}px`;

  riteField.appendChild(bubble);
}

/* ===========================
   OPEN PROFILE
=========================== */
async function openMemberProfile(member) {
  activeProfileUserId = member.user_id;

  profileModal.style.display = "flex";
  profileUsername.textContent = member.username;
  profileBio.value = member.bio || "";

  const isSelf = member.user_id === currentUserId;

  profileBio.disabled = !isSelf;
  profileSaveBtn.style.display = isSelf ? "inline-flex" : "none";

  await loadMemberProjects(member.user_id);
}

/* ===========================
   LOAD PROJECTS
=========================== */
async function loadMemberProjects(userId) {
  profileProjects.innerHTML = "<h4>Projects</h4>";

  /* ---------------------------
     1. Projects CREATED by user
  ---------------------------- */
  const { data: created, error: createdError } = await supabaseClient
    .from("projects")
    .select("id, title, realm")
    .eq("created_by", userId)
    .eq("archived", false);

  if (createdError) {
    console.error("❌ Created projects error:", createdError);
  }

  /* ---------------------------
     2. Projects CONTRIBUTED to
  ---------------------------- */
  const { data: contributed, error: contribError } = await supabaseClient
    .from("project_contributors")
    .select(`
      project_id,
      realm,
      projects (
        id,
        title
      )
    `)
    .eq("user_id", userId);

  if (contribError) {
    console.error("❌ Contributed projects error:", contribError);
  }

  /* ---------------------------
     3. Merge + dedupe
  ---------------------------- */
  const map = new Map();

  (created || []).forEach(p => {
    map.set(p.id, {
      title: p.title,
      realm: p.realm,
      role: "Creator"
    });
  });

  (contributed || []).forEach(row => {
    if (!row.projects) return;

    if (!map.has(row.projects.id)) {
      map.set(row.projects.id, {
        title: row.projects.title,
        realm: row.realm,
        role: "Contributor"
      });
    }
  });

  /* ---------------------------
     4. Render
  ---------------------------- */
  if (map.size === 0) {
    profileProjects.innerHTML += "<p>No active projects</p>";
    return;
  }

  map.forEach(p => {
    const el = document.createElement("div");
    el.className = "profile-project-item";
    el.textContent = `${p.title} — ${p.role}`;
    profileProjects.appendChild(el);
  });
}


/* ===========================
   SAVE PROFILE (BIO ONLY)
=========================== */
profileSaveBtn.onclick = async () => {
  const bio = profileBio.value.trim();

  const { error } = await supabaseClient
    .from("members")
    .update({ bio })
    .eq("user_id", currentUserId);

  if (error) {
    console.error("❌ Profile update failed:", error);
    alert("Failed to save profile.");
    return;
  }

  profileModal.style.display = "none";
  activeProfileUserId = null;
};

/* ===========================
   CLOSE PROFILE
=========================== */
window.closeMemberProfile = () => {
  profileModal.style.display = "none";
  activeProfileUserId = null;
};
