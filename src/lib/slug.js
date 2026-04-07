/**
 * URL-safe slug from a project title (matches first project in realm with this slug).
 */
export function slugifyProjectTitle(title) {
  if (!title || typeof title !== "string") return "";
  return title
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function projectDetailHref(realm, title) {
  const slug = slugifyProjectTitle(title);
  if (!slug) return null;
  const r = realm === "vrischgewagt" ? "vrischgewagt" : "samsara";
  return `/projects/${r}/${slug}`;
}
