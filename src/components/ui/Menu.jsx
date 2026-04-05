import { cn } from "../../lib/cn.js";
import "./ui.css";

export function MenuList({ className, children, ...props }) {
  return (
    <ul className={cn("ui-menu-list", className)} role="menu" {...props}>
      {children}
    </ul>
  );
}

export function MenuItem({ className, children, ...props }) {
  return (
    <li className={cn("ui-menu-item", className)} role="none" {...props}>
      {children}
    </li>
  );
}
