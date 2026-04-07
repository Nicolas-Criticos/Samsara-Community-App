const BTN =
  "cursor-pointer rounded-full border-0 px-5 py-2 text-[0.62rem] uppercase tracking-[0.18em] text-white shadow-none transition-all duration-[250ms] ease-in-out hover:scale-105 disabled:cursor-not-allowed max-md:mt-2.5 max-md:inline-flex max-md:w-full max-md:max-w-[280px] max-md:justify-center";

const HOVER_GLOW =
  "hover:shadow-[0_0_14px_rgba(140,120,80,0.45)]";

const LEAVE_BASE =
  "cursor-pointer rounded-full border-2 px-5 py-2 text-[0.62rem] uppercase tracking-[0.18em] shadow-none transition-all duration-250 ease-in-out hover:scale-105 max-md:mt-2.5 max-md:inline-flex max-md:w-full max-md:max-w-[280px] max-md:justify-center";

const LEAVE_SAMSARA = `${LEAVE_BASE} border-[rgba(120,90,60,0.5)] bg-transparent text-[rgba(95,75,55,0.95)] hover:border-[rgba(120,90,60,0.75)] hover:bg-[rgba(120,90,60,0.06)]`;

const LEAVE_VRISCH = `${LEAVE_BASE} border-[rgba(220,200,170,0.4)] bg-transparent text-[rgba(230,220,200,0.9)] hover:border-[rgba(235,225,205,0.55)] hover:bg-white/6`;

function samsara(open, application, closed) {
  return { open, application, closed };
}

function vrisch(open, application, closed) {
  return { open, application, closed };
}

const PALETTE = {
  samsara: samsara(
    `${BTN} ${HOVER_GLOW} bg-[radial-gradient(circle,#8a7f6d,#6f6456)]`,
    `${BTN} ${HOVER_GLOW} bg-[radial-gradient(circle,#b8956a,#7a5a32)]`,
    `${BTN} opacity-45 bg-[radial-gradient(circle,#8a7a7a,#5a4a4a)]`
  ),
  vrisch: vrisch(
    `${BTN} ${HOVER_GLOW} bg-[radial-gradient(circle,#7f8f6a,#4e5c3f)]`,
    `${BTN} ${HOVER_GLOW} bg-[radial-gradient(circle,#8a6a3f,#4a3520)]`,
    `${BTN} opacity-45 bg-[radial-gradient(circle,#5a3a3a,#2a1414)]`
  ),
};

export function buildPrimaryActionConfig(
  project,
  currentUserId,
  actions,
  isVrisch,
  options = {}
) {
  const { memberActionsInMenu = false } = options;
  const {
    joinProject,
    applyToProject,
    leaveProject,
    isContributor = false,
  } = actions;
  const P = isVrisch ? PALETTE.vrisch : PALETTE.samsara;
  const leaveClass = isVrisch ? LEAVE_VRISCH : LEAVE_SAMSARA;

  if (project.created_by === currentUserId) {
    return {
      text: "",
      className: P.open,
      disabled: false,
      hidden: true,
      onClick: null,
    };
  }

  if (project.status === "closed") {
    return {
      text: "Project Closed",
      className: P.closed,
      disabled: true,
      hidden: false,
      onClick: null,
    };
  }

  if (isContributor && leaveProject) {
    return {
      text: "Leave Project",
      className: leaveClass,
      disabled: false,
      hidden: memberActionsInMenu,
      onClick: () => leaveProject(project),
    };
  }

  if (project.status === "open") {
    return {
      text: "Join Project",
      className: P.open,
      disabled: false,
      hidden: memberActionsInMenu,
      onClick: () => joinProject(project),
    };
  }

  if (project.status === "application") {
    return {
      text: "Apply to Join",
      className: P.application,
      disabled: false,
      hidden: memberActionsInMenu,
      onClick: () => applyToProject(project.id),
    };
  }

  return {
    text: "",
    className: P.open,
    disabled: false,
    hidden: false,
    onClick: null,
  };
}

export function emptyPrimaryConfig(isVrisch = false) {
  const P = isVrisch ? PALETTE.vrisch : PALETTE.samsara;
  return {
    text: "",
    className: P.open,
    disabled: false,
    hidden: false,
    onClick: null,
  };
}
