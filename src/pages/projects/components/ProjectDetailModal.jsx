import { useRef } from "react";
import { Link } from "react-router-dom";
import { IconButton } from "../../../components/ui/index.js";
import { projectDetailHref } from "../../../lib/slug.js";
import { useInspirationButtonLayout } from "../hooks/useInspirationButtonLayout.js";

export default function ProjectDetailModal({
  project,
  realm,
  isDetailCreator,
  isVrisch,
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

  const viewMoreTo = projectDetailHref(realm, project.title);

  return (
    <div
      className={`fixed inset-0 z-20 flex items-center justify-center ${
        isVrisch ? "bg-black/55" : "bg-[rgba(246,243,238,0.9)]"
      }`}
      id="projectDetail"
    >
      <div
        ref={innerRef}
        className={`relative grid h-[min(90vw,600px)] w-[min(90vw,600px)] grid-rows-[auto_1fr_auto_auto_auto] items-center gap-3 overflow-hidden rounded-full px-12 py-12 text-center max-md:h-[min(92vh,520px)] max-md:pb-8 ${
          isVrisch
            ? "bg-[radial-gradient(circle_at_center,rgba(32,32,32,0.96),rgba(18,18,18,0.92))] text-[rgba(235,230,220,0.92)] shadow-[0_0_45px_rgba(0,0,0,0.9),inset_0_0_28px_rgba(255,255,255,0.035)]"
            : "bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.98),rgba(235,230,220,0.9))]"
        }`}
      >
        <IconButton
          icon="close"
          className={`absolute left-1/2 top-3.5 z-5 flex h-8 w-8 -translate-x-1/2 cursor-pointer items-center justify-center rounded-full border-0 text-[1.25rem] font-light leading-none shadow-none transition-all duration-250 ease-in-out [&_span_svg]:max-h-4 [&_span_svg]:max-w-4 ${
            isVrisch
              ? "bg-white/10 text-[rgba(235,230,220,0.7)] hover:bg-white/20 hover:scale-[1.12]!"
              : "bg-white/35 text-[rgba(60,50,40,0.65)] hover:scale-[1.12]! hover:bg-white/65"
          }`}
          onClick={onClose}
          aria-label="Close project"
        />
        <div />

        <div className="flex flex-col items-center gap-2.5">
          {project.image_url ? (
            <img
              id="detailProjectImage"
              className={`max-h-40 w-full rounded-[14px] object-cover ${
                isVrisch ? "brightness-[0.88] contrast-[0.95]" : ""
              }`}
              alt=""
              src={project.image_url}
            />
          ) : null}
          <h2
            className={
              isVrisch ? "text-[rgba(245,240,230,0.95)]" : "text-inherit"
            }
          >
            {project.title}
          </h2>
        </div>

        <div className="mx-auto max-w-[85%]">
          <p
            className={`text-[0.85rem] leading-relaxed ${
              isVrisch ? "text-[rgba(220,215,205,0.85)]" : ""
            }`}
          >
            {project.description}
          </p>
        </div>

        {inspirationLink ? (
          <IconButton
            className="absolute z-6 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-[rgba(140,120,80,0.45)] bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.95),rgba(230,225,215,0.8))] opacity-85 shadow-none transition-all duration-250 ease-in-out hover:opacity-100 max-md:right-[-18px] max-md:h-10 max-md:w-10"
            title="View visual inspiration"
            style={inspirationBtnStyle}
            onClick={() =>
              window.open(inspirationLink, "_blank", "noopener,noreferrer")
            }
          >
            <span className="text-xl leading-none">🖼️</span>
          </IconButton>
        ) : null}

        {isDetailCreator ? (
          <div className="my-1" id="projectStatusControl">
            <select
              className="cursor-pointer appearance-none rounded-full border-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.95),rgba(230,225,215,0.85))] px-5 py-2 text-[0.7rem] uppercase tracking-[0.18em] text-[rgba(60,50,40,0.75)] transition-[filter] duration-200 hover:brightness-[1.05]"
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

        <div
          className={`text-[0.8rem] ${
            isVrisch ? "text-[rgba(210,205,195,0.75)]" : "text-[rgba(43,43,43,0.65)]"
          }`}
        >
          <div>{detailCreator}</div>
          <div>{detailContributors}</div>
          <div>{detailRoles}</div>
        </div>

        {applicationBanner ? (
          <div
            className="cursor-pointer rounded-full bg-amber-100/90 px-4 py-2 text-center text-[0.7rem] uppercase tracking-wider text-amber-950 shadow-sm transition-transform hover:scale-[1.02]"
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
            className="cursor-pointer rounded-full border border-[rgba(120,90,60,0.35)] bg-transparent px-5 py-2 text-[0.62rem] uppercase tracking-[0.18em] text-[rgba(120,90,60,0.85)] shadow-none transition-all duration-250 ease-in-out hover:scale-105 max-md:mt-2.5 max-md:inline-flex max-md:w-full max-md:max-w-[280px] max-md:justify-center"
            onClick={() => onEndProject(project)}
          >
            End Project
          </button>
        ) : null}

        {viewMoreTo ? (
          <Link
            to={viewMoreTo}
            onClick={onClose}
            className={`text-[0.68rem] uppercase tracking-[0.2em] underline underline-offset-4 transition-opacity hover:opacity-100 ${
              isVrisch
                ? "text-[rgba(210,205,195,0.75)]"
                : "text-[rgba(80,70,55,0.65)]"
            }`}
          >
            View more…
          </Link>
        ) : null}

        <div className="mt-6 flex shrink-0 flex-col items-center gap-2.5 max-md:sticky max-md:bottom-0 max-md:bg-linear-to-t max-md:from-white/95 max-md:via-white/60 max-md:to-transparent max-md:pt-3">
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
