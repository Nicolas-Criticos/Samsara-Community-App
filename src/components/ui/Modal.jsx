import { cn } from "../../lib/cn.js";
import "./ui.css";

/**
 * Generic modal frame: dimmed overlay + centered panel.
 * Pass `rootClassName` / `panelClassName` to merge with page styles (e.g. member-profile).
 */
export default function Modal({
  open,
  onOverlayClick,
  children,
  rootClassName,
  panelClassName,
  dimmed = true,
}) {
  if (!open) return null;

  return (
    <div
      className={cn(
        "ui-modal-root",
        dimmed && "ui-modal-root--dimmed",
        rootClassName
      )}
      onClick={onOverlayClick}
      role="presentation"
    >
      <div
        className={cn("ui-modal-panel", panelClassName)}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {children}
      </div>
    </div>
  );
}
