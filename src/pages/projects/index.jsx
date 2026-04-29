import { Link } from "react-router-dom";
import { useState } from "react";
import logo1Url from "../../assets/images/logo1.jpg";
import vgLogoUrl from "../../assets/images/vg-logo.png";
import ParticleField from "../../components/portal/ParticleField.jsx";
import { IconButton } from "../../components/ui/index.js";
import ProjectCalendarView from "./components/ProjectCalendarView.jsx";
import ProjectGanttView from "./components/ProjectGanttView.jsx";
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
          ? "fixed inset-0 z-0 [@media(max-width:1024px)_and_(orientation:landscape)]:h-full bg-[radial-gradient(ellipse_at_center,rgba(255,252,242,1)_0%,rgba(245,238,220,1)_35%,rgba(228,218,198,1)_65%,rgba(210,198,175,1)_100%)]"
          : "relative h-screen [@media(max-width:1024px)_and_(orientation:landscape)]:h-full bg-[radial-gradient(circle_at_center,rgba(225,214,193,0.92)_0%,rgba(223,214,199,0.94)_38%,rgba(241,235,222,0.97)_68%,rgba(255,252,245,0.99)_100%)] max-md:pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))]"
      }`}
      style={
        pf.isVrisch
          ? {
              backgroundImage: `radial-gradient(circle at center, rgba(255,252,245,0.15) 0%, rgba(240,235,220,0.55) 40%, rgba(220,210,190,0.82) 100%), url(${vgLogoUrl})`,
              backgroundSize: "auto, 38%",
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
        <>
          <div
            className="pointer-events-none fixed -inset-[20%] z-1 bg-[radial-gradient(circle_at_center,rgba(255,245,220,0.6)_0%,rgba(240,228,200,0.35)_30%,rgba(220,208,185,0.15)_55%,rgba(0,0,0,0)_75%)] animate-vrisch-void"
            aria-hidden
          />
          <div
            className="pointer-events-none fixed inset-0 z-1"
            style={{
              background: "radial-gradient(circle at center, rgba(200,175,110,0.22) 0%, rgba(180,155,90,0.1) 20%, transparent 45%)",
            }}
            aria-hidden
          />
        </>
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
            className={`relative flex h-14 w-14 cursor-pointer items-center justify-center rounded-full border-0 text-[1.9rem] font-light leading-none [&_span_svg]:h-1/2 [&_span_svg]:w-1/2 [&_span_svg]:max-h-[22px] [&_span_svg]:max-w-[22px] ${
              pf.isVrisch
                ? "bg-[radial-gradient(circle_at_32%_28%,rgba(255,255,255,0.55)_0%,rgba(255,255,255,0.18)_18%,rgba(180,165,140,0.25)_45%,rgba(80,70,60,0.65)_75%,rgba(30,25,20,0.88)_100%)] text-[rgba(245,238,224,0.9)] shadow-[0_0_18px_rgba(185,135,52,0.32),0_0_36px_rgba(145,105,32,0.16),0_16px_45px_rgba(0,0,0,0.72),inset_0_-4px_12px_rgba(100,80,40,0.3),inset_0_2px_8px_rgba(255,255,255,0.25)] hover:scale-[1.12]! hover:brightness-[1.12] hover:shadow-[0_0_26px_rgba(210,158,60,0.5),0_0_52px_rgba(165,118,38,0.28),0_20px_52px_rgba(0,0,0,0.78),inset_0_-5px_14px_rgba(120,95,45,0.4),inset_0_3px_10px_rgba(255,255,255,0.35)]!"
                : "bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.9),rgba(230,225,215,0.65))] text-[rgba(60,55,45,0.8)] shadow-none hover:scale-[1.08]!"
            }`}
            onClick={() => pf.setCreateOpen(true)}
          />
        </div>
      ) : null}

      {viewMode === "table" ? (
        <ProjectDashboardTable projects={pf.projects} isVrisch={pf.isVrisch} realm={pf.realm} />
      ) : viewMode === "calendar" ? (
        <ProjectCalendarView projects={pf.projects} isVrisch={pf.isVrisch} />
      ) : viewMode === "gantt" ? (
        <ProjectGanttView projects={pf.projects} isVrisch={pf.isVrisch} realm={pf.realm} />
      ) : (
        <div className="fixed inset-0 z-2" id="projectField">
          {pf.fieldProjects.slice(0, pf.visibleCount).map((project, i) => (
            <ProjectNode
              key={project.id}
              project={project}
              isVrisch={pf.isVrisch}
              x={pf.positions[i]?.x ?? 0}
              y={pf.positions[i]?.y ?? 0}
              onOpen={pf.openProjectDetail}
              currentUserId={pf.currentUserId}
              onComplete={pf.handleCompleteProject}
              onArchive={pf.handleArchiveProject}
              onDelete={pf.handleDeleteProject}
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
        currentUserId={pf.currentUserId}
        onClose={pf.closeProjectDetail}
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
