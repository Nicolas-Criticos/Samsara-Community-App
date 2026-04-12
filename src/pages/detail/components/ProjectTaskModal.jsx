import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
  Button,
  Modal,
  TextArea,
  TextInput,
} from "../../../components/ui/index.js";
import {
  DEFAULT_PROJECT_TASK_STATUS,
  PROJECT_TASK_STATUSES,
} from "../../../lib/projectTaskConstants.js";

function dateInputValue(isoOrDate) {
  if (!isoOrDate) return "";
  const s = String(isoOrDate);
  if (s.length >= 10) return s.slice(0, 10);
  try {
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return "";
    return d.toISOString().slice(0, 10);
  } catch {
    return "";
  }
}

export default function ProjectTaskModal({
  open,
  onClose,
  isVrisch,
  task,
  onSave,
}) {
  const isEdit = Boolean(task);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      name: "",
      description: "",
      startDate: "",
      endDate: "",
      status: DEFAULT_PROJECT_TASK_STATUS,
    },
  });

  useEffect(() => {
    if (!open) {
      reset({
        name: "",
        description: "",
        startDate: "",
        endDate: "",
        status: DEFAULT_PROJECT_TASK_STATUS,
      });
      setSaving(false);
      return;
    }
    if (task) {
      reset({
        name: task.name || "",
        description: task.description || "",
        startDate: dateInputValue(task.start_date),
        endDate: dateInputValue(task.end_date),
        status: PROJECT_TASK_STATUSES.includes(task.status)
          ? task.status
          : DEFAULT_PROJECT_TASK_STATUS,
      });
    } else {
      reset({
        name: "",
        description: "",
        startDate: "",
        endDate: "",
        status: DEFAULT_PROJECT_TASK_STATUS,
      });
    }
  }, [open, task, reset]);

  async function onSubmit(values) {
    const n = values.name.trim();
    if (!n) {
      alert("Task name is required.");
      return;
    }
    setSaving(true);
    const { error } = await onSave({
      name: n,
      description: values.description.trim(),
      start_date: values.startDate.trim() || null,
      end_date: values.endDate.trim() || null,
      status: values.status,
    });
    setSaving(false);
    if (error) {
      alert(error);
      return;
    }
    onClose();
  }

  // Shared input styling — high contrast for both themes
  const inputClass = isVrisch
    ? "w-full rounded-xl border border-white/20 bg-white/8 px-4 py-3 text-[0.88rem] text-[rgba(240,235,225,0.95)] placeholder:text-[rgba(200,195,185,0.45)] focus:border-white/35 focus:outline-none focus:ring-0"
    : "w-full rounded-xl border border-[rgba(100,85,65,0.25)] bg-white px-4 py-3 text-[0.88rem] text-[#2b2b2b] placeholder:text-[rgba(100,90,70,0.4)] focus:border-[rgba(100,85,65,0.5)] focus:outline-none focus:ring-0";

  const labelClass = `mb-1.5 block text-[0.65rem] uppercase tracking-[0.14em] ${
    isVrisch ? "text-[rgba(200,195,185,0.7)]" : "text-[rgba(80,70,60,0.7)]"
  }`;

  const selectClass = isVrisch
    ? "w-full cursor-pointer rounded-xl border border-white/20 bg-[rgba(30,28,25,0.95)] px-4 py-3 text-[0.88rem] text-[rgba(240,235,225,0.95)] focus:outline-none"
    : "w-full cursor-pointer rounded-xl border border-[rgba(100,85,65,0.25)] bg-white px-4 py-3 text-[0.88rem] text-[#2b2b2b] focus:outline-none";

  return (
    <Modal
      open={open}
      onClose={onClose}
      ariaLabel={isEdit ? "Edit task" : "Add task"}
      panelClassName={
        isVrisch
          ? "border border-white/15 bg-[rgba(16,15,13,0.98)] text-[rgba(235,230,220,0.92)] shadow-[0_24px_64px_rgba(0,0,0,0.75)]"
          : "border border-[rgba(100,85,65,0.15)] bg-[rgba(252,249,244,0.99)] text-[#2b2b2b] shadow-[0_24px_64px_rgba(0,0,0,0.12)]"
      }
    >
      <h2
        className={`mb-1 text-[1.1rem] font-normal tracking-wide ${
          isVrisch ? "text-[rgba(240,235,225,0.95)]" : "text-[#2b2b2b]"
        }`}
      >
        {isEdit ? "Edit task" : "Add task"}
      </h2>
      <p
        className={`mb-6 text-[0.78rem] leading-snug ${
          isVrisch
            ? "text-[rgba(200,195,185,0.6)]"
            : "text-[rgba(80,70,55,0.65)]"
        }`}
      >
        {isEdit
          ? "Update details, schedule or status."
          : "Add a checklist item for this project."}
      </p>

      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <div>
          <label className={labelClass} htmlFor="task-name">
            Task name
          </label>
          <input
            id="task-name"
            type="text"
            className={inputClass}
            placeholder="What needs to be done?"
            autoComplete="off"
            disabled={saving}
            {...register("name", { required: true })}
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="task-description">
            Description{" "}
            <span
              className={
                isVrisch ? "text-[rgba(160,155,145,0.6)]" : "text-[rgba(120,110,90,0.5)]"
              }
            >
              (optional)
            </span>
          </label>
          <textarea
            id="task-description"
            className={`${inputClass} min-h-[80px] resize-none`}
            placeholder="More detail about this task…"
            disabled={saving}
            {...register("description")}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="task-start-date">
              Start date
            </label>
            <input
              id="task-start-date"
              type="date"
              className={inputClass}
              disabled={saving}
              {...register("startDate")}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="task-end-date">
              End date
            </label>
            <input
              id="task-end-date"
              type="date"
              className={inputClass}
              disabled={saving}
              {...register("endDate")}
            />
          </div>
        </div>

        <div>
          <label className={labelClass} htmlFor="task-status">
            Status
          </label>
          <select
            id="task-status"
            className={selectClass}
            disabled={saving}
            {...register("status")}
          >
            {PROJECT_TASK_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div
          className={`flex flex-wrap items-center gap-3 border-t pt-4 ${
            isVrisch ? "border-white/10" : "border-[rgba(100,85,65,0.12)]"
          }`}
        >
          <button
            type="submit"
            disabled={saving}
            className={`cursor-pointer rounded-full px-6 py-2.5 text-[0.7rem] uppercase tracking-[0.16em] text-white shadow-none transition-all duration-200 hover:scale-[1.03] disabled:cursor-not-allowed disabled:opacity-50 ${
              isVrisch
                ? "bg-[radial-gradient(circle,#5a6b4a,#3d4a32)]"
                : "bg-[radial-gradient(circle,#8a7f6d,#6f6456)]"
            }`}
          >
            {saving ? "Saving…" : isEdit ? "Save task" : "Add task"}
          </button>
          <button
            type="button"
            className={`cursor-pointer text-[0.72rem] uppercase tracking-[0.14em] underline underline-offset-2 transition-opacity hover:opacity-100 ${
              isVrisch
                ? "text-[rgba(200,195,185,0.65)]"
                : "text-[rgba(100,85,65,0.65)]"
            }`}
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
}
