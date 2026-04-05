export default function ProjectNode({ project, x, y, isVrisch, onOpen }) {
  return (
    <div
      className={`absolute flex h-[100px] w-[100px] cursor-pointer flex-col items-center justify-center rounded-full text-center text-[0.8rem] uppercase tracking-[0.12em] opacity-0 transition-all duration-450 ease-in-out animate-[nodeFadeIn_3s_ease_forwards,nodeBreath_7s_ease-in-out_infinite] hover:z-4 hover:scale-[1.12] hover:brightness-[1.04] max-md:h-20 max-md:w-20 max-md:text-[0.6rem] max-md:tracking-widest [@media(max-width:1024px)_and_(orientation:landscape)]:h-[90px] [@media(max-width:1024px)_and_(orientation:landscape)]:w-[90px] [@media(max-width:1024px)_and_(orientation:landscape)]:text-[0.65rem] ${
        isVrisch
          ? "text-[rgba(230,225,215,0.85)] animate-[nodeFadeIn_3s_ease_forwards,nodeBreath_9s_ease-in-out_infinite] bg-[radial-gradient(circle_at_30%_30%,rgba(60,60,60,0.95),rgba(30,30,30,0.85))] shadow-[0_12px_30px_rgba(0,0,0,0.65),inset_0_0_18px_rgba(255,255,255,0.05)] hover:shadow-[0_18px_45px_rgba(0,0,0,0.4),inset_0_0_22px_rgba(255,255,255,0.08)]"
          : "text-[rgba(43,43,43,0.75)] bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.9),rgba(230,225,215,0.6)_65%,rgba(210,205,195,0.45)_100%)] shadow-[0_10px_30px_rgba(0,0,0,0.08),inset_0_0_18px_rgba(255,255,255,0.6)] hover:shadow-[0_18px_45px_rgba(0,0,0,0.14),inset_0_0_22px_rgba(255,255,255,0.75)]"
      }`}
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
      {project.appCount > 0 ? (
        <span className="absolute right-3 top-2.5 flex h-[26px] w-[26px] items-center justify-center rounded-full bg-[radial-gradient(circle_at_30%_30%,#d9a441,#a35c1e)] text-[0.7rem] font-semibold text-white shadow-[0_0_12px_rgba(255,165,60,0.65),0_0_24px_rgba(255,165,60,0.35)] animate-[applicationOrbPulse_3.5s_ease-in-out_infinite] max-md:right-1.5 max-md:top-1.5 max-md:h-5 max-md:w-5 max-md:text-[0.6rem]">
          {project.appCount}
        </span>
      ) : null}
      <div
        className={`absolute right-3 top-2.5 h-2.5 w-2.5 rounded-full max-md:right-1.5 max-md:top-1.5 ${
          project.status === "application"
            ? "bg-[#ff9800]"
            : project.status === "closed"
              ? "bg-[#f44336]"
              : "bg-[#4caf50]"
        } ${project.appCount > 0 ? "opacity-0" : ""}`}
      />
      {project.chinese_new_year ? (
        <div
          className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[1.1rem] filter-[drop-shadow(0_0_6px_rgba(200,0,0,0.6))]"
          title="Chinese New Year Project"
        >
          🧧
        </div>
      ) : null}
    </div>
  );
}
