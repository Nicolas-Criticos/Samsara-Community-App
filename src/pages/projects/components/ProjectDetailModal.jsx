import { useRef } from "react";
import { IconButton } from "../../../components/ui/index.js";
import { useInspirationButtonLayout } from "../hooks/useInspirationButtonLayout.js";

export default function ProjectDetailModal({
  project,
  isDetailCreator,
  detailCreator,
  detailContributors,
  detailRoles,
  primaryConfig,
  inspirationLink,
  applicationBanner,
  showEndProject,
  currentUserId,
  onClose,
  onStatusChange,
  onEndProject,
  onHandleApplications,
}) {
  const innerRef = useRef(null);
  const inspirationBtnStyle = useInspirationButtonLayout(
    inspirationLink,
    project,
    innerRef
  );

  if (!project) return null;

  return (
    <div className="project-detail" id="projectDetail" style={{ display: "flex" }}>
      <div className="project-detail-inner" ref={innerRef}>
        <IconButton
          icon="close"
          className="project-close-btn"
          onClick={onClose}
          aria-label="Close project"
        />
        <div />

        <div className="project-header">
          {project.image_url ? (
            <img
              id="detailProjectImage"
              className="project-detail-image"
              alt=""
              src={project.image_url}
            />
          ) : null}
          <h2 className="project-title">{project.title}</h2>
        </div>

        <div className="project-core">
          <p className="project-description">{project.description}</p>
        </div>

        {inspirationLink ? (
          <IconButton
            className="project-link-btn"
            title="View visual inspiration"
            style={inspirationBtnStyle}
            onClick={() =>
              window.open(inspirationLink, "_blank", "noopener,noreferrer")
            }
          >
            <span>🖼️</span>
          </IconButton>
        ) : null}

        {isDetailCreator ? (
          <div className="project-status-toggle" id="projectStatusControl">
            <select
              value={project.status}
              onChange={(e) => onStatusChange(e.target.value, project)}
            >
              <option value="open">🟢 Open</option>
              <option value="application">🟠 Application</option>
              <option value="closed">🔴 Closed</option>
            </select>
          </div>
        ) : (
          <div id="projectStatusControl" />
        )}

        <div className="project-meta">
          <div className="project-meta-line">{detailCreator}</div>
          <div className="project-meta-line">{detailContributors}</div>
          <div className="project-meta-line">{detailRoles}</div>
        </div>

        {applicationBanner ? (
          <div
            className="application-bubble"
            onClick={() =>
              onHandleApplications(
                applicationBanner.apps,
                applicationBanner.nameMap,
                applicationBanner.projectId
              )
            }
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onHandleApplications(
                  applicationBanner.apps,
                  applicationBanner.nameMap,
                  applicationBanner.projectId
                );
              }
            }}
            role="button"
            tabIndex={0}
          >
            🟠 {applicationBanner.apps.length} application(s) pending
          </div>
        ) : null}

        {showEndProject && project.created_by === currentUserId ? (
          <button
            type="button"
            className="project-end-btn project-action-btn subtle"
            onClick={() => onEndProject(project)}
          >
            End Project
          </button>
        ) : null}

        <div className="project-action-ring">
          {!primaryConfig.hidden ? (
            <button
              type="button"
              id="detailProjectAction"
              className={primaryConfig.className}
              disabled={primaryConfig.disabled}
              onClick={() => primaryConfig.onClick?.()}
            >
              {primaryConfig.text}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
