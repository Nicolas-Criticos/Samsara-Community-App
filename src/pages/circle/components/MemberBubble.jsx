import { memberDisplayName } from "../../../lib/memberDisplay.js";

export default function MemberBubble({ member, x, y, onSelect }) {
  return (
    <div
      className="rite-bubble"
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
      <div className="bubble-inner">
        <span className="bubble-name">{memberDisplayName(member)}</span>
        <span className="bubble-archetype">{member.username}</span>
      </div>
      {member.profile_pdf_url ? (
        <a
          className="bubble-pdf-link"
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
