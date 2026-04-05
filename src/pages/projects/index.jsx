import { Link } from "react-router-dom";
import ParticleField from "../../components/portal/ParticleField.jsx";
import { IconButton } from "../../components/ui/index.js";
import "../../styles/circle.css";
import "../../styles/projects.css";
import "../../styles/vrischgewagt.css";
import ProjectCreateModal from "./components/ProjectCreateModal.jsx";
import ProjectDetailModal from "./components/ProjectDetailModal.jsx";
import ProjectNode from "./components/ProjectNode.jsx";
import RealmSwitch from "./components/RealmSwitch.jsx";
import { useProjects } from "./hooks/useProjects.js";

export default function ProjectsPage() {
  const pf = useProjects();

  return (
    <div className="portal-bg">
      <RealmSwitch
        isVrisch={pf.isVrisch}
        onRealmChange={(checked) =>
          pf.navigate(
            checked ? "/projects/vrischgewagt" : "/projects/samsara",
            { replace: true }
          )
        }
      />

      <div className="project-add">
        <IconButton
          icon="plus"
          aria-label="Seed Project"
          onClick={() => pf.setCreateOpen(true)}
        />
      </div>

      <div className="project-field" id="projectField">
        {pf.projects.slice(0, pf.visibleCount).map((project, i) => (
          <ProjectNode
            key={project.id}
            project={project}
            x={pf.positions[i]?.x ?? 0}
            y={pf.positions[i]?.y ?? 0}
            onOpen={pf.openProjectDetail}
          />
        ))}
      </div>

      <div className="background-sigil" />
      <ParticleField particles={pf.particles} />

      <div className="field-header field-header-project">
        <Link to="/circle" className="ghost">
          {pf.isVrisch ? "← RETURN TO CIRCLE" : "← RETURN"}
        </Link>
      </div>

      <ProjectDetailModal
        project={pf.detailProject}
        isDetailCreator={pf.isDetailCreator}
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
        title={pf.createTitle}
        setTitle={pf.setCreateTitle}
        description={pf.createDescription}
        setDescription={pf.setCreateDescription}
        timeline={pf.createTimeline}
        setTimeline={pf.setCreateTimeline}
        status={pf.createStatus}
        setStatus={pf.setCreateStatus}
        cny={pf.createCny}
        setCny={pf.setCreateCny}
        inspiration={pf.createInspiration}
        setInspiration={pf.setCreateInspiration}
        imageFileRef={pf.createImageFileRef}
        onSubmit={pf.submitProject}
        onCancel={() => pf.setCreateOpen(false)}
      />
    </div>
  );
}
