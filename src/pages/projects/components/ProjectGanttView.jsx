import { useMemo, useState } from "react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

function parseLocalDate(val) {
  if (!val) return null;
  const m = String(val).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return null;
}

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function toDateKey(year, month, day) {
  return `${year}-${String(month + 1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
}

function today() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

// ─── Status colours ───────────────────────────────────────────────────────────

function barBg(project, isVrisch) {
  const s = (project.status ?? "").toLowerCase();
  if (project.archived || s === "closed") return isVrisch ? "bg-stone-600/50" : "bg-stone-300/70";
  if (s === "open") return isVrisch ? "bg-emerald-600/60" : "bg-emerald-400/60";
  if (s === "application") return isVrisch ? "bg-amber-500/60" : "bg-amber-400/60";
  return isVrisch ? "bg-white/10" : "bg-stone-200/60";
}

function pillClass(project, isVrisch) {
  const s = (project.status ?? "").toLowerCase();
  if (project.archived || s === "closed") return isVrisch ? "bg-stone-700 text-stone-300" : "bg-stone-200 text-stone-600";
  if (s === "open") return isVrisch ? "bg-emerald-800/70 text-emerald-300" : "bg-emerald-100 text-emerald-800";
  if (s === "application") return isVrisch ? "bg-amber-700/70 text-amber-300" : "bg-amber-100 text-amber-800";
  return isVrisch ? "bg-white/10 text-white/50" : "bg-stone-100 text-stone-500";
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ProjectGanttView({ projects, isVrisch, onProjectClick }) {
  const now = today();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const daysInMonth = getDaysInMonth(year, month);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const todayKey = toDateKey(now.getFullYear(), now.getMonth(), now.getDate());

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  }
  function goToToday() {
    setYear(now.getFullYear());
    setMonth(now.getMonth());
  }

  // Split projects into scheduled and unscheduled
  const { scheduled, unscheduled } = useMemo(() => {
    const scheduled = [];
    const unscheduled = [];
    for (const p of projects) {
      if (p.archived) continue;
      if (p.start_date) scheduled.push(p);
      else unscheduled.push(p);
    }
    // Sort scheduled by start_date
    scheduled.sort((a, b) => (a.start_date ?? "").localeCompare(b.start_date ?? ""));
    return { scheduled, unscheduled };
  }, [projects]);

  // For each project, compute which day numbers in this month are "active"
  function getActiveDays(project) {
    const start = parseLocalDate(project.start_date);
    const end = parseLocalDate(project.end_date) ?? now;
    if (!start) return new Set();

    const active = new Set();
    for (let d = 1; d <= daysInMonth; d++) {
      const key = toDateKey(year, month, d);
      const cellDate = parseLocalDate(key);
      if (cellDate >= start && cellDate <= end) {
        active.add(d);
      }
    }
    return active;
  }

  const isTodayMonth = year === now.getFullYear() && month === now.getMonth();
  const todayDay = isTodayMonth ? now.getDate() : null;

  const containerBg = isVrisch
    ? "border-white/10 bg-[rgba(8,8,8,0.88)] text-[rgba(238,233,224,0.92)]"
    : "border-[rgba(122,112,94,0.28)] bg-[rgba(255,252,247,0.97)] text-[rgba(43,43,43,0.86)]";

  const headerBg = isVrisch
    ? "bg-[rgba(12,12,12,0.97)] border-white/10"
    : "bg-[rgba(248,244,236,0.99)] border-[rgba(122,112,94,0.2)]";

  const colHeaderBg = isVrisch
    ? "bg-[rgba(18,18,18,0.95)] border-white/8 text-[rgba(200,195,185,0.6)]"
    : "bg-[rgba(245,241,233,0.99)] border-[rgba(120,110,90,0.15)] text-[rgba(75,71,65,0.55)]";

  const rowBorder = isVrisch ? "border-white/8" : "border-[rgba(120,110,90,0.12)]";
  const cellBorder = isVrisch ? "border-white/5" : "border-[rgba(120,110,90,0.08)]";
  const todayColBg = isVrisch ? "bg-amber-400/8" : "bg-amber-500/8";
  const todayHeaderBg = isVrisch ? "bg-amber-400/20 text-amber-300 font-bold" : "bg-amber-500/20 text-amber-700 font-bold";
  const labelBg = isVrisch ? "bg-[rgba(12,12,12,0.6)]" : "bg-[rgba(248,244,236,0.9)]";
  const btnBase = isVrisch
    ? "text-[rgba(220,214,203,0.7)] hover:bg-white/10 hover:text-white"
    : "text-[rgba(75,71,65,0.6)] hover:bg-[rgba(122,112,94,0.12)] hover:text-[rgba(43,43,43,0.9)]";
  const muted = isVrisch ? "text-[rgba(200,195,185,0.55)]" : "text-[rgba(75,71,65,0.5)]";

  const LABEL_W = "w-28 min-w-[7rem] max-md:w-20 max-md:min-w-[5rem]";
  // Each day column: narrow on mobile
  const DAY_W = "w-7 min-w-[1.75rem] max-md:w-5 max-md:min-w-[1.25rem]";

  function ProjectRow({ project }) {
    const activeDays = getActiveDays(project);
    const hasEnd = Boolean(project.end_date);

    return (
      <div className={`flex border-b ${rowBorder} hover:${isVrisch ? "bg-white/[0.02]" : "bg-[rgba(122,112,94,0.03)]"} transition-colors`}>
        {/* Label */}
        <div
          className={`sticky left-0 z-10 flex ${LABEL_W} shrink-0 cursor-pointer flex-col justify-center gap-0.5 overflow-hidden border-r px-2 py-1.5 ${rowBorder} ${labelBg}`}
          onClick={() => onProjectClick?.(project)}
          title={project.title}
        >
          <span className="truncate text-[0.68rem] font-medium leading-tight">
            {project.title}
          </span>
          <span className={`w-fit rounded px-1 py-px text-[0.5rem] uppercase tracking-wide ${pillClass(project, isVrisch)}`}>
            {project.status ?? "—"}
          </span>
        </div>

        {/* Day cells */}
        {days.map((d) => {
          const isActive = activeDays.has(d);
          const isToday = todayDay === d;
          const isFirst = isActive && !activeDays.has(d - 1);
          const isLast = isActive && !activeDays.has(d + 1);
          const isOpenEnd = isLast && !hasEnd;

          return (
            <div
              key={d}
              className={`relative ${DAY_W} shrink-0 border-r py-1.5 ${cellBorder} ${isToday ? todayColBg : ""}`}
              onClick={() => isActive && onProjectClick?.(project)}
            >
              {isActive && (
                <div
                  className={`absolute inset-y-1.5 ${isFirst ? "left-1" : "left-0"} ${isLast ? "right-1" : "right-0"} ${barBg(project, isVrisch)} ${isFirst ? "rounded-l-full" : ""} ${isLast && !isOpenEnd ? "rounded-r-full" : ""} ${isOpenEnd ? "border-r-2 border-dashed border-current opacity-80" : ""} cursor-pointer transition-opacity hover:opacity-90`}
                />
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className={`absolute inset-x-6 bottom-6 top-22 z-6 flex flex-col overflow-hidden rounded-2xl border shadow-xl max-md:inset-x-4 max-md:bottom-20 max-md:top-24 ${containerBg}`}>

      {/* Top nav */}
      <div className={`flex shrink-0 items-center justify-between border-b px-4 py-2.5 ${headerBg}`}>
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className={`rounded-lg p-1.5 text-sm transition-colors ${btnBase}`}>←</button>
          <button onClick={nextMonth} className={`rounded-lg p-1.5 text-sm transition-colors ${btnBase}`}>→</button>
          <h2 className="text-sm font-semibold tracking-wide">
            {MONTH_NAMES[month]} {year}
          </h2>
        </div>
        {!isTodayMonth && (
          <button onClick={goToToday} className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${btnBase}`}>
            Today
          </button>
        )}
      </div>

      {/* Scrollable grid */}
      <div className="min-h-0 flex-1 overflow-auto">
        <div className="inline-flex min-w-full flex-col">

          {/* Column headers (day numbers) */}
          <div className={`sticky top-0 z-20 flex border-b ${colHeaderBg}`}>
            <div className={`sticky left-0 z-30 ${LABEL_W} shrink-0 border-r ${colHeaderBg} px-2 py-2 text-[0.6rem] uppercase tracking-widest`}>
              Project
            </div>
            {days.map((d) => (
              <div
                key={d}
                className={`${DAY_W} shrink-0 border-r py-2 text-center text-[0.6rem] font-semibold ${cellBorder} ${todayDay === d ? todayHeaderBg : ""}`}
              >
                {d}
              </div>
            ))}
          </div>

          {/* Scheduled rows */}
          {scheduled.length === 0 && unscheduled.length === 0 ? (
            <div className={`px-6 py-10 text-center text-sm ${muted}`}>No projects yet.</div>
          ) : null}

          {scheduled.map((p) => (
            <ProjectRow key={p.id} project={p} />
          ))}

          {/* Unscheduled section */}
          {unscheduled.length > 0 && (
            <>
              <div className={`sticky left-0 border-b px-4 py-1.5 text-[0.6rem] uppercase tracking-widest ${muted} ${isVrisch ? "bg-[rgba(18,18,18,0.9)] border-white/8" : "bg-[rgba(245,241,233,0.98)] border-[rgba(120,110,90,0.15)]"}`}>
                Unscheduled
              </div>
              {unscheduled.map((p) => (
                <div key={p.id} className={`flex border-b ${rowBorder}`}>
                  <div
                    className={`sticky left-0 z-10 flex ${LABEL_W} shrink-0 cursor-pointer flex-col justify-center gap-0.5 overflow-hidden border-r px-2 py-1.5 ${rowBorder} ${labelBg}`}
                    onClick={() => onProjectClick?.(p)}
                    title={p.title}
                  >
                    <span className="truncate text-[0.68rem] font-medium leading-tight">{p.title}</span>
                    <span className={`w-fit rounded px-1 py-px text-[0.5rem] uppercase tracking-wide ${pillClass(p, isVrisch)}`}>
                      {p.status ?? "—"}
                    </span>
                  </div>
                  {days.map((d) => (
                    <div key={d} className={`${DAY_W} shrink-0 border-r ${cellBorder} ${todayDay === d ? todayColBg : ""}`} />
                  ))}
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className={`flex shrink-0 items-center gap-4 border-t px-4 py-2 text-[0.6rem] uppercase tracking-widest ${muted} ${isVrisch ? "border-white/8" : "border-[rgba(120,110,90,0.12)]"}`}>
        <span className="flex items-center gap-1.5"><span className={`inline-block h-2.5 w-5 rounded-full ${isVrisch ? "bg-emerald-600/60" : "bg-emerald-400/60"}`}/>Open</span>
        <span className="flex items-center gap-1.5"><span className={`inline-block h-2.5 w-5 rounded-full ${isVrisch ? "bg-amber-500/60" : "bg-amber-400/60"}`}/>Application</span>
        <span className="flex items-center gap-1.5"><span className={`inline-block h-2.5 w-5 rounded-full ${isVrisch ? "bg-stone-600/50" : "bg-stone-300/70"}`}/>Closed</span>
        <span className="flex items-center gap-1.5"><span className={`inline-block h-2.5 border-r-2 border-dashed w-5 ${isVrisch ? "border-emerald-400" : "border-emerald-600"}`}/>No end date</span>
      </div>
    </div>
  );
}
