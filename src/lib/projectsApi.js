import { supabase } from "./supabase.js";
import { fetchMemberUsernamesByUserIds } from "./membersApi.js";

export async function fetchProjectsInRealm(realm) {
  return supabase
    .from("projects")
    .select(
      `
      id,
      title,
      description,
      image_url,
      status,
      roles_needed,
      created_by,
      chinese_new_year,
      inspiration_link
    `
    )
    .eq("realm", realm)
    .eq("archived", false)
    .order("created_at", { ascending: true });
}

export async function countPendingApplications(projectId, realm) {
  const { count, error } = await supabase
    .from("project_applications")
    .select("*", { count: "exact", head: true })
    .eq("project_id", projectId)
    .eq("realm", realm)
    .eq("status", "pending");
  return { count: count || 0, error };
}

/** Loads projects and attaches pending application counts for projects the user created. */
export async function fetchEnrichedProjects(realm, currentUserId) {
  const { data, error } = await fetchProjectsInRealm(realm);
  if (error) {
    console.error("Project load error:", error);
    return null;
  }

  const list = data || [];
  return Promise.all(
    list.map(async (p) => {
      let appCount = 0;
      if (p.created_by === currentUserId) {
        const { count } = await countPendingApplications(p.id, realm);
        appCount = count;
      }
      return { ...p, appCount };
    })
  );
}

export async function fetchContributorUserIds(projectId, realm) {
  return supabase
    .from("project_contributors")
    .select("member_id")
    .eq("project_id", projectId)
    .eq("realm", realm);
}

export async function formatContributorsLine(projectId, realm) {
  const { data: contributors, error } = await fetchContributorUserIds(
    projectId,
    realm
  );

  if (error || !contributors?.length) {
    return "Contributors: None";
  }

  const userIds = contributors.map((c) => c.member_id);
  const { data: members } = await fetchMemberUsernamesByUserIds(userIds);

  return members?.length
    ? `Contributors: ${members.map((m) => m.username).join(", ")}`
    : "Contributors: None";
}

export async function findExistingContributor(
  projectId,
  memberId,
  realm
) {
  return supabase
    .from("project_contributors")
    .select("id")
    .eq("project_id", projectId)
    .eq("member_id", memberId)
    .eq("realm", realm)
    .maybeSingle();
}

export async function addProjectContributor({
  projectId,
  memberId,
  realm,
}) {
  return supabase.from("project_contributors").insert({
    project_id: projectId,
    member_id: memberId,
    realm,
  });
}

export async function insertProjectApplication({
  projectId,
  applicantId,
  message,
  realm,
}) {
  return supabase.from("project_applications").insert({
    project_id: projectId,
    applicant_id: applicantId,
    message,
    status: "pending",
    realm,
  });
}

export async function fetchPendingApplications(projectId, realm) {
  return supabase
    .from("project_applications")
    .select("id, message, applicant_id")
    .eq("project_id", projectId)
    .eq("realm", realm)
    .eq("status", "pending");
}

export async function fetchApplicantNameMap(applicantIds) {
  const { data: members } = await fetchMemberUsernamesByUserIds(applicantIds);
  return Object.fromEntries((members || []).map((m) => [m.user_id, m.username]));
}

export async function setApplicationStatus(applicationId, realm, status) {
  return supabase
    .from("project_applications")
    .update({ status })
    .eq("id", applicationId)
    .eq("realm", realm);
}

export async function updateProjectStatus(projectId, realm, createdBy, status) {
  return supabase
    .from("projects")
    .update({ status })
    .eq("id", projectId)
    .eq("created_by", createdBy)
    .eq("realm", realm);
}

export async function archiveProject(projectId, realm, createdBy) {
  return supabase
    .from("projects")
    .update({ archived: true, status: "closed" })
    .eq("id", projectId)
    .eq("created_by", createdBy)
    .eq("realm", realm);
}

export async function insertProjectRow(row) {
  return supabase.from("projects").insert([row]).select().single();
}
