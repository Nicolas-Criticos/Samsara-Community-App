import { forwardRef } from "react";
import { cn } from "../../lib/cn.js";

const TextInput = forwardRef(function TextInput(
  { className, type = "text", ...props },
  ref
) {
  return (
    <input
      ref={ref}
      type={type}
      className={cn(
        "box-border font-[family:inherit] disabled:opacity-[0.85]",
        className
      )}
      {...props}
    />
  );
});

export default TextInput;
