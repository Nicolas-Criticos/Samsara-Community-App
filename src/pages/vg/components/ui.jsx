import { forwardRef } from "react";

export function Card({ className = "", children, as: As = "div", ...rest }) {
  return (
    <As
      className={`rounded-2xl border border-[rgba(122,112,94,0.2)] bg-[rgba(255,252,247,0.95)] shadow-[0_8px_24px_rgba(0,0,0,0.06)] backdrop-blur ${className}`}
      {...rest}
    >
      {children}
    </As>
  );
}

export function SectionLabel({ children, className = "" }) {
  return (
    <div
      className={`text-[0.62rem] uppercase tracking-[0.18em] text-[rgba(75,71,65,0.55)] ${className}`}
    >
      {children}
    </div>
  );
}

export function Pill({ children, active = false, onClick, className = "" }) {
  const base = "inline-flex items-center gap-1 rounded-full px-3 py-1 text-[0.62rem] uppercase tracking-[0.14em] transition-colors border";
  const styles = active
    ? "border-[rgba(122,112,94,0.4)] bg-[rgba(122,112,94,0.14)] text-[#2b2b2b]"
    : "border-[rgba(122,112,94,0.18)] bg-transparent text-[rgba(75,71,65,0.62)] hover:bg-[rgba(122,112,94,0.07)]";
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${base} ${styles} !p-0 !px-3 !py-1 !bg-transparent !text-inherit !shadow-none !uppercase ${className}`}
        style={{ background: active ? "rgba(122,112,94,0.14)" : "transparent" }}
      >
        <span className="text-[0.62rem] tracking-[0.14em]">{children}</span>
      </button>
    );
  }
  return <span className={`${base} ${styles} ${className}`}>{children}</span>;
}

export const VgButton = forwardRef(function VgButton(
  { variant = "primary", className = "", children, type = "button", ...rest },
  ref
) {
  const styles =
    variant === "primary"
      ? "!bg-[rgba(122,112,94,0.85)] !text-white"
      : variant === "ghost"
      ? "!bg-transparent !text-[#2b2b2b] !shadow-none border border-[rgba(122,112,94,0.3)] hover:!bg-[rgba(122,112,94,0.07)]"
      : variant === "danger"
      ? "!bg-[rgba(168,116,112,0.85)] !text-white"
      : "!bg-[#c2a66d] !text-white";
  return (
    <button
      ref={ref}
      type={type}
      className={`!px-5 !py-[0.6rem] !text-[0.65rem] !tracking-[0.18em] ${styles} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
});

export function TextField({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  step,
  min,
  className = "",
  inputClassName = "",
  ...rest
}) {
  return (
    <label className={`flex flex-col gap-1 ${className}`}>
      {label ? (
        <span className="text-[0.58rem] uppercase tracking-[0.18em] text-[rgba(75,71,65,0.55)]">
          {label}
        </span>
      ) : null}
      <input
        type={type}
        value={value ?? ""}
        onChange={onChange}
        placeholder={placeholder}
        step={step}
        min={min}
        className={`w-full border-0 border-b border-[rgba(122,112,94,0.3)] bg-transparent px-1 py-1.5 text-[0.9rem] text-[#2b2b2b] outline-none focus:border-[rgba(122,112,94,0.7)] ${inputClassName}`}
        {...rest}
      />
    </label>
  );
}

export function SelectField({
  label,
  value,
  onChange,
  options,
  className = "",
  ...rest
}) {
  return (
    <label className={`flex flex-col gap-1 ${className}`}>
      {label ? (
        <span className="text-[0.58rem] uppercase tracking-[0.18em] text-[rgba(75,71,65,0.55)]">
          {label}
        </span>
      ) : null}
      <select
        value={value ?? ""}
        onChange={onChange}
        className="w-full appearance-none border-0 border-b border-[rgba(122,112,94,0.3)] bg-transparent px-1 py-1.5 text-[0.9rem] text-[#2b2b2b] outline-none focus:border-[rgba(122,112,94,0.7)]"
        {...rest}
      >
        {options.map((opt) =>
          typeof opt === "string" ? (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ) : (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          )
        )}
      </select>
    </label>
  );
}

export function TextAreaField({ label, value, onChange, rows = 3, className = "", ...rest }) {
  return (
    <label className={`flex flex-col gap-1 ${className}`}>
      {label ? (
        <span className="text-[0.58rem] uppercase tracking-[0.18em] text-[rgba(75,71,65,0.55)]">
          {label}
        </span>
      ) : null}
      <textarea
        value={value ?? ""}
        onChange={onChange}
        rows={rows}
        className="w-full resize-none rounded-lg border border-[rgba(122,112,94,0.25)] bg-transparent px-3 py-2 text-[0.88rem] text-[#2b2b2b] outline-none focus:border-[rgba(122,112,94,0.55)]"
        {...rest}
      />
    </label>
  );
}

export function Modal({ open, onClose, title, children, maxWidth = "500px" }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative flex max-h-[calc(100dvh-2rem)] w-full flex-col overflow-hidden rounded-2xl border border-[rgba(122,112,94,0.25)] bg-[rgba(255,252,247,0.99)] shadow-[0_24px_64px_rgba(0,0,0,0.18)]"
        style={{ maxWidth }}
        role="dialog"
        aria-modal="true"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-[2] flex h-8 w-8 items-center justify-center rounded-full !bg-white/60 !text-[rgba(60,50,40,0.7)] !p-0 hover:!bg-white/90"
          aria-label="Close"
        >
          <span className="text-[1rem] leading-none">×</span>
        </button>
        <div className="overflow-y-auto px-6 pb-6 pt-12">
          {title ? (
            <h2 className="mb-4 text-[0.8rem] uppercase tracking-[0.18em] text-[#2b2b2b] font-light">
              {title}
            </h2>
          ) : null}
          {children}
        </div>
      </div>
    </div>
  );
}

export function EmptyState({ icon = "🌿", title, hint }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-[rgba(122,112,94,0.25)] bg-[rgba(255,252,247,0.6)] px-6 py-10 text-center">
      <div className="text-[1.6rem] opacity-70">{icon}</div>
      <div className="text-[0.82rem] font-light text-[#2b2b2b]">{title}</div>
      {hint ? (
        <div className="text-[0.7rem] text-[rgba(75,71,65,0.55)]">{hint}</div>
      ) : null}
    </div>
  );
}

export function MonthNav({ year, month, onShift, label }) {
  return (
    <div className="inline-flex items-center gap-3 rounded-full border border-[rgba(122,112,94,0.2)] bg-[rgba(255,252,247,0.7)] px-2 py-1">
      <button
        type="button"
        onClick={() => onShift(-1)}
        className="!bg-transparent !text-[#2b2b2b] !shadow-none !px-2 !py-1 hover:!bg-[rgba(122,112,94,0.08)]"
        aria-label="Previous month"
      >
        ←
      </button>
      <span className="px-2 text-[0.68rem] uppercase tracking-[0.18em] text-[#2b2b2b] min-w-[7.5rem] text-center">
        {label}
      </span>
      <button
        type="button"
        onClick={() => onShift(1)}
        className="!bg-transparent !text-[#2b2b2b] !shadow-none !px-2 !py-1 hover:!bg-[rgba(122,112,94,0.08)]"
        aria-label="Next month"
      >
        →
      </button>
    </div>
  );
}
