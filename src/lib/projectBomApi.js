import { supabase } from "./supabase.js";

export async function fetchBomItems(projectId) {
  return supabase
    .from("project_bom_items")
    .select("id, name, quantity, unit_cost, created_at")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });
}

export async function insertBomItem({ projectId, name, quantity, unit_cost }) {
  return supabase.from("project_bom_items").insert({
    project_id: projectId,
    name,
    quantity: quantity ?? 1,
    unit_cost: unit_cost ?? 0,
  });
}

export async function updateBomItem(itemId, { name, quantity, unit_cost }) {
  return supabase
    .from("project_bom_items")
    .update({ name, quantity, unit_cost })
    .eq("id", itemId);
}

export async function deleteBomItem(itemId) {
  return supabase.from("project_bom_items").delete().eq("id", itemId);
}
