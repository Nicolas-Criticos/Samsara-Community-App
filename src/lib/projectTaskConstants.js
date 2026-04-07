/** Matches Supabase enum `project_task_status` (Pascal case). */
export const PROJECT_TASK_STATUSES = [
  "Pending",
  "Started",
  "Finalising",
  "Completed",
  "Running",
  "Closed",
];

export const DEFAULT_PROJECT_TASK_STATUS = "Pending";

/** True if value is a known task status (handles legacy rows). */
export function isProjectTaskStatus(value) {
  return PROJECT_TASK_STATUSES.includes(value);
}
