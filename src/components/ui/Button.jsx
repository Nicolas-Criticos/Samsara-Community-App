import { cn } from "../../lib/cn.js";

/**
 * @param {"button"|"submit"|"reset"} type
 * @param {"default"|"link"} variant — `default` uses global `button` base styles in `index.css`; `link` matches auth link-like controls
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
        variant === "link" &&
          "mt-0 w-auto border-0 bg-transparent p-0 font-sans normal-case tracking-normal text-[#8a7f6d] underline shadow-none hover:scale-100! hover:shadow-none!",
        fullWidth && "w-full",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
