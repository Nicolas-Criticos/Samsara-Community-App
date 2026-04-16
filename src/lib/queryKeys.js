export const queryKeys = {
  authSession: () => ["auth", "session"],
  projectsList: (realm, userId) => ["projects", "list", realm, userId],
  circleMembers: () => ["circle", "members"],
  memberWelcome: (userId) => ["member", "welcome", userId],
  memberProjectsSummary: (userId) => ["member", "projectsSummary", userId],
  projectBySlug: (realm, slug) => ["project", realm, "slug", slug],
  projectActivity: (projectId) => ["project", projectId, "activity"],
  projectMeta: (realm, projectId, userId) => [
    "project",
    realm,
    projectId,
    "meta",
    userId,
  ],
  /** Projects portal modal: creator line, contributors, applications */
  projectsFieldModalExtras: (realm, projectId, userId) => [
    "projectsField",
    "detailExtras",
    realm,
    projectId,
    userId,
  ],
  /** Bill of Materials items for a project */
  bomItems: (projectId) => ["bomItems", projectId],
};
