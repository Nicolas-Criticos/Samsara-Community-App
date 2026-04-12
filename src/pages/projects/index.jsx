import { Link } from "react-router-dom";
import { useState } from "react";
import logo1Url from "../../assets/images/logo1.jpg";
import vgLogoUrl from "../../assets/images/vg-logo.png";
import ParticleField from "../../components/portal/ParticleField.jsx";
import { IconButton } from "../../components/ui/index.js";
import ProjectCalendarView from "./components/ProjectCalendarView.jsx";
import ProjectCreateModal from "./components/ProjectCreateModal.jsx";
import ProjectDashboardTable from "./components/ProjectDashboardTable.jsx";
import ProjectDetailModal from "./components/ProjectDetailModal.jsx";
import ProjectNode from "./components/ProjectNode.jsx";
import RealmSwitch from "./components/RealmSwitch.jsx";
import { useProjects } from "./hooks/useProjects.js";

export default function ProjectsPage() {
  const pf = useProjects();
  const [viewMode, setViewMode] = useState("field");

  return (
    <div
      className={`flex min-h-screen w-screen max-w-[100vw] items-center justify-center overflow-hidden isolate ${
        pf.isVrisch
          ? "fixed inset-0 z-0 [@media(max-width:1024px)_and_(orientation:landscape)]:h-full"
          : "relative h-screen [@media(max-width:1024px)_and_(orientation:landscape)]:h-full bg-[radial-gradient(circle_at_center,rgba(225,214,193,0.92)_0%,rgba(223,214,199,0.94)_38%,rgba(241,235,222,0.97)_68%,rgba(255,252,245,0.99)_100%)] max-md:pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))]"
      }`}
      style={
        pf.isVrisch
          ? {
              backgroundImage: `radial-gradient(circle at center, rgba(0,0,0,0.45), rgba(0,0,0,0.92)), url(${vgLogoUrl})`,
              backgroundSize: "auto, 40%",
              backgroundPosition: "center, center",
              backgroundRepeat: "no-repeat, no-repeat",
            }
          : undefined
      }
    >
      {!pf.isVrisch ? (
        <div
          className="pointer-events-none absolute -inset-[15%] z-2 bg-[radial-gradient(circle_at_center,rgba(220,210,195,0.35)_0%,rgba(240,232,220,0.28)_34%,rgba(255,255,255,0.18)_55%,rgba(255,255,255,0)_75%)] animate-samsara-breath"
          aria-hidden
        />
      ) : (
        <div
          className="pointer-events-none fixed -inset-[20%] z-1 bg-[radial-gradient(circle_at_center,rgba(110,124,78,0.82)_0%,rgba(148,156,104,0.62)_28%,rgba(186,190,142,0.36)_46%,rgba(0,0,0,0)_72%)] animate-vrisch-void"
          aria-hidden
        />
      )}

      <RealmSwitch
        isVrisch={pf.isVrisch}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onRealmChange={(checked) =>
          pf.navigate(
            checked ? "/projects/vrischgewagt" : "/projects/samsara",
            { replace: true }
          )
        }
      />

      {viewMode === "field" ? (
        <div className="fixed left-1/2 top-[75vh] z-6 -translate-x-1/2 -translate-y-1/2 max-md:top-[72vh] [@media(max-width:1024px)_and_(orientation:landscape)]:top-[80%]">
          <IconButton
            icon="plus"
            aria-label="Seed Project"
            className="relative flex h-14 w-14 cursor-pointer items-center justify-center rounded-full border-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.9),rgba(230,225,215,0.65))] text-[1.9rem] font-light leading-none text-[rgba(60,55,45,0.8)] shadow-none hover:scale-[1.08]! [&_span_svg]:h-1/2 [&_span_svg]:w-1/2 [&_span_svg]:max-h-[22px] [&_span_svg]:max-w-[22px]"
            onClick={() => pf.setCreateOpen(true)}
          />
        </div>
      ) : null}

      {viewMode === "table" ? (
        <ProjectDashboardTable projects={pf.projects} isVrisch={pf.isVrisch} realm={pf.realm} />
      ) : viewMode === "calendar" ? (
        <ProjectCalendarView projects={pf.projects} isVrisch={pf.isVrisch} />
      ) : (
        <div className="fixed inset-0 z-2" id="projectField">
          {pf.projects.slice(0, pf.visibleCount).map((project, i) => (
            <ProjectNode
              key={project.id}
              project={project}
              isVrisch={pf.isVrisch}
              x={pf.positions[i]?.x ?? 0}
              y={pf.positions[i]?.y ?? 0}
              onOpen={pf.openProjectDetail}
            />
          ))}
        </div>
      )}

      {!pf.isVrisch ? (
        <div
          className="pointer-events-none fixed inset-0 z-0 bg-center bg-no-repeat opacity-0 filter-[blur(0.3px)]"
          style={{
            backgroundImage: `url(${logo1Url})`,
            backgroundSize: "min(70vh, 70vw)",
            animation:
              "sigilFadeIn 6s ease forwards 2s, sigilBreath 14s ease-in-out infinite",
          }}
        />
      ) : null}
      <ParticleField particles={pf.particles} />

      <Link
        to="/circle"
        className={`fixed left-7 top-6 z-8 text-[0.65rem] uppercase tracking-[0.18em] no-underline opacity-70 transition-opacity hover:opacity-100 max-md:bottom-[calc(16px+env(safe-area-inset-bottom,0px))] max-md:left-1/2 max-md:right-auto max-md:top-auto max-md:-translate-x-1/2 max-md:text-center max-md:text-[0.6rem] max-md:tracking-[0.16em] ${
          pf.isVrisch
            ? "text-[rgba(235,230,220,0.75)] hover:text-[rgba(255,250,240,0.95)]"
            : "text-[rgba(43,43,43,0.55)]"
        }`}
      >
        {pf.isVrisch ? "← RETURN TO CIRCLE" : "← RETURN"}
      </Link>

      <ProjectDetailModal
        project={pf.detailProject}
        realm={pf.realm}
        isDetailCreator={pf.isDetailCreator}
        isVrisch={pf.isVrisch}
        detailCreator={pf.detailCreator}
        detailContributors={pf.detailContributors}
        detailRoles={pf.detailRoles}
        primaryConfig={pf.primaryConfig}
        inspirationLink={pf.inspirationLink}
        applicationBanner={pf.applicationBanner}
        showEndProject={pf.showEndProject}
        currentUserId={pf.currentUserId}
        onClose={pf.closeProjectDetail}
        onStatusChange={pf.onStatusChange}
        onEndProject={pf.endProject}
        onHandleApplications={pf.handleApplications}
      />

      <ProjectCreateModal
        isVrisch={pf.isVrisch}
        open={pf.createOpen}
        createProjectMutation={pf.createProjectMutation}
        onCancel={() => pf.setCreateOpen(false)}
      />
    </div>
  );
}
