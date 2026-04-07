import { supabase } from "./supabase.js";

export async function fetchProjectTasks(projectId) {
  return supabase
    .from("project_tasks")
    .select(
      "id, name, description, image, status, start_date, end_date, created_at"
    )
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });
}

export async function fetchProjectUpdates(projectId) {
  return supabase
    .from("project_updates")
    .select("id, title, description, image, created_at")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });
}

export async function insertProjectTask({
  projectId,
  realm,
  name,
  description,
  image,
  status = "Pending",
  start_date = null,
  end_date = null,
}) {
  const r = realm === "vrischgewagt" ? "vrischgewagt" : "samsara";
  return supabase.from("project_tasks").insert({
    project_id: projectId,
    realm: r,
    name,
    description: description || null,
    image: image || null,
    status,
    start_date: start_date || null,
    end_date: end_date || null,
  });
}

export async function insertProjectUpdate({
  projectId,
  title,
  description,
  image,
}) {
  return supabase.from("project_updates").insert({
    project_id: projectId,
    title,
    description: description || null,
    image: image || null,
  });
}

export async function updateProjectTask(taskId, fields) {
  return supabase.from("project_tasks").update(fields).eq("id", taskId);
}
