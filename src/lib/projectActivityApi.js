import { supabase } from "./supabase.js";

export async function fetchProjectTasks(projectId) {
  return supabase
    .from("project_tasks")
    .select(
      "id, name, description, status, start_date, end_date, created_at"
    )
    .eq("project", projectId)
    .order("created_at", { ascending: true });
}

export async function fetchProjectUpdates(projectId) {
  return supabase
    .from("project_updates")
    .select("id, title, description, created_at")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });
}

export async function insertProjectTask({
  projectId,
  name,
  description,
  status = "Pending",
  start_date = null,
  end_date = null,
}) {
  return supabase.from("project_tasks").insert({
    project: projectId,
    name,
    description: description || null,
    status,
    start_date: start_date || null,
    end_date: end_date || null,
  });
}

export async function insertProjectUpdate({
  projectId,
  title,
  description,
}) {
  return supabase.from("project_updates").insert({
    project_id: projectId,
    title,
    description: description || null,
  });
}

export async function updateProjectTask(taskId, fields) {
  // Strip out any fields that don't exist on the table
  const { image, realm, project_id, ...safeFields } = fields;
  return supabase.from("project_tasks").update(safeFields).eq("id", taskId);
}
