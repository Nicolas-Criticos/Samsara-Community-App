/** Join truthy class names (skip `false`, `null`, `undefined`). */
export function cn(...parts) {
  return parts.filter(Boolean).join(" ");
}
