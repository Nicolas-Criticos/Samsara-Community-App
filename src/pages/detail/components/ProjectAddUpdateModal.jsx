import { useEffect, useState } from "react";
import {
  Button,
  Modal,
  TextArea,
  TextInput,
} from "../../../components/ui/index.js";
import ImageDropzone from "./ImageDropzone.jsx";

/**
 * @param {(payload: { title: string, description: string, file: File|null }) => Promise<{ error?: string }>} onSave
 */
export default function ProjectAddUpdateModal({
  open,
  onClose,
  isVrisch,
  onSave,
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      setTitle("");
      setDescription("");
      setFile(null);
      setSaving(false);
    }
  }, [open]);

  async function handleSubmit(e) {
    e.preventDefault();
    const t = title.trim();
    if (!t) {
      alert("Title is required.");
      return;
    }
    setSaving(true);
    const { error } = await onSave({
      title: t,
      description: description.trim(),
      file,
    });
    setSaving(false);
    if (error) {
      alert(error);
      return;
    }
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      ariaLabel="Add project update"
      panelClassName={
        isVrisch
          ? "border border-white/12 bg-[rgba(18,18,20,0.97)] text-[rgba(235,230,220,0.92)] shadow-[0_24px_64px_rgba(0,0,0,0.65)]"
          : undefined
      }
    >
      <h2 className="mb-1 text-[1.05rem] font-normal tracking-wide">
        Add update
      </h2>
      <p
        className={`mb-5 text-[0.78rem] leading-snug ${
          isVrisch
            ? "text-[rgba(200,195,185,0.65)]"
            : "text-[rgba(60,55,45,0.6)]"
        }`}
      >
        Share progress with everyone following this project.
      </p>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <TextInput
          className={
            isVrisch
              ? "w-full rounded-[10px] border border-white/10 bg-white/5 px-3 py-2.5 text-[rgba(240,235,225,0.92)] placeholder:text-[rgba(200,195,185,0.4)]"
              : "w-full rounded-[10px] border-0 bg-white/90 px-3 py-2.5 text-[#2b2b2b]"
          }
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoComplete="off"
        />
        <TextArea
          className={
            isVrisch
              ? "min-h-[88px] w-full resize-none rounded-[10px] border border-white/10 bg-white/5 px-3 py-2.5 text-[rgba(240,235,225,0.92)] placeholder:text-[rgba(200,195,185,0.4)]"
              : "min-h-[88px] w-full resize-none rounded-[10px] border-0 bg-white/90 px-3 py-2.5 text-[#2b2b2b]"
          }
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <ImageDropzone
          label="Image (optional)"
          file={file}
          onChange={setFile}
          isVrisch={isVrisch}
          disabled={saving}
          previewPlacement="below"
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
            {saving ? "Saving…" : "Post update"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
