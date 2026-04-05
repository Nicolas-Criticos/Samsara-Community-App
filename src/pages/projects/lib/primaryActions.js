const PRIMARY_BASE = "project-action-btn";

export function buildPrimaryActionConfig(project, currentUserId, actions) {
  const { joinProject, applyToProject } = actions;

  if (project.created_by === currentUserId) {
    return {
      text: "",
      className: PRIMARY_BASE,
      disabled: false,
      hidden: true,
      onClick: null,
    };
  }

  if (project.status === "closed") {
    return {
      text: "Project Closed",
      className: `${PRIMARY_BASE} project-action-closed`,
      disabled: true,
      hidden: false,
      onClick: null,
    };
  }

  if (project.status === "open") {
    return {
      text: "Join Project",
      className: `${PRIMARY_BASE} project-action-open`,
      disabled: false,
      hidden: false,
      onClick: () => joinProject(project),
    };
  }

  if (project.status === "application") {
    return {
      text: "Apply to Join",
      className: `${PRIMARY_BASE} project-action-application`,
      disabled: false,
      hidden: false,
      onClick: () => applyToProject(project.id),
    };
  }

  return {
    text: "",
    className: PRIMARY_BASE,
    disabled: false,
    hidden: false,
    onClick: null,
  };
}

export function emptyPrimaryConfig() {
  return {
    text: "",
    className: "project-action-btn",
    disabled: false,
    hidden: false,
    onClick: null,
  };
}
