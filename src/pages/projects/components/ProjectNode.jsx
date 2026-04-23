import { useNavigate, useParams } from "react-router-dom";
import { slugifyProjectTitle } from "../../../lib/slug.js";

export default function ProjectNode({
  project,
  x,
  y,
  isVrisch,
  onOpen,
  currentUserId,
  onComplete,
  onArchive,
  onDelete,
}) {
  const navigate = useNavigate();
  const { realm } = useParams();
  const isCreator = Boolean(currentUserId && project.created_by === currentUserId);

  return (
    <div
      className={`absolute flex h-[100px] w-[100px] cursor-pointer flex-col items-center justify-center rounded-full text-center text-[0.8rem] uppercase tracking-[0.12em] opacity-0 transition-all duration-450 ease-in-out animate-[nodeFadeIn_3s_ease_forwards,nodeBreath_7s_ease-in-out_infinite] hover:z-4 hover:scale-[1.12] hover:brightness-[1.04] max-md:h-20 max-md:w-20 max-md:text-[0.6rem] max-md:tracking-widest [@media(max-width:1024px)_and_(orientation:landscape)]:h-[90px] [@media(max-width:1024px)_and_(orientation:landscape)]:w-[90px] [@media(max-width:1024px)_and_(orientation:landscape)]:text-[0.65rem] group ${
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

      {project.chinese_new_year ? (
        <div
          className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[1.1rem] filter-[drop-shadow(0_0_6px_rgba(200,0,0,0.6))]"
          title="Chinese New Year Project"
        >
          🧧
        </div>
      ) : null}

      {/* Creator action buttons — appear BELOW the bubble on hover, not on top of it */}
      {isCreator ? (
        <div
          className="pointer-events-none absolute -bottom-7 left-1/2 -translate-x-1/2 opacity-0 transition-opacity duration-200 group-hover:pointer-events-auto group-hover:opacity-100"
        >
          <div className="flex items-center gap-1.5">
            {/* Complete */}
            <button
              type="button"
              title="Complete project"
              onClick={(e) => {
                e.stopPropagation();
                const slug = slugifyProjectTitle(project.title);
                navigate(`/projects/${realm}/${slug}?complete=true`);
              }}
              className={`flex h-5 w-5 items-center justify-center rounded-full text-[0.55rem] transition-all hover:scale-125 ${
                isVrisch
                  ? "bg-emerald-500/40 text-emerald-200 hover:bg-emerald-500/60"
                  : "bg-emerald-200 text-emerald-800 hover:bg-emerald-300"
              }`}
            >
              ✓
            </button>
            {/* Archive */}
            <button
              type="button"
              title="Archive project"
              onClick={(e) => {
                e.stopPropagation();
                if (confirm("Archive this project?")) {
                  onArchive?.(project);
                }
              }}
              className={`flex h-5 w-5 items-center justify-center rounded-full text-[0.5rem] transition-all hover:scale-125 ${
                isVrisch
                  ? "bg-white/20 text-[rgba(230,225,215,0.8)] hover:bg-white/30"
                  : "bg-stone-200 text-stone-700 hover:bg-stone-300"
              }`}
            >
              📦
            </button>
            {/* Delete */}
            <button
              type="button"
              title="Delete project"
              onClick={(e) => {
                e.stopPropagation();
                if (confirm(`Permanently delete "${project.title}"? This cannot be undone.`)) {
                  onDelete?.(project);
                }
              }}
              className={`flex h-5 w-5 items-center justify-center rounded-full text-[0.5rem] transition-all hover:scale-125 ${
                isVrisch
                  ? "bg-red-500/30 text-red-200 hover:bg-red-500/50"
                  : "bg-red-100 text-red-700 hover:bg-red-200"
              }`}
            >
              🗑
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
