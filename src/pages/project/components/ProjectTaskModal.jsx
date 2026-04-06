import { useEffect, useState } from "react";
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
import ImageDropzone from "./ImageDropzone.jsx";

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

/**
 * @param {object|null} task — null = create, else edit existing row
 * @param {(payload: object) => Promise<{ error?: string }>} onSave
 */
export default function ProjectTaskModal({
  open,
  onClose,
  isVrisch,
  task,
  onSave,
}) {
  const isEdit = Boolean(task);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] = useState(DEFAULT_PROJECT_TASK_STATUS);
  const [file, setFile] = useState(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      setName("");
      setDescription("");
      setStartDate("");
      setEndDate("");
      setStatus(DEFAULT_PROJECT_TASK_STATUS);
      setFile(null);
      setRemoveImage(false);
      setSaving(false);
      return;
    }
    if (task) {
      setName(task.name || "");
      setDescription(task.description || "");
      setStartDate(dateInputValue(task.start_date));
      setEndDate(dateInputValue(task.end_date));
      setStatus(
        PROJECT_TASK_STATUSES.includes(task.status)
          ? task.status
          : DEFAULT_PROJECT_TASK_STATUS
      );
      setFile(null);
      setRemoveImage(false);
    } else {
      setName("");
      setDescription("");
      setStartDate("");
      setEndDate("");
      setStatus(DEFAULT_PROJECT_TASK_STATUS);
      setFile(null);
      setRemoveImage(false);
    }
  }, [open, task]);

  async function handleSubmit(e) {
    e.preventDefault();
    const n = name.trim();
    if (!n) {
      alert("Task name is required.");
      return;
    }
    setSaving(true);
    const { error } = await onSave({
      name: n,
      description: description.trim(),
      start_date: startDate.trim() || null,
      end_date: endDate.trim() || null,
      status,
      file,
      removeImage: isEdit ? removeImage : false,
    });
    setSaving(false);
    if (error) {
      alert(error);
      return;
    }
    onClose();
  }

  const showExistingImage = isEdit && task?.image && !file && !removeImage;

  const dateFieldClass = isVrisch
    ? "w-full rounded-[10px] border border-white/10 bg-white/5 px-3 py-2.5 text-[rgba(240,235,225,0.92)]"
    : "w-full rounded-[10px] border-0 bg-white/90 px-3 py-2.5 text-[#2b2b2b]";

  const selectClass = isVrisch
    ? "w-full cursor-pointer rounded-[10px] border border-white/10 bg-white/5 px-3 py-2.5 text-[0.8rem] text-[rgba(240,235,225,0.92)]"
    : "w-full cursor-pointer rounded-[10px] border-0 bg-white/90 px-3 py-2.5 text-[0.8rem] text-[#2b2b2b]";

  return (
    <Modal
      open={open}
      onClose={onClose}
      ariaLabel={isEdit ? "Edit task" : "Add task"}
      panelClassName={
        isVrisch
          ? "border border-white/12 bg-[rgba(18,18,20,0.97)] text-[rgba(235,230,220,0.92)] shadow-[0_24px_64px_rgba(0,0,0,0.65)]"
          : undefined
      }
    >
      <h2 className="mb-1 text-[1.05rem] font-normal tracking-wide">
        {isEdit ? "Edit task" : "Add task"}
      </h2>
      <p
        className={`mb-5 text-[0.78rem] leading-snug ${
          isVrisch
            ? "text-[rgba(200,195,185,0.65)]"
            : "text-[rgba(60,55,45,0.6)]"
        }`}
      >
        {isEdit
          ? "Update details, schedule, status, or image."
          : "Add a checklist item for this project."}
      </p>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <TextInput
          className={
            isVrisch
              ? "w-full rounded-[10px] border border-white/10 bg-white/5 px-3 py-2.5 text-[rgba(240,235,225,0.92)] placeholder:text-[rgba(200,195,185,0.4)]"
              : "w-full rounded-[10px] border-0 bg-white/90 px-3 py-2.5 text-[#2b2b2b]"
          }
          placeholder="Task name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="off"
        />
        <TextArea
          className={
            isVrisch
              ? "min-h-[72px] w-full resize-none rounded-[10px] border border-white/10 bg-white/5 px-3 py-2.5 text-[rgba(240,235,225,0.92)] placeholder:text-[rgba(200,195,185,0.4)]"
              : "min-h-[72px] w-full resize-none rounded-[10px] border-0 bg-white/90 px-3 py-2.5 text-[#2b2b2b]"
          }
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label
              className={`mb-1 block text-[0.65rem] uppercase tracking-[0.14em] ${
                isVrisch
                  ? "text-[rgba(200,195,185,0.65)]"
                  : "text-[rgba(80,70,60,0.65)]"
              }`}
              htmlFor="task-start-date"
            >
              Start date
            </label>
            <input
              id="task-start-date"
              type="date"
              className={dateFieldClass}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <label
              className={`mb-1 block text-[0.65rem] uppercase tracking-[0.14em] ${
                isVrisch
                  ? "text-[rgba(200,195,185,0.65)]"
                  : "text-[rgba(80,70,60,0.65)]"
              }`}
              htmlFor="task-end-date"
            >
              End date
            </label>
            <input
              id="task-end-date"
              type="date"
              className={dateFieldClass}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label
            className={`mb-1 block text-[0.65rem] uppercase tracking-[0.14em] ${
              isVrisch
                ? "text-[rgba(200,195,185,0.65)]"
                : "text-[rgba(80,70,60,0.65)]"
            }`}
            htmlFor="task-status"
          >
            Status
          </label>
          <select
            id="task-status"
            className={selectClass}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            {PROJECT_TASK_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {showExistingImage ? (
          <div>
            <div
              className={`mb-1 text-[0.65rem] uppercase tracking-[0.14em] ${
                isVrisch
                  ? "text-[rgba(200,195,185,0.65)]"
                  : "text-[rgba(80,70,60,0.65)]"
              }`}
            >
              Current image
            </div>
            <img
              src={task.image}
              alt=""
              className="max-h-36 rounded-lg object-contain"
            />
            <button
              type="button"
              className={`mt-2 text-[0.72rem] underline ${
                isVrisch
                  ? "text-[rgba(230,200,180,0.85)]"
                  : "text-[rgba(100,75,55,0.85)]"
              }`}
              onClick={() => {
                setRemoveImage(true);
                setFile(null);
              }}
            >
              Remove image
            </button>
          </div>
        ) : null}

        <ImageDropzone
          label={
            isEdit
              ? file || !task?.image || removeImage
                ? "Image (optional)"
                : "Replace image (optional)"
              : "Image (optional)"
          }
          file={file}
          onChange={(f) => {
            setFile(f);
            if (f) setRemoveImage(false);
          }}
          isVrisch={isVrisch}
          disabled={saving}
        />

        <div className="flex flex-wrap gap-3 pt-2">
          <Button
            type="button"
            variant="link"
            className={
              isVrisch
                ? "text-[rgba(210,200,185,0.8)]"
                : "text-[rgba(90,75,55,0.75)]"
            }
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </Button>
          <button
            type="submit"
            disabled={saving}
            className={
              isVrisch
                ? "cursor-pointer rounded-full border-0 bg-[radial-gradient(circle,#5a6b4a,#3d4a32)] px-5 py-2 text-[0.62rem] uppercase tracking-[0.16em] text-white shadow-none transition-all duration-250 ease-in-out hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50"
                : "cursor-pointer rounded-full border-0 bg-[radial-gradient(circle,#8a7f6d,#6f6456)] px-5 py-2 text-[0.62rem] uppercase tracking-[0.16em] text-white shadow-none transition-all duration-250 ease-in-out hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50"
            }
          >
            {saving ? "Saving…" : isEdit ? "Save task" : "Add task"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
