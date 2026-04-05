import { forwardRef } from "react";
import { cn } from "../../lib/cn.js";

const TextArea = forwardRef(function TextArea({ className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={cn(
        "box-border font-[family:inherit] disabled:opacity-[0.85]",
        className
      )}
      {...props}
    />
  );
});

export default TextArea;
