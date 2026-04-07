import { cn } from "../../lib/cn.js";

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
      className={cn(
        "inline-flex items-center justify-center border-0 bg-transparent p-0 font-sans normal-case tracking-normal text-inherit shadow-none outline-none transition-transform hover:scale-100! hover:shadow-none! active:scale-100! disabled:cursor-not-allowed disabled:opacity-45",
        className
      )}
      {...props}
    >
      <span className="flex h-full w-full items-center justify-center leading-none [&_svg]:block [&_svg]:h-[55%] [&_svg]:w-[55%] [&_svg]:max-h-7 [&_svg]:max-w-7 [&_svg]:shrink-0">
        {content}
      </span>
    </button>
  );
}
