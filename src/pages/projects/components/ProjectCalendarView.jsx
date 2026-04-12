import { useMemo, useState } from "react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const DAY_NAMES_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay(); // 0 = Sunday
}

function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isToday(date) {
  return isSameDay(date, new Date());
}

function truncate(str, max = 18) {
  if (!str) return "";
  return str.length > max ? str.slice(0, max) + "…" : str;
}

// ─── Date key helper ──────────────────────────────────────────────────────────

function dateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

/** Parse a date string or Date into a local midnight Date (no timezone shift). */
function parseLocalDate(val) {
  if (!val) return null;
  if (val instanceof Date) {
    // strip time
    const d = new Date(val.getFullYear(), val.getMonth(), val.getDate());
    return Number.isNaN(d.getTime()) ? null : d;
  }
  // "YYYY-MM-DD" — parse as local to avoid UTC-shift
  const m = String(val).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) {
    return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  }
  const d = new Date(val);
  return Number.isNaN(d.getTime()) ? null : new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

// ─── Status chip colours ──────────────────────────────────────────────────────

function getChipBgClass(project, isVrisch, isContinuation = false) {
  const s = (project.status ?? "").toLowerCase();
  const archived = project.archived;

  if (archived || s === "closed") {
    return isVrisch ? "bg-stone-700/70" : "bg-stone-300";
  }
  if (s === "open") {
    return isVrisch ? "bg-emerald-800/70" : "bg-emerald-300";
  }
  if (s === "application") {
    return isVrisch ? "bg-amber-700/70" : "bg-amber-300";
  }
  return isVrisch ? "bg-white/15" : "bg-stone-200";
}

function getChipTextClass(project, isVrisch) {
  const s = (project.status ?? "").toLowerCase();
  const archived = project.archived;

  if (archived || s === "closed") {
    return isVrisch ? "text-stone-300" : "text-stone-600";
  }
  if (s === "open") {
    return isVrisch ? "text-emerald-200" : "text-emerald-900";
  }
  if (s === "application") {
    return isVrisch ? "text-amber-200" : "text-amber-900";
  }
  return isVrisch ? "text-white/60" : "text-stone-600";
}

// ─── Build calendar grid ──────────────────────────────────────────────────────

function buildCalendarDays(year, month) {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const cells = [];

  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));

  const remainder = cells.length % 7;
  if (remainder !== 0) {
    for (let i = 0; i < 7 - remainder; i++) cells.push(null);
  }

  return cells;
}

// ─── Bucket projects by span (start_date → end_date) ─────────────────────────
//
// Each entry in the map is an array of { project, isFirst } objects.
// isFirst = true only on the first day of the project's span.

function bucketProjectsBySpan(projects) {
  /** @type {Map<string, Array<{project: object, isFirst: boolean}>>} */
  const map = new Map();

  function addToKey(key, project, isFirst) {
    if (!map.has(key)) map.set(key, []);
    map.get(key).push({ project, isFirst });
  }

  for (const p of projects) {
    // Resolve start date: prefer start_date, fall back to created_at
    const startRaw = p.start_date ?? p.created_at;
    const start = parseLocalDate(startRaw);
    if (!start) continue;

    const end = parseLocalDate(p.end_date);

    if (!end || isSameDay(start, end)) {
      // Single day
      addToKey(dateKey(start), p, true);
      continue;
    }

    // Span — iterate day by day
    const cursor = new Date(start);
    let isFirst = true;
    while (cursor <= end) {
      addToKey(dateKey(cursor), p, isFirst);
      isFirst = false;
      cursor.setDate(cursor.getDate() + 1);
    }
  }

  return map;
}

// ─── Day Cell ─────────────────────────────────────────────────────────────────

function DayCell({ date, entriesForDay, isVrisch, onProjectClick }) {
  const today = date && isToday(date);

  const borderClass = isVrisch
    ? "border-white/8"
    : "border-[rgba(120,110,90,0.12)]";

  const todayRing = isVrisch
    ? "ring-2 ring-amber-400/60"
    : "ring-2 ring-amber-500/60";

  if (!date) {
    return (
      <div
        className={`border-b border-r ${borderClass} ${
          isVrisch ? "bg-white/[0.01]" : "bg-black/[0.02]"
        } min-h-[80px] max-md:min-h-[52px]`}
      />
    );
  }

  const visibleEntries = entriesForDay.slice(0, 3);
  const overflow = entriesForDay.length - 3;

  return (
    <div
      className={`relative border-b border-r ${borderClass} min-h-[80px] max-md:min-h-[52px] p-1.5 transition-colors ${
        isVrisch ? "hover:bg-white/[0.03]" : "hover:bg-[rgba(122,112,94,0.04)]"
      } ${today ? todayRing : ""}`}
    >
      {/* Day number */}
      <div
        className={`mb-1 flex h-5 w-5 items-center justify-center rounded-full text-[0.68rem] font-semibold ${
          today
            ? isVrisch
              ? "bg-amber-400 text-black"
              : "bg-amber-600 text-white"
            : isVrisch
              ? "text-[rgba(220,214,203,0.6)]"
              : "text-[rgba(75,71,65,0.5)]"
        }`}
      >
        {date.getDate()}
      </div>

      {/* Project chips / continuation bars */}
      <div className="flex flex-col gap-0.5">
        {visibleEntries.map(({ project, isFirst }) => {
          const bgClass = getChipBgClass(project, isVrisch, !isFirst);
          const textClass = getChipTextClass(project, isVrisch);

          if (!isFirst) {
            // Continuation: thin coloured bar, no text
            return (
              <button
                key={project.id}
                onClick={() => onProjectClick?.(project)}
                title={project.title}
                className={`h-[6px] w-full rounded-sm opacity-80 transition-opacity hover:opacity-100 ${bgClass}`}
                aria-label={`${project.title} (continued)`}
              />
            );
          }

          // First day: full chip with title
          return (
            <button
              key={project.id}
              onClick={() => onProjectClick?.(project)}
              className={`w-full truncate rounded px-1.5 py-0.5 text-left text-[0.6rem] font-medium leading-tight transition-opacity hover:opacity-80 ${bgClass} ${textClass}`}
              title={project.title}
            >
              {truncate(project.title, 18)}
            </button>
          );
        })}

        {overflow > 0 && (
          <span
            className={`px-1 text-[0.58rem] ${
              isVrisch ? "text-white/40" : "text-[rgba(75,71,65,0.4)]"
            }`}
          >
            +{overflow} more
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ProjectCalendarView({ projects, isVrisch, onProjectClick }) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const calendarDays = useMemo(() => buildCalendarDays(year, month), [year, month]);
  const projectBucket = useMemo(() => bucketProjectsBySpan(projects), [projects]);

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  }

  function nextMonth() {
    if (month === 11) { setMonth(0); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  }

  function goToToday() {
    setYear(today.getFullYear());
    setMonth(today.getMonth());
  }

  const headerBg = isVrisch
    ? "bg-[rgba(12,12,12,0.97)] border-white/10"
    : "bg-[rgba(248,244,236,0.99)] border-[rgba(122,112,94,0.2)]";

  const dayNameColor = isVrisch
    ? "text-[rgba(220,214,203,0.5)]"
    : "text-[rgba(75,71,65,0.45)]";

  const btnBase = isVrisch
    ? "text-[rgba(220,214,203,0.7)] hover:bg-white/10 hover:text-[rgba(238,233,224,0.95)]"
    : "text-[rgba(75,71,65,0.6)] hover:bg-[rgba(122,112,94,0.12)] hover:text-[rgba(43,43,43,0.9)]";

  const todayBtnActive =
    year === today.getFullYear() && month === today.getMonth();

  return (
    <div
      className={`absolute inset-x-6 bottom-6 top-22 z-6 flex flex-col overflow-hidden rounded-2xl border shadow-xl max-md:inset-x-4 max-md:bottom-20 max-md:top-24 ${
        isVrisch
          ? "border-white/10 bg-[rgba(8,8,8,0.86)] text-[rgba(238,233,224,0.92)]"
          : "border-[rgba(122,112,94,0.28)] bg-[rgba(255,252,247,0.95)] text-[rgba(43,43,43,0.86)]"
      }`}
    >
      {/* Header: navigation */}
      <div className={`flex items-center justify-between border-b px-4 py-3 ${headerBg}`}>
        <div className="flex items-center gap-2">
          <button
            onClick={prevMonth}
            className={`rounded-lg p-1.5 text-sm transition-colors ${btnBase}`}
            aria-label="Previous month"
          >
            ←
          </button>
          <button
            onClick={nextMonth}
            className={`rounded-lg p-1.5 text-sm transition-colors ${btnBase}`}
            aria-label="Next month"
          >
            →
          </button>
          <h2 className="text-sm font-semibold tracking-wide">
            {MONTH_NAMES[month]} {year}
          </h2>
        </div>

        {!todayBtnActive && (
          <button
            onClick={goToToday}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${btnBase}`}
          >
            Today
          </button>
        )}
      </div>

      {/* Day name headers */}
      <div
        className={`grid grid-cols-7 border-b ${
          isVrisch
            ? "border-white/8 bg-[rgba(18,18,18,0.9)]"
            : "border-[rgba(120,110,90,0.12)] bg-[rgba(245,241,233,0.98)]"
        }`}
      >
        {DAY_NAMES_SHORT.map((name) => (
          <div
            key={name}
            className={`py-2 text-center text-[0.6rem] font-semibold uppercase tracking-widest ${dayNameColor}`}
          >
            <span className="max-md:hidden">{name}</span>
            <span className="md:hidden">{name[0]}</span>
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="min-h-0 flex-1 overflow-auto">
        <div className="grid grid-cols-7">
          {calendarDays.map((date, i) => {
            const entries = date ? (projectBucket.get(dateKey(date)) ?? []) : [];
            return (
              <DayCell
                key={i}
                date={date}
                entriesForDay={entries}
                isVrisch={isVrisch}
                onProjectClick={onProjectClick}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
