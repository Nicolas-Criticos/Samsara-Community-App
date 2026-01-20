/* ======================================================
   IMPORTS
====================================================== */
import { supabaseClient } from "./supabase.js";

/* ======================================================
   GLOBAL STATE
====================================================== */
let currentUserId = null;

/* ======================================================
   REALM (SINGLE SOURCE OF TRUTH)
====================================================== */

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
   REALM TOGGLE (OPTIONAL)
====================================================== */


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
   LOAD PROJECTS
====================================================== */

const realm = document.body.dataset.realm || "samsara";

const toggle = document.getElementById("realmToggle");
if (toggle) {
  toggle.checked = realm === "vrischgewagt";

  toggle.addEventListener("change", () => {
    window.location.href = toggle.checked
      ? "vrischgewagt.html"
      : "samsara.html";
  });
}


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
      created_by
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

  // Creator
  const { data: creator } = await supabaseClient
    .from("members")
    .select("name")
    .eq("user_id", project.created_by)
    .single();

  detailCreator.textContent =
    `Created by ${creator?.name || "Unknown"}`;

  await renderContributors(project.id);

  detailRoles.textContent =
    project.roles_needed ? `Needed: ${project.roles_needed}` : "";

  renderStatusControl(project);
  configurePrimaryAction(project);

  if (project.created_by === currentUserId) {
    renderEndProjectButton(project);
    loadApplications(project.id);
  }
}

/* ======================================================
   CONTRIBUTORS
====================================================== */
async function renderContributors(projectId) {
  const { data } = await supabaseClient
    .from("project_contributors")
    .select("members(name)")
    .eq("project_id", projectId)
    .eq("realm", realm);

  detailContributors.textContent =
    data && data.length
      ? "Contributors: " + data.map(c => c.members.name).join(", ")
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

  const { error } = await supabaseClient
    .from("project_contributors")
    .insert({
      project_id: project.id,
      member_id: currentUserId,
      realm
    });

  if (error) {
    alert("Failed to join project.");
    return;
  }

  await renderContributors(project.id);
  alert("You have joined the project.");
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

  alert("Application sent.");
}

/* ======================================================
   APPLICATIONS (CREATOR)
====================================================== */
async function loadApplications(projectId) {
  const { data } = await supabaseClient
    .from("project_applications")
    .select("id, message, applicant_id, members(name)")
    .eq("project_id", projectId)
    .eq("realm", realm)
    .eq("status", "pending");

  if (!data?.length) return;

  const bubble = document.createElement("div");
  bubble.className = "application-bubble";
  bubble.textContent = `🟠 ${data.length} application(s) pending`;
  bubble.onclick = () => handleApplications(data, projectId);

  detailInner.appendChild(bubble);
}

async function handleApplications(apps, projectId) {
  for (const app of apps) {
    const approve = confirm(
      `${app.members.name}\n\n${app.message}\n\nApprove?`
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
   STATUS CONTROL (CREATOR)
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
    configurePrimaryAction(project);
    await loadProjects();
  };

  statusControl.appendChild(select);
}

/* ======================================================
   END PROJECT (CREATOR)
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
  const status =
    document.querySelector('input[name="projectStatus"]:checked')?.value || "open";

  if (!title || !description) {
    alert("Project requires a name and description.");
    return;
  }

  let imageUrl = null;
  const fileInput = document.getElementById("projectImageUpload");

  if (fileInput.files.length) {
    const file = fileInput.files[0];
    const ext = file.name.split(".").pop();
    const path = `projects/${crypto.randomUUID()}.${ext}`;

    const { error } = await supabaseClient
      .storage
      .from("project-images")
      .upload(path, file);

    if (error) {
      alert("Image upload failed.");
      return;
    }

    imageUrl = supabaseClient
      .storage
      .from("project-images")
      .getPublicUrl(path).data.publicUrl;
  }

  const { data, error } = await supabaseClient
    .from("projects")
    .insert([{
      title,
      description,
      timeline,
      image_url: imageUrl,
      status,
      created_by: currentUserId,
      realm,
      archived: false
    }])
    .select()
    .single();

  if (error) {
    alert("Failed to create project.");
    return;
  }

  closeProjectCreate();
  spawnProjectNode(data);
}

/* ======================================================
   GLOBAL EXPORTS
====================================================== */
window.openProjectCreate = openProjectCreate;
window.closeProjectCreate = closeProjectCreate;
window.submitProject = submitProject;
window.closeProjectDetail = () => {
  detailModal.style.display = "none";
};
