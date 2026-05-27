import { NavLink } from "react-router-dom";
import vgLogoUrl from "../../../assets/images/vg-logo.png";

const NAV_ITEMS = [
  { to: "/vg", end: true, icon: "🏠", label: "Dashboard" },
  { to: "/projects/vrischgewagt", end: false, icon: "📋", label: "Projects", external: true },
  { to: "/vg/animals", end: false, icon: "🐑", label: "Animals" },
  { to: "/vg/produce", end: false, icon: "🫒", label: "Produce" },
  { to: "/vg/accommodation", end: false, icon: "🏡", label: "Accommodation" },
  { to: "/vg/history", end: false, icon: "📊", label: "History" },
];

export default function VgSidebar() {
  return (
    <aside className="hidden md:flex w-[220px] shrink-0 flex-col gap-6 border-r border-[rgba(122,112,94,0.18)] bg-[rgba(255,252,247,0.6)] backdrop-blur px-5 py-6 fixed inset-y-0 left-0 z-30">
      <div className="flex items-center gap-3">
        <img
          src={vgLogoUrl}
          alt="VrischGewagt"
          className="h-10 w-10 rounded-full object-cover opacity-90"
        />
        <div className="leading-tight">
          <div className="text-[0.62rem] uppercase tracking-[0.18em] text-[rgba(75,71,65,0.55)]">
            VrischGewagt
          </div>
          <div className="text-[0.95rem] font-light tracking-[0.04em] text-[#2b2b2b]">
            Farm Manager
          </div>
        </div>
      </div>

      <nav className="flex flex-col gap-1 mt-2">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2 text-[0.82rem] tracking-[0.04em] transition-colors no-underline ${
                isActive
                  ? "bg-[rgba(122,112,94,0.14)] text-[#2b2b2b]"
                  : "text-[rgba(75,71,65,0.78)] hover:bg-[rgba(122,112,94,0.07)] hover:text-[#2b2b2b]"
              }`
            }
          >
            <span className="text-[1rem] leading-none">{item.icon}</span>
            <span className="font-light">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto">
        <NavLink
          to="/circle"
          className="flex items-center gap-2 rounded-xl px-3 py-2 text-[0.65rem] uppercase tracking-[0.18em] text-[rgba(75,71,65,0.55)] hover:text-[#2b2b2b] no-underline"
        >
          <span>←</span>
          <span>Back to Circle</span>
        </NavLink>
      </div>
    </aside>
  );
}
