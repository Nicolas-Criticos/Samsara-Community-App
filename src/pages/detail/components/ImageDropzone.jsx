import { useCallback, useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import { normalizeImageFile } from "../../../lib/normalizeHeicImage.js";

function imageFileValidator(file) {
  const type = (file.type || "").toLowerCase();
  if (type.startsWith("image/")) {
    return null;
  }
  const name = (file.name || "").toLowerCase();
  if (name.endsWith(".heic") || name.endsWith(".heif")) {
    return null;
  }
  return {
    code: "file-invalid-type",
    message: "Only image files are allowed.",
  };
}

/**
 * @param {"inside"|"below"} previewPlacement — `inside`: smaller max height. `below`: larger preview (e.g. modals). Preview always fills the dropzone area.
 */
export default function ImageDropzone({
  file,
  onChange,
  label,
  isVrisch,
  disabled,
  previewPlacement = "inside",
}) {
  const [preview, setPreview] = useState(null);
  const [converting, setConverting] = useState(false);

  const maxPreviewClass =
    previewPlacement === "below" ? "max-h-72" : "max-h-44";

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return undefined;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const onDrop = useCallback(
    async (accepted) => {
      const f = accepted[0];
      if (!f) return;
      setConverting(true);
      try {
        const normalized = await normalizeImageFile(f);
        onChange(normalized);
      } catch (err) {
        console.error(err);
        alert(
          err?.message
            ? `Could not read this image: ${err.message}`
            : "Could not convert this photo. Try JPEG or PNG."
        );
      } finally {
        setConverting(false);
      }
    },
    [onChange]
  );

  const dropDisabled = Boolean(disabled) || converting;

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [
        ".jpeg",
        ".jpg",
        ".png",
        ".gif",
        ".webp",
        ".bmp",
        ".heic",
        ".heif",
      ],
    },
    validator: imageFileValidator,
    maxFiles: 1,
    disabled: dropDisabled,
    noClick: dropDisabled,
    noKeyboard: dropDisabled,
  });

  const surface = isVrisch
    ? "border-white/25 bg-white/5 text-[rgba(220,215,205,0.88)]"
    : "border-[rgba(90,70,50,0.22)] bg-white/70 text-[rgba(43,43,43,0.8)]";

  const hasPreview = Boolean(preview && !converting);

  return (
    <div className="w-full">
      {label ? (
        <div
          className={`mb-1.5 text-[0.68rem] uppercase tracking-[0.14em] ${
            isVrisch
              ? "text-[rgba(200,195,185,0.65)]"
              : "text-[rgba(80,70,60,0.65)]"
          }`}
        >
          {label}
        </div>
      ) : null}
      <div
        {...getRootProps()}
        className={`group relative overflow-hidden rounded-[12px] border border-dashed text-center text-[0.78rem] transition-[box-shadow,opacity] ${surface} ${
          isDragActive ? "ring-2 ring-amber-400/45" : ""
        } ${
          dropDisabled ? "cursor-not-allowed opacity-45" : "cursor-pointer"
        } ${hasPreview ? "px-2 py-2" : "px-4 py-5"}`}
      >
        <input {...getInputProps()} />
        {converting ? (
          <p className="leading-snug">
            <span className="block font-medium">Converting photo…</span>
            <span className="mt-1 block text-[0.72rem] opacity-80">
              HEIC images are converted to JPEG for preview and upload
            </span>
          </p>
        ) : hasPreview ? (
          <>
            <img
              src={preview}
              alt=""
              className={`mx-auto w-full rounded-lg object-contain ${maxPreviewClass}`}
            />
            {file && !disabled ? (
              <button
                type="button"
                aria-label="Remove image"
                className={`absolute right-2 top-2 z-20 flex h-8 w-8 items-center justify-center rounded-full shadow-md backdrop-blur-sm transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/80 ${
                  isVrisch
                    ? "bg-black/50 text-white hover:bg-black/65"
                    : "bg-black/45 text-white hover:bg-black/55"
                } opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onChange(null);
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  width="16"
                  height="16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  aria-hidden
                >
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            ) : null}
            {!dropDisabled ? (
              <p
                className={`pointer-events-none absolute bottom-1.5 left-2 right-2 text-[0.62rem] opacity-0 transition-opacity sm:group-hover:opacity-100 ${
                  isVrisch
                    ? "text-[rgba(220,215,205,0.85)]"
                    : "text-[rgba(45,40,35,0.75)]"
                }`}
              >
                Drop or click to replace
              </p>
            ) : null}
          </>
        ) : (
          <p className="leading-snug">
            Drag and drop an image here, or click to browse
          </p>
        )}
      </div>
    </div>
  );
}
