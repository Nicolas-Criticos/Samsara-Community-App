import { forwardRef } from "react";
import { cn } from "../../lib/cn.js";
import "./ui.css";

const TextArea = forwardRef(function TextArea({ className, ...props }, ref) {
  return (
    <textarea ref={ref} className={cn("ui-textarea", className)} {...props} />
  );
});

export default TextArea;
