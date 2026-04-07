export function isHeicLike(file) {
  if (!file) return false;
  const name = (file.name || "").toLowerCase();
  const type = (file.type || "").toLowerCase();
  return (
    name.endsWith(".heic") ||
    name.endsWith(".heif") ||
    type === "image/heic" ||
    type === "image/heif" ||
    type === "image/heif-sequence"
  );
}

/**
 * Converts HEIC/HEIF to a JPEG `File` for preview and upload.
 * Other types are returned unchanged.
 */
export async function normalizeImageFile(file) {
  if (!isHeicLike(file)) {
    return file;
  }

  const { default: heic2any } = await import("heic2any");

  const result = await heic2any({
    blob: file,
    toType: "image/jpeg",
    quality: 0.92,
  });

  const blob = Array.isArray(result) ? result[0] : result;
  const base = file.name.replace(/\.(heic|heif)$/i, "").trim() || "image";
  return new File([blob], `${base}.jpg`, {
    type: "image/jpeg",
    lastModified: Date.now(),
  });
}
