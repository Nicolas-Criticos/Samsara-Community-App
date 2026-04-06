import { useEffect, useRef, useState } from "react";
import { Button, TextArea, TextInput } from "../../../components/ui/index.js";

/**
 * Edit project fields (creators see status; contributors see the rest including image).
 */
export default function ProjectEditModal({
  isVrisch,
  isCreator,
  open,
  project,
  onClose,
  onSave,
}) {
  const imageFileRef = useRef(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [timeline, setTimeline] = useState("");
  const [status, setStatus] = useState("open");
  const [cny, setCny] = useState(false);
  const [inspiration, setInspiration] = useState("");
  const [rolesNeeded, setRolesNeeded] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !project) return;
    setTitle(project.title || "");
    setDescription(project.description || "");
    setTimeline(project.timeline || "");
    setStatus(project.status || "open");
    setCny(Boolean(project.chinese_new_year));
    setInspiration(project.inspiration_link || "");
    setRolesNeeded(project.roles_needed || "");
    if (imageFileRef.current) imageFileRef.current.value = "";
  }, [open, project]);

  if (!open || !project) return null;

  async function handleSubmit() {
    const t = title.trim();
    const d = description.trim();
    if (!t || !d) {
      alert("Title and description are required.");
      return;
    }
    setSaving(true);
    const file =
      imageFileRef.current?.files?.length > 0
        ? imageFileRef.current.files[0]
        : null;
    const { error } = await onSave({
      title: t,
      description: d,
      timeline: timeline.trim(),
      status: isCreator ? status : project.status,
      imageFile: file,
      inspiration_link: inspiration.trim(),
      chinese_new_year: cny,
      roles_needed: rolesNeeded.trim(),
    });
    setSaving(false);
    if (error) {
      alert(error);
      return;
    }
    onClose();
  }

  return (
    <div
      className={`fixed inset-0 z-12 flex items-center justify-center p-4 ${
        isVrisch ? "bg-black/80" : "bg-[rgba(246,243,238,0.92)]"
      }`}
      role="presentation"
      onClick={onClose}
    >
      <div
        className={`flex max-h-[min(88dvh,640px)] w-[min(92vw,520px)] flex-col gap-3 overflow-y-auto rounded-[28px] px-8 py-10 text-center max-md:px-6 max-md:py-8 ${
          isVrisch
            ? "bg-[radial-gradient(circle_at_center,rgba(26,26,26,0.96),rgba(10,10,10,0.94))] text-[rgba(235,230,220,0.92)] shadow-[0_0_55px_rgba(0,0,0,0.9),inset_0_0_28px_rgba(255,255,255,0.035)]"
            : "bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.98),rgba(235,230,220,0.9))]"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Edit project"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-[1.05rem] font-normal tracking-wide">
          Edit project
        </h3>

        <TextInput
          className={`w-full rounded-[10px] p-2.5 ${
            isVrisch
              ? "border border-white/10 bg-white/5 text-[rgba(240,235,225,0.9)] placeholder:text-[rgba(200,195,185,0.45)]"
              : "border-0 bg-white/90 text-[#2b2b2b]"
          }`}
          placeholder={isVrisch ? "Project name" : "Name of offering"}
          autoComplete="off"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <TextArea
          className={`w-full resize-none rounded-[10px] p-2.5 ${
            isVrisch
              ? "border border-white/10 bg-white/5 text-[rgba(240,235,225,0.9)] placeholder:text-[rgba(200,195,185,0.45)]"
              : "border-0 bg-white/90 text-[#2b2b2b]"
          }`}
          placeholder={isVrisch ? "Project description" : "Description"}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <TextArea
          className={`w-full resize-none rounded-[10px] p-2.5 ${
            isVrisch
              ? "border border-white/10 bg-white/5 text-[rgba(240,235,225,0.9)] placeholder:text-[rgba(200,195,185,0.45)]"
              : "border-0 bg-white/90 text-[#2b2b2b]"
          }`}
          placeholder={isVrisch ? "Timeline / rhythm" : "Timespan / rhythm"}
          value={timeline}
          onChange={(e) => setTimeline(e.target.value)}
        />

        <TextInput
          className={`w-full rounded-[10px] p-2.5 ${
            isVrisch
              ? "border border-white/10 bg-white/5 text-[rgba(240,235,225,0.9)] placeholder:text-[rgba(200,195,185,0.45)]"
              : "border-0 bg-white/90 text-[#2b2b2b]"
          }`}
          placeholder="Roles needed (optional)"
          autoComplete="off"
          value={rolesNeeded}
          onChange={(e) => setRolesNeeded(e.target.value)}
        />

        <div className="text-left">
          <label
            className={`text-[0.68rem] uppercase tracking-[0.12em] ${
              isVrisch ? "text-[rgba(200,195,185,0.75)]" : "text-[rgba(43,43,43,0.55)]"
            }`}
            htmlFor="edit-project-image"
          >
            Project image
          </label>
          <input
            ref={imageFileRef}
            id="edit-project-image"
            type="file"
            className={`mt-1 w-full text-[0.75rem] ${
              isVrisch
                ? "text-[rgba(220,215,205,0.75)]"
                : "text-[rgba(43,43,43,0.7)]"
            }`}
            accept="image/*"
          />
          <p
            className={`mt-1 text-[0.65rem] ${
              isVrisch ? "text-[rgba(180,175,165,0.65)]" : "text-[rgba(43,43,43,0.5)]"
            }`}
          >
            Leave empty to keep the current image.
          </p>
        </div>

        {isCreator ? (
          <div
            className={`flex flex-col gap-2 text-left text-[0.72rem] ${
              isVrisch
                ? "text-[rgba(225,220,210,0.85)]"
                : "text-[rgba(43,43,43,0.75)]"
            }`}
          >
            <span className="text-[0.65rem] uppercase tracking-[0.12em] opacity-80">
              Contribution mode
            </span>
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name="editProjectStatus"
                checked={status === "open"}
                onChange={() => setStatus("open")}
              />
              🟢 Open contribution
            </label>
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name="editProjectStatus"
                checked={status === "application"}
                onChange={() => setStatus("application")}
              />
              🟠 By application
            </label>
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name="editProjectStatus"
                checked={status === "closed"}
                onChange={() => setStatus("closed")}
              />
              🔴 Closed
            </label>
          </div>
        ) : null}

        {!isVrisch ? (
          <>
            <label className="flex cursor-pointer items-center justify-center gap-2 text-[0.72rem]">
              <input
                type="checkbox"
                className="mr-0.5"
                checked={cny}
                onChange={(e) => setCny(e.target.checked)}
              />
              🧧 Chinese New Year
            </label>
            <div className="mt-1 text-left">
              <label
                className="text-[11px] uppercase tracking-wide text-[rgba(42,40,40,0.5)]"
                htmlFor="edit_inspiration_link"
              >
                Vision Board
              </label>
              <TextInput
                type="url"
                id="edit_inspiration_link"
                name="edit_inspiration_link"
                className="mt-1 h-8 w-full rounded-md border border-dashed border-[rgba(143,139,106,0.35)] bg-[rgba(255,255,255,0.04)] px-2 py-1 text-[13px] text-[#2b2a2a] placeholder:text-[rgba(5,4,4,0.35)] focus:border-solid focus:border-[rgba(143,139,106,0.6)] focus:opacity-100 focus:outline-none"
                placeholder="Pinterest, Figma, Drive…"
                value={inspiration}
                onChange={(e) => setInspiration(e.target.value)}
              />
            </div>
          </>
        ) : null}

        <div className="mt-2 flex flex-col gap-2">
          <Button
            type="button"
            disabled={saving}
            className={`w-full cursor-pointer rounded-full border-0 px-5 py-2.5 text-[0.62rem] uppercase tracking-[0.18em] text-white shadow-none transition-all duration-250 ease-in-out hover:scale-105 hover:shadow-[0_0_14px_rgba(140,120,80,0.45)] disabled:cursor-not-allowed disabled:opacity-50 ${
              isVrisch
                ? "bg-[radial-gradient(circle,#7f8f6a,#4e5c3f)]"
                : "bg-[radial-gradient(circle,#8a7f6d,#6f6456)]"
            }`}
            fullWidth
            onClick={handleSubmit}
          >
            {saving ? "Saving…" : "Save changes"}
          </Button>
          <Button
            type="button"
            fullWidth
            disabled={saving}
            onClick={onClose}
            className={
              isVrisch
                ? "w-full border border-white/15 bg-transparent text-[rgba(220,215,205,0.6)] shadow-none hover:scale-100"
                : undefined
            }
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
