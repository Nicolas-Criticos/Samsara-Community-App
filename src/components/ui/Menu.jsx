import { cn } from "../../lib/cn.js";

export function MenuList({ className, children, ...props }) {
  return (
    <ul className={cn("m-0 list-none p-0", className)} role="menu" {...props}>
      {children}
    </ul>
  );
}

export function MenuItem({ className, children, ...props }) {
  return (
    <li
      className={cn(
        "m-0 p-0 [&_a]:w-full [&_a]:rounded-lg [&_a]:text-inherit [&_button]:w-full [&_button]:rounded-lg [&_button]:text-inherit",
        className
      )}
      role="none"
      {...props}
    >
      {children}
    </li>
  );
}
