import { cn } from "../../lib/cn.js";
import "./ui.css";

function IconPlus({ "aria-hidden": ah = true }) {
  return (
    <svg
      aria-hidden={ah}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function IconClose({ "aria-hidden": ah = true }) {
  return (
    <svg
      aria-hidden={ah}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

const ICONS = {
  plus: IconPlus,
  close: IconClose,
};

/**
 * Icon-only control with centered SVG (avoids full-width “＋” baseline drift).
 * @param {keyof typeof ICONS} icon
 */
export default function IconButton({
  icon,
  className,
  children,
  type = "button",
  ...props
}) {
  const Icon = icon != null ? ICONS[icon] : null;
  const content = Icon ? <Icon /> : children;

  return (
    <button
      type={type}
      className={cn("ui-icon-button", className)}
      {...props}
    >
      <span className="ui-icon-button__graphic">{content}</span>
    </button>
  );
}
