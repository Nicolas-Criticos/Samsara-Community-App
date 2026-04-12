import { useMemo, useRef, useEffect, useState } from "react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const MONTH_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** Parse "YYYY-MM-DD" or Date to a local midnight Date, avoiding UTC shift. */
function parseLocalDate(val) {
  if (!val) return null;
  if (val instanceof Date) {
    const d = new Date(val.getFullYear(), val.getMonth(), val.getDate());
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const m = String(val).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const d = new Date(val);
  return Number.isNaN(d.getTime()) ? null : new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function addMonths(date, n) {
  return new Date(date.getFullYear(), date.getMonth() + n, 1);
}

/** Number of days from windowStart to the given date (can be negative). */
function dayOffset(windowStart, date) {
  const msPerDay = 86400000;
  return Math.round((date.getTime() - windowStart.getTime()) / msPerDay);
}

/** Total days in window */
function windowDays(windowStart, windowEnd) {
  return dayOffset(windowStart, windowEnd) + 1;
}

/** First day of month n months before `anchor`. */
function windowStart(anchorYear, anchorMonth, monthsBefore = 0) {
  return new Date(anchorYear, anchorMonth - monthsBefore, 1);
}

/** Last day of a month. */
function lastDayOfMonth(year, month) {
  return new Date(year, month + 1, 0);
}

// ─── Status colours ───────────────────────────────────────────────────────────

function barColour(project, isVrisch) {
  const s = (project.status ?? "").toLowerCase();
  const archived = project.archived;
  if (archived || s === "closed") return isVrisch ? "#6b7280" : "#9ca3af"; // grey
  if (s === "open") return isVrisch ? "#34d399" : "#22c55e";              // green
  if (s === "application") return isVrisch ? "#fbbf24" : "#f59e0b";        // amber
  return isVrisch ? "#9ca3af" : "#d1d5db";
}

function statusPillClass(project, isVrisch) {
  const s = (project.status ?? "").toLowerCase();
  const archived = project.archived;
  if (archived || s === "closed") return isVrisch ? "bg-stone-700 text-stone-300" : "bg-stone-200 text-stone-600";
  if (s === "open") return isVrisch ? "bg-emerald-800/70 text-emerald-300" : "bg-emerald-100 text-emerald-800";
  if (s === "application") return isVrisch ? "bg-amber-700/70 text-amber-300" : "bg-amber-100 text-amber-800";
  return isVrisch ? "bg-white/10 text-white/50" : "bg-stone-100 text-stone-500";
}

function statusLabel(project) {
  return (project.status ?? "unknown").charAt(0).toUpperCase() + (project.status ?? "").slice(1);
}

// ─── Month column headers ─────────────────────────────────────────────────────

function buildMonthSegments(wStart, totalDays) {
  const segments = [];
  let cursor = new Date(wStart);
  let dayCount = 0;

  while (dayCount < totalDays) {
    const segStart = dayCount;
    const lastDay = lastDayOfMonth(cursor.getFullYear(), cursor.getMonth());
    const daysInSeg = Math.min(
      lastDay.getDate() - cursor.getDate() + 1,
      totalDays - dayCount
    );
    segments.push({
      label: `${MONTH_SHORT[cursor.getMonth()]} ${cursor.getFullYear()}`,
      startDay: segStart,
      days: daysInSeg,
    });
    dayCount += daysInSeg;
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
  }
  return segments;
}

// ─── Gantt Bar ────────────────────────────────────────────────────────────────

function GanttBar({ project, wStart, totalDays, isVrisch, onClick }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const start = parseLocalDate(project.start_date);
  if (!start) return null;

  const rawEnd = parseLocalDate(project.end_date);
  const isOpenEnded = !rawEnd;
  const end = rawEnd ?? today;

  // Clamp to window
  const wEnd = new Date(wStart.getTime() + (totalDays - 1) * 86400000);
  const clampedStart = start < wStart ? wStart : start > wEnd ? null : start;
  const clampedEnd = end > wEnd ? wEnd : end < wStart ? null : end;

  if (!clampedStart || !clampedEnd || clampedStart > clampedEnd) return null;

  const leftPct = (dayOffset(wStart, clampedStart) / totalDays) * 100;
  const widthPct = ((dayOffset(wStart, clampedEnd) - dayOffset(wStart, clampedStart) + 1) / totalDays) * 100;
  const colour = barColour(project, isVrisch);

  return (
    <div
      className="absolute top-1/2 h-5 -translate-y-1/2 cursor-pointer rounded-sm transition-opacity hover:opacity-80"
      style={{
        left: `${leftPct}%`,
        width: `${widthPct}%`,
        backgroundColor: colour,
        borderRight: isOpenEnded ? `2px dashed ${isVrisch ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.3)"}` : undefined,
        borderRadius: "3px",
      }}
      onClick={() => onClick(project)}
      title={`${project.title}\n${start.toLocaleDateString()} → ${rawEnd ? rawEnd.toLocaleDateString() : "ongoing"}`}
    />
  );
}

// ─── Today line ───────────────────────────────────────────────────────────────

function TodayLine({ wStart, totalDays, isVrisch }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const offset = dayOffset(wStart, today);
  if (offset < 0 || offset >= totalDays) return null;
  const leftPct = (offset / totalDays) * 100;
  return (
    <div
      className="pointer-events-none absolute inset-y-0 z-10 w-px"
      style={{
        left: `${leftPct}%`,
        backgroundColor: isVrisch ? "rgba(251,191,36,0.7)" : "rgba(220,38,38,0.6)",
      }}
    />
  );
}

// ─── Row ──────────────────────────────────────────────────────────────────────

function GanttRow({ project, wStart, totalDays, isVrisch, onProjectClick, isEven }) {
  const rowBg = isEven
    ? isVrisch ? "bg-white/[0.015]" : "bg-black/[0.018]"
    : "";

  const pillClass = statusPillClass(project, isVrisch);

  return (
    <div className={`flex h-10 items-center ${rowBg}`}>
      {/* Label */}
      <div
        className={`flex w-32 shrink-0 cursor-pointer flex-col justify-center overflow-hidden px-2 max-md:w-20 ${
          isVrisch ? "text-[rgba(238,233,224,0.85)]" : "text-[rgba(43,43,43,0.85)]"
        }`}
        onClick={() => onProjectClick(project)}
        title={project.title}
      >
        <span className="truncate text-[0.68rem] font-medium leading-tight">
          {project.title}
        </span>
        <span className={`mt-0.5 w-fit rounded px-1 py-px text-[0.5rem] uppercase tracking-wide ${pillClass}`}>
          {statusLabel(project)}
        </span>
      </div>

      {/* Bar area */}
      <div className="relative min-w-0 flex-1 self-stretch">
        <TodayLine wStart={wStart} totalDays={totalDays} isVrisch={isVrisch} />
        <GanttBar
          project={project}
          wStart={wStart}
          totalDays={totalDays}
          isVrisch={isVrisch}
          onClick={onProjectClick}
        />
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ProjectGanttView({ projects, isVrisch, onProjectClick }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Navigate by month (anchor = first visible month)
  const [anchorYear, setAnchorYear] = useState(today.getFullYear());
  const [anchorMonth, setAnchorMonth] = useState(today.getMonth());

  const WINDOW_MONTHS = 3;

  const wStart = useMemo(
    () => new Date(anchorYear, anchorMonth, 1),
    [anchorYear, anchorMonth]
  );
  const wEnd = useMemo(
    () => lastDayOfMonth(anchorYear, anchorMonth + WINDOW_MONTHS - 1),
    [anchorYear, anchorMonth]
  );
  const totalDays = useMemo(() => dayOffset(wStart, wEnd) + 1, [wStart, wEnd]);
  const monthSegments = useMemo(
    () => buildMonthSegments(wStart, totalDays),
    [wStart, totalDays]
  );

  // Split projects
  const { scheduled, unscheduled } = useMemo(() => {
    const scheduled = [];
    const unscheduled = [];
    for (const p of projects) {
      if (p.archived) continue;
      if (p.start_date) scheduled.push(p);
      else unscheduled.push(p);
    }
    // Sort scheduled by start_date asc
    scheduled.sort((a, b) => {
      const da = parseLocalDate(a.start_date);
      const db = parseLocalDate(b.start_date);
      return (da?.getTime() ?? 0) - (db?.getTime() ?? 0);
    });
    return { scheduled, unscheduled };
  }, [projects]);

  function prevWindow() {
    let m = anchorMonth - WINDOW_MONTHS;
    let y = anchorYear;
    while (m < 0) { m += 12; y -= 1; }
    setAnchorMonth(m);
    setAnchorYear(y);
  }

  function nextWindow() {
    let m = anchorMonth + WINDOW_MONTHS;
    let y = anchorYear;
    while (m > 11) { m -= 12; y += 1; }
    setAnchorMonth(m);
    setAnchorYear(y);
  }

  function goToToday() {
    setAnchorYear(today.getFullYear());
    setAnchorMonth(today.getMonth());
  }

  const isAtToday =
    anchorYear === today.getFullYear() && anchorMonth === today.getMonth();

  // Styles
  const containerClass = isVrisch
    ? "border-white/10 bg-[rgba(8,8,8,0.86)] text-[rgba(238,233,224,0.92)]"
    : "border-[rgba(122,112,94,0.28)] bg-[rgba(255,252,247,0.95)] text-[rgba(43,43,43,0.86)]";

  const headerBg = isVrisch
    ? "bg-[rgba(12,12,12,0.97)] border-white/10"
    : "bg-[rgba(248,244,236,0.99)] border-[rgba(122,112,94,0.2)]";

  const btnBase = isVrisch
    ? "text-[rgba(220,214,203,0.7)] hover:bg-white/10 hover:text-[rgba(238,233,224,0.95)]"
    : "text-[rgba(75,71,65,0.6)] hover:bg-[rgba(122,112,94,0.12)] hover:text-[rgba(43,43,43,0.9)]";

  const dividerClass = isVrisch
    ? "border-white/8"
    : "border-[rgba(120,110,90,0.12)]";

  const labelColWidth = "w-32 max-md:w-20 shrink-0";

  const sectionHeaderClass = isVrisch
    ? "text-[rgba(200,195,185,0.5)]"
    : "text-[rgba(75,71,65,0.4)]";

  return (
    <div
      className={`absolute inset-x-6 bottom-6 top-22 z-6 flex flex-col overflow-hidden rounded-2xl border shadow-xl max-md:inset-x-4 max-md:bottom-20 max-md:top-24 ${containerClass}`}
    >
      {/* ── Top navigation bar ── */}
      <div className={`flex items-center justify-between border-b px-4 py-3 ${headerBg}`}>
        <div className="flex items-center gap-2">
          <button
            onClick={prevWindow}
            className={`rounded-lg p-1.5 text-sm transition-colors ${btnBase}`}
            aria-label="Previous period"
          >
            ←
          </button>
          <button
            onClick={nextWindow}
            className={`rounded-lg p-1.5 text-sm transition-colors ${btnBase}`}
            aria-label="Next period"
          >
            →
          </button>
          <span className="text-sm font-semibold tracking-wide">
            {MONTH_SHORT[anchorMonth]} – {MONTH_SHORT[(anchorMonth + WINDOW_MONTHS - 1) % 12]}{" "}
            {anchorYear}
          </span>
        </div>

        {!isAtToday && (
          <button
            onClick={goToToday}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${btnBase}`}
          >
            Today
          </button>
        )}
      </div>

      {/* ── Month segment headers + grid ── */}
      <div className="min-h-0 flex-1 overflow-auto">
        {/* Month labels row */}
        <div className={`sticky top-0 z-20 flex border-b ${dividerClass} ${
          isVrisch ? "bg-[rgba(14,14,14,0.98)]" : "bg-[rgba(246,242,234,0.99)]"
        }`}>
          {/* Spacer for label column */}
          <div className={`${labelColWidth} border-r ${dividerClass}`} />
          {/* Month segments */}
          <div className="relative flex-1">
            <div className="flex h-7">
              {monthSegments.map((seg) => (
                <div
                  key={seg.startDay}
                  className={`border-r ${dividerClass} flex items-center justify-center overflow-hidden`}
                  style={{ flex: `${seg.days} 0 0` }}
                >
                  <span className={`truncate px-1 text-[0.6rem] font-semibold uppercase tracking-widest ${sectionHeaderClass}`}>
                    {seg.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Scheduled rows */}
        {scheduled.length > 0 && (
          <>
            {scheduled.map((project, i) => (
              <div key={project.id} className={`flex border-b ${dividerClass}`}>
                {/* The row itself */}
                <GanttRow
                  project={project}
                  wStart={wStart}
                  totalDays={totalDays}
                  isVrisch={isVrisch}
                  onProjectClick={onProjectClick}
                  isEven={i % 2 === 0}
                />
              </div>
            ))}
          </>
        )}

        {/* Empty state for scheduled */}
        {scheduled.length === 0 && (
          <div className={`flex h-20 items-center justify-center text-[0.75rem] ${sectionHeaderClass}`}>
            No projects with dates scheduled
          </div>
        )}

        {/* Unscheduled section */}
        {unscheduled.length > 0 && (
          <>
            <div className={`sticky top-7 z-10 flex items-center gap-2 border-b border-t px-3 py-1.5 ${dividerClass} ${
              isVrisch ? "bg-[rgba(20,20,20,0.97)]" : "bg-[rgba(242,238,230,0.98)]"
            }`}>
              <span className={`text-[0.6rem] uppercase tracking-widest ${sectionHeaderClass}`}>
                Unscheduled
              </span>
            </div>
            {unscheduled.map((project, i) => (
              <div key={project.id} className={`flex border-b ${dividerClass}`}>
                <div
                  className={`flex h-10 w-32 shrink-0 cursor-pointer flex-col justify-center overflow-hidden border-r px-2 max-md:w-20 ${dividerClass} ${
                    isVrisch ? "text-[rgba(238,233,224,0.65)]" : "text-[rgba(43,43,43,0.6)]"
                  } ${i % 2 === 0 ? (isVrisch ? "bg-white/[0.01]" : "bg-black/[0.015]") : ""}`}
                  onClick={() => onProjectClick(project)}
                  title={project.title}
                >
                  <span className="truncate text-[0.68rem] font-medium leading-tight">
                    {project.title}
                  </span>
                  <span className={`mt-0.5 w-fit rounded px-1 py-px text-[0.5rem] uppercase tracking-wide ${statusPillClass(project, isVrisch)}`}>
                    {statusLabel(project)}
                  </span>
                </div>
                {/* Empty bar area with today line */}
                <div className={`relative flex-1 ${i % 2 === 0 ? (isVrisch ? "bg-white/[0.01]" : "bg-black/[0.015]") : ""}`}>
                  <TodayLine wStart={wStart} totalDays={totalDays} isVrisch={isVrisch} />
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
