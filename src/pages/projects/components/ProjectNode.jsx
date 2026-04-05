export default function ProjectNode({ project, x, y, onOpen }) {
  return (
    <div
      className={`project-node${project.appCount > 0 ? " has-applications" : ""}`}
      style={{ left: `${x}px`, top: `${y}px` }}
      onClick={() => onOpen(project)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen(project);
        }
      }}
      role="button"
      tabIndex={0}
    >
      <span>{project.title}</span>
      <div className={`project-status status-${project.status}`} />
      {project.chinese_new_year ? (
        <div
          className="project-cny-indicator"
          title="Chinese New Year Project"
        >
          🧧
        </div>
      ) : null}
    </div>
  );
}
