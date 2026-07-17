import { NavLink } from "react-router-dom";

const ITEMS = [
  { to: "/vg", end: true, icon: "🏠", label: "Home" },
  { to: "/vg/animals", end: false, icon: "🐑", label: "Animals" },
  { to: "/vg/produce", end: false, icon: "🫒", label: "Produce" },
  { to: "/vg/accommodation", end: false, icon: "🏡", label: "Stay" },
  { to: "/vg/history", end: false, icon: "📊", label: "History" },
  { to: "/vg/inventory", end: false, icon: "🔧", label: "Inventory" },
];

export default function VgBottomNav() {
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 border-t border-[rgba(122,112,94,0.2)] bg-[rgba(255,252,247,0.94)] backdrop-blur pt-2 pb-[calc(0.6rem+env(safe-area-inset-bottom,0px))]">
      <ul className="flex items-stretch justify-around">
        {ITEMS.map((item) => (
          <li key={item.to} className="flex-1">
            <NavLink
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 py-1 text-[0.55rem] uppercase tracking-[0.14em] no-underline ${
                  isActive
                    ? "text-[#2b2b2b]"
                    : "text-[rgba(75,71,65,0.55)]"
                }`
              }
            >
              <span className="text-[1.1rem] leading-none">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
