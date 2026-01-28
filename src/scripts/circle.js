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
const profileArchetype = document.getElementById("profileArchetype");
const profileImage = document.getElementById("profileImage");
const profileImageInput = document.getElementById("profileImageInput");
const profileLink = document.getElementById("profileLink");
const profileHandle = document.getElementById("profileHandle");
const profilePdfInput = document.getElementById("profilePdfInput");
const profilePdfBtn = document.getElementById("profilePdfBtn");




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
    .select("user_id, username, name, archetype, bio, profile_image_url, website, profile_pdf_url")
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
      <span class="bubble-name">${member.name}</span>
      <span class="bubble-archetype">${member.archetype}</span>
    </div>
  `;

  if (member.profile_pdf_url) {
  const pdfLink = document.createElement("a");
  pdfLink.className = "bubble-pdf-link";
  pdfLink.href = member.profile_pdf_url;
  pdfLink.target = "_blank";
  pdfLink.rel = "noopener";
  pdfLink.textContent = "PDF";

  bubble.appendChild(pdfLink);
}

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
profileArchetype.textContent = member.archetype
  ? member.archetype.toUpperCase()
  : "";

  profileModal.style.display = "flex";
  profileUsername.textContent = member.name;
  profileBio.value = member.bio || "";

  const isSelf = member.user_id === currentUserId;

  profileBio.disabled = !isSelf;
  profileSaveBtn.style.display = isSelf ? "inline-flex" : "none";
  profilePdfBtn.style.display = isSelf ? "inline-flex" : "none";

  // Profile image
if (
  member.profile_image_url &&
  member.profile_image_url.startsWith("http")
) {
  profileImage.src = member.profile_image_url;
} else {
  profileImage.src = "";
}


const linkInput = document.getElementById("profileLink");
const linkDisplay = document.getElementById("profileLinkDisplay");

profileUsername.textContent = member.name || "";

const handleEl = profileHandle

if (!handleEl) {
  console.warn("profileHandle element missing from DOM");
} else {
  handleEl.textContent = member.username
    ? `(${member.username})`
    : "";
}




// Populate value
linkInput.value = member.website || "";

if (isSelf) {
  linkInput.style.display = "block";
  linkDisplay.style.display = "none";
} else {
  linkInput.style.display = "none";

  if (member.website) {
    linkDisplay.href = member.website.startsWith("http")
      ? member.website
      : `https://${member.website}`;

    linkDisplay.textContent =  "Find out more";

    linkDisplay.style.display = "inline-block";
  } else {
    linkDisplay.style.display = "none";
  }
}


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
    .eq("member_id", userId);

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

  const profileLinkInput = document.getElementById("profileLink");
  const profileImageInput = document.getElementById("profileImageInput");

  let website = profileLinkInput?.value.trim() || "";
  let profile_image_url = null;

  /* --------------------------
     NORMALIZE WEBSITE LINK
  -------------------------- */
  if (website) {
    if (!website.startsWith("http://") && !website.startsWith("https://")) {
      website = "https://" + website;
    }
  }

  /* --------------------------
     IMAGE UPLOAD (OPTIONAL)
  -------------------------- */
  if (profileImageInput && profileImageInput.files.length > 0) {
    const file = profileImageInput.files[0];
    const ext = file.name.split(".").pop().toLowerCase();
    const path = `profiles/${currentUserId}/avatar.${ext}`;

    const { error: uploadError } = await supabaseClient
      .storage
      .from("profile-image") // ✅ MUST MATCH BUCKET NAME
      .upload(path, file, {
        upsert: true,
        cacheControl: "3600"
      });

    if (uploadError) {
      console.error("❌ Image upload failed:", uploadError);
      alert("Image upload failed.");
      return;
    }

    profile_image_url = supabaseClient
      .storage
      .from("profile-image")
      .getPublicUrl(path).data.publicUrl;
  }

  /* --------------------------
     UPDATE MEMBER RECORD
  -------------------------- */
  const updatePayload = {
    bio,
    website,
    ...(profile_image_url && { profile_image_url })
  };

  const { error } = await supabaseClient
    .from("members")
    .update(updatePayload)
    .eq("user_id", currentUserId);

  if (error) {
    console.error("❌ Profile update failed:", error);
    alert("Failed to save profile.");
    return;
  }

  // Close modal cleanly
  profileModal.style.display = "none";
  activeProfileUserId = null;
};


profilePdfBtn.onclick = () => profilePdfInput.click();

profilePdfInput.addEventListener("change", async () => {
  const file = profilePdfInput.files[0];
  if (!file) return;

  if (file.type !== "application/pdf") {
    alert("Only PDF files allowed.");
    return;
  }

  const path = `${currentUserId}/profile.pdf`;

  const { error: uploadError } = await supabaseClient
    .storage
    .from("profile-pdf")
    .upload(path, file, {
      upsert: true,
      contentType: "application/pdf"
    });

  if (uploadError) {
    console.error(uploadError);
    alert("PDF upload failed.");
    return;
  }

  const pdfUrl = supabaseClient
    .storage
    .from("profile-pdf")
    .getPublicUrl(path).data.publicUrl;

  const { error } = await supabaseClient
    .from("members")
    .update({ profile_pdf_url: pdfUrl })
    .eq("user_id", currentUserId);

  if (error) {
    alert("Failed to save PDF link.");
    return;
  }

  alert("PDF uploaded successfully.");
});


/* ===========================
   CLOSE PROFILE
=========================== */
window.closeMemberProfile = () => {
  profileModal.style.display = "none";
  activeProfileUserId = null;
};

profileImage.addEventListener("click", () => {
  if (activeProfileUserId === currentUserId) {
    profileImageInput.click();
  }
});

profileImageInput.addEventListener("change", async () => {
  const file = profileImageInput.files[0];
  if (!file) return;

  const ext = file.name.split(".").pop();
  const path = `${currentUserId}.${ext}`;

  const { error: uploadError } = await supabaseClient
    .storage
    .from("profile-image")
    .upload(path, file, {
      upsert: true,
      contentType: file.type,
    });

  if (uploadError) {
    console.error("Upload failed:", uploadError);
    alert("Image upload failed");
    return;
  }

  const { data } = supabaseClient
    .storage
    .from("profile-image")
    .getPublicUrl(path);

  const imageUrl = data.publicUrl;

  const { error: updateError } = await supabaseClient
    .from("members")
    .update({ profile_image_url: imageUrl })
    .eq("user_id", currentUserId);

  if (updateError) {
    console.error("DB update failed:", updateError);
    alert("Profile update failed");
    return;
  }

  profileImage.src = imageUrl;
});
