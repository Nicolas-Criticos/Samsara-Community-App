import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import {
  Button,
  IconButton,
  TextArea,
  TextInput,
} from "../../components/ui/index.js";
import { PROJECT_TASK_STATUSES } from "../../lib/projectTaskConstants.js";
import ImageDropzone from "./components/ImageDropzone.jsx";
import ProjectAddUpdateModal from "./components/ProjectAddUpdateModal.jsx";
import ProjectDetailMenu from "./components/ProjectDetailMenu.jsx";
import ProjectEditModal from "./components/ProjectEditModal.jsx";
import ProjectTaskModal from "./components/ProjectTaskModal.jsx";
import { useProjectDetailPage } from "./hooks/useProjectDetailPage.js";

function formatWhen(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

function projectStatusLabel(s) {
  if (s === "open") return "Open";
  if (s === "application") return "Application";
  if (s === "closed") return "Closed";
  return s || "—";
}

function taskPillClass(status, isVrisch) {
  const s = status || "";
  if (s === "Completed" || s === "done") {
    return isVrisch
      ? "border-emerald-400/35 bg-emerald-500/20 text-emerald-100"
      : "border-emerald-600/25 bg-emerald-100/90 text-emerald-950";
  }
  if (s === "Started" || s === "Running" || s === "in_progress") {
    return isVrisch
      ? "border-sky-400/35 bg-sky-500/15 text-sky-100"
      : "border-sky-500/25 bg-sky-50 text-sky-950";
  }
  if (s === "Finalising") {
    return isVrisch
      ? "border-violet-400/35 bg-violet-500/15 text-violet-100"
      : "border-violet-500/30 bg-violet-50 text-violet-950";
  }
  if (s === "Closed") {
    return isVrisch
      ? "border-stone-500/40 bg-stone-800/40 text-stone-200"
      : "border-stone-400/50 bg-stone-100 text-stone-800";
  }
  return isVrisch
    ? "border-amber-400/35 bg-amber-500/15 text-amber-100"
    : "border-amber-600/25 bg-amber-50 text-amber-950";
}

function taskStatusLabel(status) {
  if (!status) return "—";
  if (status === "done") return "Completed";
  if (status === "pending") return "Pending";
  if (status === "in_progress") return "Started";
  return PROJECT_TASK_STATUSES.includes(status) ? status : String(status);
}

function TaskStatusPill({ status, isVrisch }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-0.5 text-[0.65rem] font-medium uppercase tracking-[0.08em] ${taskPillClass(
        status,
        isVrisch
      )}`}
    >
      {taskStatusLabel(status)}
    </span>
  );
}

function formatShortDate(d) {
  if (d == null || d === "") return null;
  const s = String(d);
  const ymd = s.length >= 10 ? s.slice(0, 10) : s;
  try {
    return new Date(`${ymd}T12:00:00`).toLocaleDateString(undefined, {
      dateStyle: "medium",
    });
  } catch {
    return ymd;
  }
}

function taskDateRangeLine(start, end) {
  const a = formatShortDate(start);
  const b = formatShortDate(end);
  if (a && b) return `${a} → ${b}`;
  if (a) return `From ${a}`;
  if (b) return `Until ${b}`;
  return null;
}

function isTaskCompletedStatus(status) {
  return status === "Completed" || status === "done";
}

export default function ProjectDetailPage() {
  const {
    realm,
    isVrisch,
    project,
    tasks,
    updates,
    loadError,
    ready,
    isProjectLoading,
    isCreator,
    isContributor,
    showContributorAddUpdate,
    canManageTasks,
    currentUserId,
    navigate,
    addTask,
    addUpdate,
    creatorUpdatePending,
    submitCreatorUpdate,
    updateTask,
    updateProjectFields,
    joinProject,
    leaveProjectContributor,
    applyToProject,
    detailCreator,
    detailContributors,
    detailRoles,
    inspirationLink,
    applicationBanner,
    primaryConfig,
    showEndProject,
    onStatusChange,
    endProject,
    handleApplications,
  } = useProjectDetailPage();

  const [updFile, setUpdFile] = useState(null);
  const creatorUpdateForm = useForm({
    defaultValues: { title: "", description: "" },
  });
  const { register: regCreatorUpdate, handleSubmit: handleCreatorUpdateSubmit, reset: resetCreatorUpdate } =
    creatorUpdateForm;
  const [addUpdateOpen, setAddUpdateOpen] = useState(false);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editProjectOpen, setEditProjectOpen] = useState(false);

  const editingTask = useMemo(
    () => (editingTaskId ? tasks.find((t) => t.id === editingTaskId) : null),
    [editingTaskId, tasks]
  );

  useEffect(() => {
    if (taskModalOpen && editingTaskId && !editingTask) {
      setTaskModalOpen(false);
      setEditingTaskId(null);
    }
  }, [taskModalOpen, editingTaskId, editingTask]);

  function openTaskModalCreate() {
    setEditingTaskId(null);
    setTaskModalOpen(true);
  }

  function closeTaskModal() {
    setTaskModalOpen(false);
    setEditingTaskId(null);
  }

  const mergedTimeline = useMemo(() => {
    const rows = [
      ...tasks.map((t) => ({
        kind: "task",
        id: t.id,
        created_at: t.created_at,
        data: t,
      })),
      ...updates.map((u) => ({
        kind: "update",
        id: u.id,
        created_at: u.created_at,
        data: u,
      })),
    ];
    rows.sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    return rows;
  }, [tasks, updates]);

  const pageBg = isVrisch
    ? "min-h-screen bg-[radial-gradient(circle_at_center,rgba(22,22,22,1),rgba(8,8,8,1))] text-[rgba(235,230,220,0.92)]"
    : "min-h-screen bg-[radial-gradient(circle_at_center,rgba(240,235,220,1),rgba(252,248,242,1))] text-[#2b2b2b]";

  const card = isVrisch
    ? "rounded-2xl border border-white/10 bg-white/5 p-5 shadow-[0_0_40px_rgba(0,0,0,0.5)]"
    : "rounded-2xl border border-[rgba(90,70,50,0.12)] bg-white/80 p-5 shadow-[0_12px_40px_rgba(0,0,0,0.06)]";

  const muted = isVrisch
    ? "text-[rgba(200,195,185,0.72)]"
    : "text-[rgba(60,55,45,0.65)]";

  const submitUpdate = handleCreatorUpdateSubmit((values) => {
    const title = values.title.trim();
    if (!title) {
      alert("Update title is required.");
      return;
    }
    submitCreatorUpdate({
      title,
      description: values.description.trim(),
      file: updFile,
    }, {
      onSuccess: () => {
        resetCreatorUpdate({ title: "", description: "" });
        setUpdFile(null);
      },
      onError: (message) => alert(message),
    });
  });

  if (!ready || isProjectLoading) {
    return (
      <div
        className={`flex min-h-screen items-center justify-center ${pageBg}`}
      >
        <p className={muted}>Loading…</p>
      </div>
    );
  }

  if (loadError || !project) {
    return (
      <div
        className={`flex min-h-screen flex-col items-center justify-center gap-4 px-6 ${pageBg}`}
      >
        <p className={muted}>{loadError || "Project not found"}</p>
        <Button
          type="button"
          variant="link"
          className={isVrisch ? "text-[rgba(220,210,190,0.85)]" : undefined}
          onClick={() => navigate(`/projects/${realm}`)}
        >
          Back to projects
        </Button>
      </div>
    );
  }

  return (
    <div className={`${pageBg} px-4 py-10 pb-16 max-md:px-3 max-md:py-6`}>
      <div className="mx-auto max-w-2xl">
        <button
          type="button"
          className={`mb-6 text-[0.72rem] uppercase tracking-[0.16em] ${muted} transition-opacity hover:opacity-100`}
          onClick={() => navigate(`/projects/${realm}`)}
        >
          ← Back to field
        </button>

        {project.image_url ? (
          <img
            src={project.image_url}
            alt=""
            className={`mb-5 max-h-52 w-full rounded-2xl object-cover ${
              isVrisch ? "brightness-[0.88] contrast-[0.95]" : ""
            }`}
          />
        ) : (
          <div
            className={`mb-5 flex min-h-[120px] items-center justify-center rounded-2xl border border-dashed text-[0.8rem] ${muted} ${
              isVrisch
                ? "border-white/15 bg-white/5"
                : "border-[rgba(90,70,50,0.15)] bg-white/40"
            }`}
          >
            No project image
          </div>
        )}

        <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <h1 className="text-[1.65rem] font-light tracking-wide max-md:text-[1.35rem]">
              {project.title}
            </h1>
            {project.chinese_new_year ? (
              <span className="text-[1.35rem]" title="Chinese New Year project">
                🧧
              </span>
            ) : null}
          </div>
          <ProjectDetailMenu
            isVrisch={isVrisch}
            canEdit={isCreator || isContributor}
            showLeave={isContributor && !isCreator}
            showJoin={
              !isCreator &&
              !isContributor &&
              project.status === "open"
            }
            showApply={
              !isCreator &&
              !isContributor &&
              project.status === "application"
            }
            onEdit={() => setEditProjectOpen(true)}
            onJoin={() => joinProject(project)}
            onLeave={() => leaveProjectContributor(project)}
            onApply={() => applyToProject(project.id)}
          />
        </div>

        <ProjectEditModal
          isVrisch={isVrisch}
          isCreator={isCreator}
          open={editProjectOpen}
          project={project}
          onClose={() => setEditProjectOpen(false)}
          onSave={updateProjectFields}
        />

        <div className="mb-8">
          <p
            className={`text-[0.85rem] leading-relaxed ${
              isVrisch
                ? "text-[rgba(220,215,205,0.88)]"
                : "text-[rgba(43,43,43,0.82)]"
            }`}
          >
            {project.description?.trim() ? project.description : "—"}
          </p>
        </div>

        {inspirationLink ? (
          <div className="mb-8 flex flex-col items-center gap-2 sm:flex-row sm:justify-start">
            <IconButton
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border shadow-none transition-all duration-250 ease-in-out hover:opacity-100 ${
                isVrisch
                  ? "border-white/20 bg-white/10 text-[rgba(235,230,220,0.9)]"
                  : "border-[rgba(140,120,80,0.45)] bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.95),rgba(230,225,215,0.8))] opacity-90"
              }`}
              title="View visual inspiration"
              onClick={() =>
                window.open(inspirationLink, "_blank", "noopener,noreferrer")
              }
            >
              <span className="text-xl leading-none">🖼️</span>
            </IconButton>
            <span
              className={`text-[0.75rem] uppercase tracking-[0.14em] ${muted}`}
            >
              Visual inspiration
            </span>
          </div>
        ) : null}

        {isCreator ? (
          <div className="mb-6 flex justify-center max-md:justify-start">
            <select
              className={`cursor-pointer appearance-none rounded-full border-0 px-5 py-2 text-[0.7rem] uppercase tracking-[0.18em] transition-[filter] duration-200 ${
                isVrisch
                  ? "bg-white/10 text-[rgba(235,230,220,0.85)] hover:brightness-110"
                  : "bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.95),rgba(230,225,215,0.85))] text-[rgba(60,50,40,0.75)] hover:brightness-[1.05]"
              }`}
              value={project.status}
              onChange={(e) => onStatusChange(e.target.value, project)}
              aria-label="Project status"
            >
              <option value="open">🟢 Open</option>
              <option value="application">🟠 Application</option>
              <option value="closed">🔴 Closed</option>
            </select>
          </div>
        ) : null}

        <div
          className={`mb-8 space-y-1 text-[0.8rem] ${
            isVrisch
              ? "text-[rgba(210,205,195,0.78)]"
              : "text-[rgba(43,43,43,0.68)]"
          }`}
        >
          <div>{detailCreator || "—"}</div>
          <div>{detailContributors || "—"}</div>
          {detailRoles ? <div>{detailRoles}</div> : null}
        </div>

        {applicationBanner ? (
          <div
            className="mb-6 cursor-pointer rounded-full bg-amber-100/90 px-4 py-2.5 text-center text-[0.7rem] uppercase tracking-wider text-amber-950 shadow-sm transition-transform hover:scale-[1.02]"
            onClick={() =>
              handleApplications(
                applicationBanner.apps,
                applicationBanner.nameMap,
                applicationBanner.projectId
              )
            }
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleApplications(
                  applicationBanner.apps,
                  applicationBanner.nameMap,
                  applicationBanner.projectId
                );
              }
            }}
            role="button"
            tabIndex={0}
          >
            🟠 {applicationBanner.apps.length} application(s) pending
          </div>
        ) : null}

        {showEndProject && project.created_by === currentUserId ? (
          <button
            type="button"
            className={`mb-6 w-full max-w-md cursor-pointer rounded-full border bg-transparent px-5 py-2 text-[0.62rem] uppercase tracking-[0.18em] shadow-none transition-all duration-250 ease-in-out hover:scale-[1.02] ${
              isVrisch
                ? "border-[rgba(220,180,140,0.35)] text-[rgba(235,220,200,0.85)]"
                : "border-[rgba(120,90,60,0.35)] text-[rgba(120,90,60,0.85)]"
            }`}
            onClick={() => endProject(project)}
          >
            End Project
          </button>
        ) : null}

        {!primaryConfig.hidden ? (
          <div className="mb-10 flex justify-center max-md:justify-start">
            <button
              type="button"
              className={primaryConfig.className}
              disabled={primaryConfig.disabled}
              onClick={() => primaryConfig.onClick?.()}
            >
              {primaryConfig.text}
            </button>
          </div>
        ) : (
          <div className="mb-10" />
        )}

        <div className={`mb-10 grid gap-4 ${card}`}>
          <div className="grid gap-1">
            <span
              className={`text-[0.65rem] uppercase tracking-[0.16em] ${muted}`}
            >
              Timeline
            </span>
            <p className="text-[0.9rem]">
              {project.timeline?.trim() ? project.timeline : "—"}
            </p>
          </div>
          {!isCreator ? (
            <div className="grid gap-1">
              <span
                className={`text-[0.65rem] uppercase tracking-[0.16em] ${muted}`}
              >
                Status
              </span>
              <p className="text-[0.9rem]">
                {projectStatusLabel(project.status)}
              </p>
            </div>
          ) : null}
        </div>

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-[0.75rem] uppercase tracking-[0.2em]">
            Checklist
          </h2>
          {canManageTasks ? (
            <button
              type="button"
              className={`cursor-pointer rounded-full border-2 px-4 py-1.5 text-[0.6rem] uppercase tracking-[0.16em] transition-all duration-250 ease-in-out hover:scale-[1.02] ${
                isVrisch
                  ? "border-[rgba(200,190,160,0.45)] bg-white/8 text-[rgba(240,235,225,0.92)] hover:border-[rgba(220,210,180,0.6)] hover:bg-white/12"
                  : "border-[rgba(100,85,65,0.4)] bg-white/50 text-[rgba(55,48,38,0.9)] hover:border-[rgba(100,85,65,0.65)] hover:bg-white/80"
              }`}
              onClick={openTaskModalCreate}
            >
              Add task
            </button>
          ) : null}
        </div>

        <ProjectTaskModal
          open={taskModalOpen}
          onClose={closeTaskModal}
          isVrisch={isVrisch}
          task={editingTask}
          onSave={(payload) =>
            editingTask ? updateTask(editingTask.id, payload) : addTask(payload)
          }
        />

        <ul className="mb-10 space-y-3">
          {tasks.length === 0 ? (
            <li className={`text-[0.88rem] ${muted}`}>No tasks yet.</li>
          ) : (
            tasks.map((t) => (
              <li key={t.id} className={card}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex min-w-0 flex-1 items-start gap-2">
                    <button
                      type="button"
                      title={isTaskCompletedStatus(t.status) ? "Mark as pending" : "Mark as complete"}
                      onClick={() => updateTask(t.id, {
                        name: t.name,
                        description: t.description || "",
                        status: isTaskCompletedStatus(t.status) ? "Pending" : "Completed",
                        start_date: t.start_date || null,
                        end_date: t.end_date || null,
                      })}
                      className={`mt-0.5 inline-flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded-full border text-[0.65rem] transition-all hover:scale-110 ${
                        isTaskCompletedStatus(t.status)
                          ? isVrisch
                            ? "border-emerald-400/50 bg-emerald-500/25 text-emerald-100"
                            : "border-emerald-600/40 bg-emerald-100 text-emerald-900"
                          : isVrisch
                          ? "border-white/20 text-[rgba(220,215,205,0.5)] hover:border-white/40"
                          : "border-[rgba(60,50,40,0.2)] text-[rgba(60,50,40,0.35)] hover:border-[rgba(60,50,40,0.5)]"
                      }`}
                    >
                      {isTaskCompletedStatus(t.status) ? "✓" : ""}
                    </button>
                    <div className="min-w-0">
                      <div className="font-medium">{t.name}</div>
                      {taskDateRangeLine(t.start_date, t.end_date) ? (
                        <p className={`mt-0.5 text-[0.72rem] ${muted}`}>
                          {taskDateRangeLine(t.start_date, t.end_date)}
                        </p>
                      ) : null}
                      {t.description ? (
                        <p
                          className={`mt-1 text-[0.85rem] leading-snug ${muted}`}
                        >
                          {t.description}
                        </p>
                      ) : null}

                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <TaskStatusPill status={t.status} isVrisch={isVrisch} />
                    {canManageTasks ? (
                      <button
                        type="button"
                        className={`text-[0.65rem] uppercase tracking-[0.14em] underline underline-offset-2 ${
                          isVrisch
                            ? "text-[rgba(210,200,185,0.8)]"
                            : "text-[rgba(90,75,55,0.75)]"
                        }`}
                        onClick={() => {
                          setEditingTaskId(t.id);
                          setTaskModalOpen(true);
                        }}
                      >
                        Edit
                      </button>
                    ) : null}
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-[0.75rem] uppercase tracking-[0.2em]">
            Activity
          </h2>
          {showContributorAddUpdate ? (
            <button
              type="button"
              className={`shrink-0 cursor-pointer rounded-full border-2 px-5 py-2 text-[0.62rem] uppercase tracking-[0.18em] transition-all duration-250 ease-in-out hover:scale-[1.02] ${
                isVrisch
                  ? "border-[rgba(200,190,160,0.45)] bg-white/8 text-[rgba(240,235,225,0.92)] hover:border-[rgba(220,210,180,0.6)] hover:bg-white/12"
                  : "border-[rgba(100,85,65,0.4)] bg-white/50 text-[rgba(55,48,38,0.9)] hover:border-[rgba(100,85,65,0.65)] hover:bg-white/80"
              }`}
              onClick={() => setAddUpdateOpen(true)}
            >
              Add update
            </button>
          ) : null}
        </div>
        {showContributorAddUpdate ? (
          <ProjectAddUpdateModal
            open={addUpdateOpen}
            onClose={() => setAddUpdateOpen(false)}
            isVrisch={isVrisch}
            onSave={(payload) => addUpdate(payload)}
          />
        ) : null}
        <div className="relative ms-2 border-s border-dashed pb-2 ps-6 max-md:ms-1 max-md:ps-4">
          {mergedTimeline.length === 0 ? (
            <p className={`text-[0.88rem] ${muted}`}>No activity yet.</p>
          ) : (
            mergedTimeline.map((row) => (
              <div
                key={`${row.kind}-${row.id}`}
                className="relative mb-10 last:mb-0"
              >
                <span
                  className={`absolute -start-[25px] top-1.5 h-2.5 w-2.5 rounded-full border-2 max-md:-start-[21px] ${
                    row.kind === "task"
                      ? isVrisch
                        ? "border-amber-300/60 bg-amber-400/40"
                        : "border-amber-600/50 bg-amber-200"
                      : isVrisch
                      ? "border-sky-300/50 bg-sky-400/35"
                      : "border-sky-500/45 bg-sky-100"
                  }`}
                  aria-hidden
                />
                <div
                  className={`text-[0.68rem] uppercase tracking-[0.14em] ${muted}`}
                >
                  {formatWhen(row.created_at)}
                  <span
                    className={`ms-2 rounded px-1.5 py-0.5 text-[0.6rem] ${
                      isVrisch ? "bg-white/10" : "bg-black/10"
                    }`}
                  >
                    {row.kind === "task" ? "Task" : "Update"}
                  </span>
                </div>
                {row.kind === "task" ? (
                  <div className="mt-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{row.data.name}</span>
                      <TaskStatusPill
                        status={row.data.status}
                        isVrisch={isVrisch}
                      />
                    </div>
                    {taskDateRangeLine(
                      row.data.start_date,
                      row.data.end_date
                    ) ? (
                      <p className={`mt-0.5 text-[0.78rem] ${muted}`}>
                        {taskDateRangeLine(
                          row.data.start_date,
                          row.data.end_date
                        )}
                      </p>
                    ) : null}
                    {row.data.description ? (
                      <p
                        className={`mt-1 text-[0.85rem] leading-relaxed ${muted}`}
                      >
                        {row.data.description}
                      </p>
                    ) : null}
                  </div>
                ) : (
                  <div className="mt-2">
                    <div className="font-medium">{row.data.title}</div>
                    {row.data.description ? (
                      <p
                        className={`mt-1 text-[0.85rem] leading-relaxed ${muted}`}
                      >
                        {row.data.description}
                      </p>
                    ) : null}
                    {row.data.image ? (
                      <img
                        src={row.data.image}
                        alt=""
                        className="mt-2 max-h-48 rounded-xl object-contain"
                      />
                    ) : null}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {isCreator ? (
          <div className="mt-12 space-y-8">
            <h2 className="text-[0.75rem] uppercase tracking-[0.2em]">
              Add to this project
            </h2>

            <form onSubmit={submitUpdate} className={`space-y-3 ${card}`}>
              <h3 className="text-[0.8rem] font-medium">New update</h3>
              <TextInput
                className={
                  isVrisch
                    ? "w-full rounded-[10px] border border-white/10 bg-white/5 px-3 py-2.5 text-[rgba(240,235,225,0.92)]"
                    : "w-full rounded-[10px] border-0 bg-white/90 px-3 py-2.5"
                }
                placeholder="Update title"
                disabled={creatorUpdatePending}
                {...regCreatorUpdate("title", { required: true })}
              />
              <TextArea
                className={
                  isVrisch
                    ? "min-h-[72px] w-full resize-none rounded-[10px] border border-white/10 bg-white/5 px-3 py-2.5 text-[rgba(240,235,225,0.92)]"
                    : "min-h-[72px] w-full resize-none rounded-[10px] border-0 bg-white/90 px-3 py-2.5"
                }
                placeholder="What changed? (optional)"
                disabled={creatorUpdatePending}
                {...regCreatorUpdate("description")}
              />
              <ImageDropzone
                label="Image (optional)"
                file={updFile}
                onChange={setUpdFile}
                isVrisch={isVrisch}
                disabled={creatorUpdatePending}
              />
              <Button
                type="submit"
                disabled={creatorUpdatePending}
                className={
                  isVrisch
                    ? "rounded-full bg-[radial-gradient(circle,#5a6b4a,#3d4a32)] px-5 py-2 text-[0.65rem] uppercase tracking-[0.16em] text-white"
                    : "rounded-full bg-[radial-gradient(circle,#8a7f6d,#6f6456)] px-5 py-2 text-[0.65rem] uppercase tracking-[0.16em] text-white"
                }
              >
                Post update
              </Button>
            </form>
          </div>
        ) : null}

        <div className="mt-10 text-center">
          <Link
            to={`/projects/${realm}`}
            className={`text-[0.72rem] uppercase tracking-[0.16em] underline ${muted}`}
          >
            Return to project field
          </Link>
        </div>
      </div>
    </div>
  );
}
