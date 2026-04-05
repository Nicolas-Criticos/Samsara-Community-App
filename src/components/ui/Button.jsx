import { cn } from "../../lib/cn.js";
import "./ui.css";

/**
 * @param {"button"|"submit"|"reset"} type
 * @param {"default"|"link"|"ghost"} variant — `link` matches auth “link-like” controls
 */
export default function Button({
  type = "button",
  variant = "default",
  className,
  fullWidth,
  children,
  ...props
}) {
  return (
    <button
      type={type}
      className={cn(
        variant === "link" && "ui-btn--link",
        fullWidth && "ui-btn--full-width",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
