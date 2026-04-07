import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { cn } from "../../lib/cn.js";
import IconButton from "./IconButton.jsx";

/**
 * Centered dialog: semi-transparent backdrop, fixed size panel, scrollable body.
 * Renders via a portal; backdrop and Escape close when `onClose` / `onOverlayClick` is set.
 */
export default function Modal({
  open,
  onClose,
  onOverlayClick,
  children,
  rootClassName,
  panelClassName,
  dimmed = true,
  showCloseButton = true,
  closeLabel = "Close",
  ariaLabel,
}) {
  const panelRef = useRef(null);
  const dismiss = onClose ?? onOverlayClick;

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") dismiss?.();
    };
    document.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, dismiss]);

  useEffect(() => {
    if (!open || !panelRef.current) return;
    const node = panelRef.current;
    const focusable = node.querySelector(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    (focusable ?? node).focus?.();
  }, [open]);

  if (!open) return null;

  const node = (
    <div
      className={cn(
        "fixed inset-0 z-[100] flex items-center justify-center p-4",
        dimmed && "bg-black/45",
        rootClassName
      )}
      onClick={() => dismiss?.()}
      role="presentation"
    >
      <div
        ref={panelRef}
        className={cn(
          "relative flex h-[min(70vh,calc(100dvh-2rem))] w-[min(500px,calc(100vw-2rem))] max-w-[500px] flex-col overflow-hidden rounded-2xl border border-black/10 bg-[rgba(255,252,248,0.98)] shadow-[0_24px_64px_rgba(0,0,0,0.2)]",
          panelClassName
        )}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        tabIndex={-1}
      >
        {showCloseButton && dismiss ? (
          <IconButton
            icon="close"
            type="button"
            className="absolute right-3 top-3 z-[2] h-9 w-9 shrink-0 rounded-full !bg-white/55 p-0 text-[rgba(60,50,40,0.7)] transition-[transform,background-color] duration-200 ease-out hover:!scale-105 hover:!bg-white/85 [&_svg]:max-h-4 [&_svg]:max-w-4"
            onClick={() => dismiss()}
            aria-label={closeLabel}
          />
        ) : null}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 pb-6 pt-14">
          {children}
        </div>
      </div>
    </div>
  );

  return createPortal(node, document.body);
}
