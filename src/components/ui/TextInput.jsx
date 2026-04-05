import { forwardRef } from "react";
import { cn } from "../../lib/cn.js";
import "./ui.css";

const TextInput = forwardRef(function TextInput(
  { className, type = "text", ...props },
  ref
) {
  return (
    <input
      ref={ref}
      type={type}
      className={cn("ui-text-input", className)}
      {...props}
    />
  );
});

export default TextInput;
