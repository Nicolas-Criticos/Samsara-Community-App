import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useMemo } from "react";
import { capitalizeWords } from "../../../lib/textFormat.js";

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

export default function ProjectDashboardTable({ projects, isVrisch }) {
  const columns = useMemo(
    () => [
      { accessorKey: "title", header: "Title" },
      { accessorKey: "timeline", header: "Timeline" },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ getValue }) => capitalizeWords(getValue()),
      },
      {
        accessorKey: "roles_needed",
        header: "Roles Needed",
        cell: ({ getValue }) => formatRolesNeeded(getValue()),
      },
      { accessorKey: "created_by_name", header: "Created By" },
      {
        accessorKey: "created_at",
        header: "Created At",
        cell: ({ getValue }) => formatCreatedAt(getValue()),
      },
    ],
    []
  );

  const table = useReactTable({
    data: projects,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div
      className={`absolute inset-x-6 bottom-6 top-22 z-6 overflow-hidden rounded-2xl border shadow-xl max-md:inset-x-4 max-md:bottom-20 max-md:top-24 ${
        isVrisch
          ? "border-white/10 bg-[rgba(8,8,8,0.86)] text-[rgba(238,233,224,0.92)]"
          : "border-[rgba(122,112,94,0.28)] bg-[rgba(255,252,247,0.95)] text-[rgba(43,43,43,0.86)]"
      }`}
    >
      <div className="h-full overflow-auto">
        <table className="min-w-full border-collapse text-left text-sm">
          <thead
            className={`sticky top-0 z-1 text-[0.62rem] uppercase tracking-[0.14em] ${
              isVrisch
                ? "bg-[rgba(18,18,18,0.95)] text-[rgba(220,214,203,0.8)]"
                : "bg-[rgba(248,244,236,0.97)] text-[rgba(75,71,65,0.66)]"
            }`}
          >
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="border-b border-white/10 px-4 py-3 font-semibold whitespace-nowrap"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className={`border-b ${
                    isVrisch
                      ? "border-white/8"
                      : "border-[rgba(120,110,90,0.15)]"
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
                  className="px-4 py-8 text-center opacity-70"
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
