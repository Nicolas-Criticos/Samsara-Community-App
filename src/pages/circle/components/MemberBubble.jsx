import { memberDisplayName } from "../../../lib/memberDisplay.js";

export default function MemberBubble({ member, x, y, onSelect }) {
  return (
    <div
      className="group absolute z-11 flex h-[110px] w-[110px] cursor-pointer flex-col items-center justify-center rounded-full border-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.95),rgba(255,255,255,0.6)_60%,rgba(230,225,215,0.45)_100%)] text-center text-[0.85rem] uppercase tracking-[0.08em] text-[rgba(43,43,43,0.75)] opacity-0 shadow-[0_12px_30px_rgba(0,0,0,0.08),inset_0_0_18px_rgba(255,255,255,0.6)] backdrop-blur-[6px] animate-[bubbleFadeIn_4s_ease_forwards] max-md:h-[90px] max-md:w-[90px] max-md:text-[0.7rem] max-md:portrait:h-[86px] max-md:portrait:w-[86px] max-md:portrait:text-[0.7rem]"
      style={{ left: `${x}px`, top: `${y}px` }}
      onClick={() => onSelect(member)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(member);
        }
      }}
      role="button"
      tabIndex={0}
    >
      <div className="relative flex h-full w-full flex-col items-center justify-center rounded-full transition-transform duration-600 ease-in-out animate-[bubbleDrift_var(--drift-time,26s)_ease-in-out_infinite,bubbleBreath_8s_ease-in-out_infinite] group-hover:scale-110">
        <span className="pointer-events-none absolute transition-opacity duration-500 ease-in-out group-hover:opacity-0">
          {memberDisplayName(member)}
        </span>
        <span className="pointer-events-none absolute text-[0.75rem] tracking-[0.14em] text-[rgba(43,43,43,0.6)] opacity-0 transition-opacity duration-500 ease-in-out group-hover:opacity-100">
          {member.username}
        </span>
      </div>
      {member.profile_pdf_url ? (
        <a
          className="absolute -right-4 top-1/2 z-1 -translate-y-1/2 rounded-full bg-white/75 px-2 py-1 text-[0.55rem] uppercase tracking-[0.18em] text-[rgba(40,40,40,0.75)] no-underline opacity-45 shadow-md transition-all duration-250 ease-in-out hover:scale-105 hover:bg-white/95 hover:shadow-[0_4px_12px_rgba(0,0,0,0.22)] group-hover:opacity-85"
          href={member.profile_pdf_url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
        >
          PDF
        </a>
      ) : null}
    </div>
  );
}
