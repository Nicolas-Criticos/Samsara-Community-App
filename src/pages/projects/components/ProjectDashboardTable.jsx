import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { capitalizeWords } from "../../../lib/textFormat.js";
import { projectDetailHref } from "../../../lib/slug.js";

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatCreatedAt(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatRolesNeeded(value) {
  if (!value) return "—";
  if (Array.isArray(value)) return value.join(", ");
  return String(value);
}

function truncate(value, max = 60) {
  if (!value) return "—";
  const str = String(value);
  return str.length > max ? str.slice(0, max) + "…" : str;
}

// ─── Filter Logic ────────────────────────────────────────────────────────────

const COMPLETED_STATUSES = ["completed", "closed", "finalising"];
const OPEN_STATUSES = ["open"];
const APPLICATION_STATUSES = ["application"];

function filterProjects(projects, tab) {
  switch (tab) {
    case "active":
      return projects.filter(
        (p) =>
          !p.archived &&
          (OPEN_STATUSES.includes((p.status ?? "").toLowerCase()) ||
           APPLICATION_STATUSES.includes((p.status ?? "").toLowerCase()) ||
           ACTIVE_STATUSES.includes((p.status ?? "").toLowerCase()))
      );
    case "completed":
      return projects.filter(
        (p) =>
          COMPLETED_STATUSES.includes((p.status ?? "").toLowerCase()) ||
          p.archived
      );
    case "archived":
      return projects.filter((p) => p.archived);
    default:
      return projects;
  }
}

// ─── Status Pill ─────────────────────────────────────────────────────────────

const ACTIVE_STATUSES = ["active", "in_progress", "started", "running"];

function getStatusVariant(status, archived) {
  if (archived) return "archived";
  const s = (status ?? "").toLowerCase();
  if (OPEN_STATUSES.includes(s)) return "open";
  if (APPLICATION_STATUSES.includes(s)) return "application";
  if (ACTIVE_STATUSES.includes(s)) return "active";
  if (COMPLETED_STATUSES.includes(s)) return "completed";
  if (s === "pending") return "pending";
  return "neutral";
}

function StatusPill({ status, archived, isVrisch }) {
  const variant = getStatusVariant(status, archived);

  const styles = {
    open: isVrisch
      ? "bg-emerald-900/40 text-emerald-300 ring-1 ring-emerald-500/30"
      : "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300/60",
    application: isVrisch
      ? "bg-amber-900/40 text-amber-300 ring-1 ring-amber-500/30"
      : "bg-amber-100 text-amber-800 ring-1 ring-amber-300/60",
    active: isVrisch
      ? "bg-amber-900/40 text-amber-300 ring-1 ring-amber-500/30"
      : "bg-amber-100 text-amber-800 ring-1 ring-amber-300/60",
    completed: isVrisch
      ? "bg-stone-700/60 text-stone-300 ring-1 ring-stone-500/30"
      : "bg-stone-200 text-stone-600 ring-1 ring-stone-300/60",
    archived: isVrisch
      ? "bg-white/10 text-white/50 ring-1 ring-white/10"
      : "bg-stone-200/70 text-stone-500 ring-1 ring-stone-300/50",
    pending: isVrisch
      ? "bg-indigo-900/40 text-indigo-300 ring-1 ring-indigo-500/30"
      : "bg-indigo-100 text-indigo-700 ring-1 ring-indigo-300/60",
    neutral: isVrisch
      ? "bg-white/8 text-white/60 ring-1 ring-white/10"
      : "bg-stone-100 text-stone-600 ring-1 ring-stone-300/40",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[0.68rem] font-semibold uppercase tracking-wide ${styles[variant]}`}
    >
      {capitalizeWords(status ?? "—")}
    </span>
  );
}

// ─── Sort Indicator ───────────────────────────────────────────────────────────

function SortIcon({ direction }) {
  if (!direction) {
    return (
      <span className="ml-1 opacity-30 select-none">
        <span className="inline-block text-[10px] leading-none">↕</span>
      </span>
    );
  }
  return (
    <span className="ml-1 select-none">
      {direction === "asc" ? "↑" : "↓"}
    </span>
  );
}

// ─── Filter Tabs ──────────────────────────────────────────────────────────────

const TABS = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "completed", label: "Completed" },
  { key: "archived", label: "Archived" },
];

function FilterTabs({ activeTab, onChange, isVrisch }) {
  return (
    <div
      className={`flex items-center gap-1 border-b px-4 py-2 ${
        isVrisch
          ? "border-white/10 bg-[rgba(12,12,12,0.95)]"
          : "border-[rgba(122,112,94,0.2)] bg-[rgba(248,244,236,0.97)]"
      }`}
    >
      {TABS.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold tracking-wide transition-all ${
              isActive
                ? isVrisch
                  ? "bg-white/15 text-[rgba(238,233,224,0.95)]"
                  : "bg-[rgba(122,112,94,0.18)] text-[rgba(43,43,43,0.9)]"
                : isVrisch
                  ? "text-[rgba(220,214,203,0.5)] hover:bg-white/8 hover:text-[rgba(220,214,203,0.8)]"
                  : "text-[rgba(75,71,65,0.5)] hover:bg-[rgba(122,112,94,0.1)] hover:text-[rgba(43,43,43,0.7)]"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ProjectDashboardTable({ projects, isVrisch, realm }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("all");
  const [sorting, setSorting] = useState([]);

  const filteredProjects = useMemo(
    () => filterProjects(projects, activeTab),
    [projects, activeTab]
  );

  const columns = useMemo(
    () => [
      {
        accessorKey: "title",
        header: "Title",
        cell: ({ getValue }) => (
          <span className="font-medium">{getValue() ?? "—"}</span>
        ),
      },
      {
        accessorKey: "description",
        header: "Description",
        cell: ({ getValue }) => (
          <span className="opacity-70">{truncate(getValue(), 60)}</span>
        ),
        enableSorting: false,
      },
      { accessorKey: "timeline", header: "Timeline" },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ getValue, row }) => (
          <StatusPill
            status={getValue()}
            archived={row.original.archived}
            isVrisch={isVrisch}
          />
        ),
      },
      {
        accessorKey: "roles_needed",
        header: "Roles Needed",
        cell: ({ getValue }) => formatRolesNeeded(getValue()),
        enableSorting: false,
      },
      { accessorKey: "created_by_name", header: "Created By" },
      {
        accessorKey: "created_at",
        header: "Created At",
        cell: ({ getValue }) => formatCreatedAt(getValue()),
      },
    ],
    [isVrisch]
  );

  const table = useReactTable({
    data: filteredProjects,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div
      className={`absolute inset-x-6 bottom-6 top-22 z-6 flex flex-col overflow-hidden rounded-2xl border shadow-xl max-md:inset-x-4 max-md:bottom-20 max-md:top-24 ${
        isVrisch
          ? "border-white/10 bg-[rgba(8,8,8,0.86)] text-[rgba(238,233,224,0.92)]"
          : "border-[rgba(122,112,94,0.28)] bg-[rgba(255,252,247,0.95)] text-[rgba(43,43,43,0.86)]"
      }`}
    >
      {/* Filter Tabs */}
      <FilterTabs
        activeTab={activeTab}
        onChange={setActiveTab}
        isVrisch={isVrisch}
      />

      {/* Table */}
      <div className="min-h-0 flex-1 overflow-auto">
        <table className="min-w-full border-collapse text-left text-sm">
          <thead
            className={`sticky top-0 z-10 text-[0.62rem] uppercase tracking-[0.14em] ${
              isVrisch
                ? "bg-[rgba(18,18,18,0.97)] text-[rgba(220,214,203,0.8)]"
                : "bg-[rgba(248,244,236,0.99)] text-[rgba(75,71,65,0.66)]"
            }`}
          >
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  return (
                    <th
                      key={header.id}
                      className={`border-b px-4 py-3 font-semibold whitespace-nowrap ${
                        isVrisch ? "border-white/10" : "border-[rgba(120,110,90,0.2)]"
                      } ${canSort ? "cursor-pointer select-none hover:opacity-80" : ""}`}
                      onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                    >
                      {header.isPlaceholder ? null : (
                        <span className="inline-flex items-center">
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                          {canSort && (
                            <SortIcon direction={header.column.getIsSorted()} />
                          )}
                        </span>
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row, i) => (
                <tr
                  key={row.id}
                  onClick={() => {
                    const href = projectDetailHref(realm ?? "samsara", row.original.title);
                    if (href) navigate(href);
                  }}
                  className={`cursor-pointer border-b transition-colors ${
                    isVrisch
                      ? `border-white/8 ${i % 2 === 0 ? "" : "bg-white/[0.02]"} hover:bg-white/5`
                      : `border-[rgba(120,110,90,0.15)] ${i % 2 === 0 ? "" : "bg-[rgba(122,112,94,0.04)]"} hover:bg-[rgba(122,112,94,0.07)]`
                  }`}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3 align-top">
                      {cell.column.columnDef.cell
                        ? flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )
                        : String(cell.getValue() ?? "—")}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  className="px-4 py-12 text-center opacity-50"
                  colSpan={columns.length}
                >
                  No projects found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
