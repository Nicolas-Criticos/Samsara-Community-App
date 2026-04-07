import { supabase } from "./supabase.js";

export async function fetchMemberWelcomeRow(userId) {
  return supabase
    .from("members")
    .select("username, archetype")
    .eq("user_id", userId)
    .maybeSingle();
}

export async function fetchCircleMembers() {
  return supabase
    .from("members")
    .select(
      "id, user_id, username, name, bio, profile_image_url, website, profile_pdf_url, archetype"
    )
    .not("username", "is", null)
    .order("created_at", { ascending: true });
}

export async function updateMemberBioAndWebsite(userId, { bio, website }) {
  return supabase
    .from("members")
    .update({ bio, website })
    .eq("user_id", userId);
}

export async function updateMemberProfileImageUrl(userId, profileImageUrl) {
  return supabase
    .from("members")
    .update({ profile_image_url: profileImageUrl })
    .eq("user_id", userId);
}

export async function updateMemberProfilePdfUrl(userId, profilePdfUrl) {
  return supabase
    .from("members")
    .update({ profile_pdf_url: profilePdfUrl })
    .eq("user_id", userId);
}

/**
 * Merges created + contributed projects for a member profile.
 * @returns {{ items: Array<{ id: string, title: string, role: string, realm: string }> }}
 */
export async function fetchMemberProjectsSummary(userId) {
  const { data: created, error: createdError } = await supabase
    .from("projects")
    .select("id, title, realm")
    .eq("created_by", userId)
    .eq("archived", false);

  if (createdError) {
    console.error("Created projects error:", createdError);
  }

  const { data: contributed, error: contribError } = await supabase
    .from("project_contributors")
    .select(
      `
      project_id,
      realm,
      projects ( id, title )
    `
    )
    .eq("member_id", userId);

  if (contribError) {
    console.error("Contributed projects error:", contribError);
  }

  const map = new Map();

  (created || []).forEach((p) => {
    map.set(p.id, {
      id: p.id,
      title: p.title,
      realm: p.realm,
      role: "Creator",
    });
  });

  (contributed || []).forEach((row) => {
    if (!row.projects) return;
    if (!map.has(row.projects.id)) {
      map.set(row.projects.id, {
        id: row.projects.id,
        title: row.projects.title,
        realm: row.realm,
        role: "Contributor",
      });
    }
  });

  return { items: Array.from(map.values()) };
}

export async function fetchMemberUsernameByUserId(userId) {
  return supabase
    .from("members")
    .select("username")
    .eq("user_id", userId)
    .single();
}

export async function fetchMemberUsernamesByUserIds(userIds) {
  if (!userIds?.length) return { data: [], error: null };
  return supabase
    .from("members")
    .select("user_id, username")
    .in("user_id", userIds);
}

export async function fetchMemberNamesByUserIds(userIds) {
  if (!userIds?.length) return { data: [], error: null };
  const { data: byUserId, error: byUserIdError } = await supabase
    .from("members")
    .select("id, user_id, name, username")
    .in("user_id", userIds);

  const unresolvedIds = userIds.filter(
    (id) => !(byUserId || []).some((member) => member?.user_id === id)
  );

  if (!unresolvedIds.length) {
    return { data: byUserId || [], error: byUserIdError };
  }

  // Some rows may store project creator as members.id instead of user_id.
  const { data: byMemberId, error: byMemberIdError } = await supabase
    .from("members")
    .select("id, user_id, name, username")
    .in("id", unresolvedIds);

  return {
    data: [...(byUserId || []), ...(byMemberId || [])],
    error: byUserIdError || byMemberIdError || null,
  };
}
