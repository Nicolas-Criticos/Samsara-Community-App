/* ======================================================
   IMPORTS
====================================================== */
import { supabaseClient } from "./supabase.js";

/* ======================================================
   GLOBAL STATE
====================================================== */
let currentUserId = null;
const realm = document.body.dataset.realm || "samsara";

/* ======================================================
   DOM REFERENCES
====================================================== */
const field = document.getElementById("projectField");

const detailModal = document.getElementById("projectDetail");
const detailInner = detailModal.querySelector(".project-detail-inner");

const detailImage = document.getElementById("detailProjectImage");
const detailTitle = document.getElementById("detailProjectTitle");
const detailDesc = document.getElementById("detailProjectDescription");

const detailCreator = document.getElementById("detailProjectCreator");
const detailContributors = document.getElementById("detailProjectContributors");
const detailRoles = document.getElementById("detailProjectRoles");

const statusControl = document.getElementById("projectStatusControl");
const primaryActionBtn = document.getElementById("detailProjectAction");

const createModal = document.getElementById("projectCreate");

/* ======================================================
   SESSION BOOTSTRAP
====================================================== */
(async () => {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) {
    window.location.href = "/index.html";
    return;
  }

  currentUserId = session.user.id;
  await loadProjects();
})();

/* ======================================================
   REALM TOGGLE
====================================================== */
const toggle = document.getElementById("realmToggle");
if (toggle) {
  toggle.checked = realm === "vrischgewagt";
  toggle.addEventListener("change", () => {
    window.location.href = toggle.checked
      ? "vrischgewagt.html"
      : "samsara.html";
  });
}

/* ======================================================
   LOAD PROJECTS
====================================================== */
async function loadProjects() {
  const { data, error } = await supabaseClient
    .from("projects")
    .select(`
  id,
  title,
  description,
  image_url,
  status,
  roles_needed,
  created_by,
  chinese_new_year,
  inspiration_link
`)

    .eq("realm", realm)
    .eq("archived", false)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Project load error:", error);
    return;
  }

  field.innerHTML = "";
  data.forEach((project, i) =>
    setTimeout(() => spawnProjectNode(project), i * 700)
  );
}

/* ======================================================
   SPAWN PROJECT NODE
====================================================== */
async function spawnProjectNode(project) {
  const node = document.createElement("div");
  node.className = "project-node";
  node.innerHTML = `<span>${project.title}</span>`;

  const statusLight = document.createElement("div");
  statusLight.className = `project-status status-${project.status}`;
  node.appendChild(statusLight);

  // 🧧 Chinese New Year indicator
  if (project.chinese_new_year) {
    const cny = document.createElement("div");
    cny.className = "project-cny-indicator";
    cny.title = "Chinese New Year Project";
    cny.textContent = "🧧";
    node.appendChild(cny);
  }

  node.onclick = () => openProjectDetail(project);

  const size = 140;
  node.style.left = Math.random() * (window.innerWidth - size) + "px";
  node.style.top = Math.random() * (window.innerHeight - size) + "px";

  // 🔔 Application indicator (creator only)
  if (project.created_by === currentUserId) {
    const { count } = await supabaseClient
      .from("project_applications")
      .select("*", { count: "exact", head: true })
      .eq("project_id", project.id)
      .eq("realm", realm)
      .eq("status", "pending");

    if (count > 0) {
      node.classList.add("has-applications");
      node.dataset.appCount = count;
    }
  }

  field.appendChild(node);
}

/* ======================================================
   RESET DETAIL UI
====================================================== */
function resetProjectDetailUI() {
  statusControl.innerHTML = "";
  primaryActionBtn.className = "project-action-btn";
  primaryActionBtn.onclick = null;
  primaryActionBtn.disabled = false;
  primaryActionBtn.style.display = "inline-flex";

  detailInner
    .querySelectorAll(".application-bubble, .project-end-btn")
    .forEach(el => el.remove());
}

/* ======================================================
   OPEN PROJECT DETAIL
====================================================== */
async function openProjectDetail(project) {
  resetProjectDetailUI();
  detailModal.style.display = "flex";

  detailTitle.textContent = project.title;
  detailDesc.textContent = project.description;

  if (project.image_url) {
    detailImage.src = project.image_url;
    detailImage.style.display = "block";
  } else {
    detailImage.style.display = "none";
  }

  if (project.inspiration_link) {
  renderInspirationButton(project.inspiration_link);
}


  const { data: creator } = await supabaseClient
    .from("members")
    .select("username")
    .eq("user_id", project.created_by)
    .single();

  detailCreator.textContent =
    `Created by ${creator?.username  || "Unknown"}`;

  await renderContributors(project.id);

  detailRoles.textContent =
    project.roles_needed ? `Needed: ${project.roles_needed}` : "";

  renderStatusControl(project);
  configurePrimaryAction(project);

  if (project.created_by === currentUserId) {
    renderEndProjectButton(project);
    loadApplications(project.id);
  }

  console.log("project.inspiration_link =", project.inspiration_link);

}

/* ======================================================
   CONTRIBUTORS
====================================================== */
async function renderContributors(projectId) {
  // 1. Get contributor user IDs
  const { data: contributors, error } = await supabaseClient
    .from("project_contributors")
    .select("member_id")
    .eq("project_id", projectId)
    .eq("realm", realm);

  if (error || !contributors?.length) {
    detailContributors.textContent = "Contributors: None";
    return;
  }

  // 2. Fetch usernames
  const userIds = contributors.map(c => c.member_id);

  const { data: members } = await supabaseClient
    .from("members")
    .select("user_id, username")
    .in("user_id", userIds);

  detailContributors.textContent =
    members?.length
      ? "Contributors: " + members.map(m => m.username).join(", ")
      : "Contributors: None";
}


/* ======================================================
   PRIMARY ACTION BUTTON
====================================================== */
function configurePrimaryAction(project) {
  if (project.created_by === currentUserId) {
    primaryActionBtn.style.display = "none";
    return;
  }

  if (project.status === "closed") {
    primaryActionBtn.textContent = "Project Closed";
    primaryActionBtn.classList.add("project-action-closed");
    primaryActionBtn.disabled = true;
    return;
  }

  if (project.status === "open") {
    primaryActionBtn.textContent = "Join Project";
    primaryActionBtn.classList.add("project-action-open");
    primaryActionBtn.onclick = () => joinProject(project);
    return;
  }

  if (project.status === "application") {
    primaryActionBtn.textContent = "Apply to Join";
    primaryActionBtn.classList.add("project-action-application");
    primaryActionBtn.onclick = () => applyToProject(project.id);
  }
}

/* ======================================================
   JOIN PROJECT
====================================================== */
async function joinProject(project) {
  const { data: existing } = await supabaseClient
    .from("project_contributors")
    .select("id")
    .eq("project_id", project.id)
    .eq("member_id", currentUserId)
    .eq("realm", realm)
    .maybeSingle();

  if (existing) {
    alert("You are already part of this project.");
    return;
  }

  await supabaseClient
    .from("project_contributors")
    .insert({
      project_id: project.id,
      member_id: currentUserId,
      realm
    });

  await renderContributors(project.id);
}

/* ======================================================
   APPLY TO PROJECT
====================================================== */
async function applyToProject(projectId) {
  const message = prompt("Why do you feel called to contribute?");
  if (!message) return;

  await supabaseClient
    .from("project_applications")
    .insert({
      project_id: projectId,
      applicant_id: currentUserId,
      message,
      status: "pending",
      realm
    });
}

/* ======================================================
   APPLICATIONS
====================================================== */
async function loadApplications(projectId) {
  const { data: apps, error } = await supabaseClient
    .from("project_applications")
    .select("id, message, applicant_id")
    .eq("project_id", projectId)
    .eq("realm", realm)
    .eq("status", "pending");

  if (error || !apps?.length) return;

  // Fetch usernames
  const userIds = apps.map(a => a.applicant_id);

  const { data: members } = await supabaseClient
    .from("members")
    .select("user_id, username")
    .in("user_id", userIds);

  const nameMap = Object.fromEntries(
    members.map(m => [m.user_id, m.username])
  );

  const bubble = document.createElement("div");
  bubble.className = "application-bubble";
  bubble.textContent = `🟠 ${apps.length} application(s) pending`;

  bubble.onclick = () => handleApplications(apps, nameMap, projectId);
  detailInner.appendChild(bubble);
}


async function handleApplications(apps, nameMap, projectId) {
  for (const app of apps) {
    const approve = confirm(
      `${nameMap[app.applicant_id] || "Unknown"}\n\n${app.message}\n\nApprove?`
    );

    if (approve) {
      await supabaseClient.from("project_contributors").insert({
        project_id: projectId,
        member_id: app.applicant_id,
        realm
      });

      await supabaseClient
        .from("project_applications")
        .update({ status: "approved" })
        .eq("id", app.id)
        .eq("realm", realm);
    } else {
      await supabaseClient
        .from("project_applications")
        .update({ status: "rejected" })
        .eq("id", app.id)
        .eq("realm", realm);
    }
  }

  await renderContributors(projectId);
  alert("Applications processed.");
}


/* ======================================================
   STATUS CONTROL
====================================================== */
function renderStatusControl(project) {
  if (project.created_by !== currentUserId) return;

  statusControl.innerHTML = "";
  const select = document.createElement("select");

  ["open", "application", "closed"].forEach(status => {
    const opt = document.createElement("option");
    opt.value = status;
    opt.textContent =
      status === "open" ? "🟢 Open" :
      status === "application" ? "🟠 Application" :
      "🔴 Closed";

    if (status === project.status) opt.selected = true;
    select.appendChild(opt);
  });

  select.onchange = async () => {
    await supabaseClient
      .from("projects")
      .update({ status: select.value })
      .eq("id", project.id)
      .eq("created_by", currentUserId)
      .eq("realm", realm);

    project.status = select.value;
    await loadProjects();
  };

  statusControl.appendChild(select);
}

/* ======================================================
   END PROJECT
====================================================== */
function renderEndProjectButton(project) {
  const btn = document.createElement("button");
  btn.className = "project-end-btn project-action-btn subtle";
  btn.textContent = "End Project";

  btn.onclick = async () => {
    if (!confirm("This will end the project permanently.")) return;

    await supabaseClient
      .from("projects")
      .update({ archived: true, status: "closed" })
      .eq("id", project.id)
      .eq("created_by", currentUserId)
      .eq("realm", realm);

    closeProjectDetail();
    await loadProjects();
  };

  detailInner.appendChild(btn);
}

/* ======================================================
   CREATE MODAL
====================================================== */
function openProjectCreate() {
  createModal.style.display = "flex";
}

function closeProjectCreate() {
  createModal.style.display = "none";
}

/* ======================================================
   SUBMIT PROJECT
====================================================== */
async function submitProject() {
  const title = document.getElementById("createProjectTitle").value.trim();
  const description = document.getElementById("createProjectDescription").value.trim();
  const timeline = document.getElementById("createProjectTimeline").value.trim();
  const imageInput = document.getElementById("projectImageUpload");
const inspirationLink =
  document.getElementById("inspiration_link")?.value.trim() || null;

  const { data: { session }, error: sessionError } =
  await supabaseClient.auth.getSession();

if (!session || sessionError) {
  alert("Session expired. Please refresh and log in again.");
  return;
}

  const status =
    document.querySelector('input[name="projectStatus"]:checked')?.value || "open";

  const chineseNewYear =
    document.getElementById("createProjectCNY")?.checked || false;

  if (!title || !description) {
    alert("Project requires a name and description.");
    return;
  }

  let image_url = null;

  /* =====================================
     1. UPLOAD IMAGE (OPTIONAL)
  ===================================== */
  if (imageInput.files.length > 0) {
    const file = imageInput.files[0];
    const ext = file.name.split(".").pop().toLowerCase();
    const path = `projects/${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await supabaseClient
      .storage
      .from("project-images") // ✅ bucket name
      .upload(path, file, {
        upsert: false,
        contentType: file.type
      });

    if (uploadError) {
      console.error("❌ Image upload failed:", uploadError);
      alert("Image upload failed.");
      return;
    }

    image_url = supabaseClient
      .storage
      .from("project-images")
      .getPublicUrl(path).data.publicUrl;
  }

  /* =====================================
     2. INSERT PROJECT (WITH IMAGE)
  ===================================== */
  const { data, error } = await supabaseClient
    .from("projects")
   .insert([{
  title,
  description,
  timeline,
  status,
  created_by: currentUserId,
  realm,
  archived: false,
  chinese_new_year: chineseNewYear,
  image_url,
  inspiration_link: inspirationLink
}])

    .select()
    .single();

  if (error) {
    console.error("❌ Project insert failed:", error);
    alert("Failed to create project.");
    return;
  }

  /* =====================================
     3. CLEAN UP + RENDER
  ===================================== */
  closeProjectCreate();
  spawnProjectNode(data);
}

function renderInspirationButton(link) {
  document.querySelector(".project-link-btn")?.remove();

  const btn = document.createElement("div");
  btn.className = "project-link-btn";
  btn.title = "View visual inspiration";

  // Icon
  btn.innerHTML = `<span>🖼️</span>`;

  btn.onclick = () => {
    window.open(link, "_blank", "noopener,noreferrer");
  };

  // Append INSIDE the circle
  detailInner.appendChild(btn);

  // Position INSIDE the circle (top-right quadrant)
  requestAnimationFrame(() => {
    const rect = detailInner.getBoundingClientRect();
    const size = 44;

    // place it inside the circular boundary
    const centerX = rect.width / 2;
const centerY = rect.height / 2;

// place button in top-right quadrant, safely inside the circle
btn.style.left = `${centerX + 0.35 * centerX - size / 2}px`;
btn.style.top  = `${centerY - 0.35 * centerY - size / 2}px`;

  });
}



/* ======================================================
   GLOBAL EXPORTS
====================================================== */
window.openProjectCreate = openProjectCreate;
window.closeProjectCreate = closeProjectCreate;
window.submitProject = submitProject;
window.closeProjectDetail = () => {
  detailModal.style.display = "none";
  document.querySelector(".project-link-btn")?.remove();
};
