import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import vgLogoUrl from '../../../assets/images/vg-logo.png';
import { useCurrentMember } from '../hooks/useCurrentMember.js';

const NAV_ITEMS = [
  { to: '/vg', label: 'Dashboard', icon: '⊞', exact: true },
  { to: '/projects/vrischgewagt', label: 'Projects', icon: '◈', external: true },
  { to: '/vg/animals', label: 'Animals', icon: '🐑' },
  { to: '/vg/produce', label: 'Produce', icon: '🫒' },
  { to: '/vg/accommodation', label: 'Rooms', icon: '🏡' },
  { to: '/vg/history', label: 'History', icon: '📊' },
];

const BOTTOM_NAV = [
  { to: '/vg', label: 'Dashboard', icon: '⊞', exact: true },
  { to: '/vg/animals', label: 'Animals', icon: '🐑' },
  { to: '/vg/produce', label: 'Produce', icon: '🫒' },
  { to: '/vg/accommodation', label: 'Rooms', icon: '🏡' },
  { to: '/vg/history', label: 'History', icon: '📊' },
];

function SidebarLink({ item }) {
  if (item.external) {
    return (
      <a
        href={item.to}
        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[0.72rem] uppercase tracking-[0.12em] text-[rgba(75,71,65,0.6)] no-underline transition-all hover:bg-[rgba(122,112,94,0.1)] hover:text-[rgba(43,43,43,0.9)]"
      >
        <span className="text-base leading-none w-5 text-center">{item.icon}</span>
        {item.label}
      </a>
    );
  }
  return (
    <NavLink
      to={item.to}
      end={item.exact}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-xl px-3 py-2.5 text-[0.72rem] uppercase tracking-[0.12em] no-underline transition-all ${
          isActive
            ? 'bg-[rgba(122,112,94,0.15)] text-[rgba(43,43,43,0.9)] font-semibold'
            : 'text-[rgba(75,71,65,0.6)] hover:bg-[rgba(122,112,94,0.08)] hover:text-[rgba(43,43,43,0.8)]'
        }`
      }
    >
      <span className="text-base leading-none w-5 text-center">{item.icon}</span>
      {item.label}
    </NavLink>
  );
}

export default function VgLayout() {
  const navigate = useNavigate();
  const { data: member } = useCurrentMember();
  const initial = (member?.name || member?.username || '?').charAt(0).toUpperCase();

  return (
    <div className="flex min-h-screen bg-[#f6f3ee]">
      {/* ── Desktop Sidebar ── */}
      <aside className="hidden md:flex flex-col w-52 shrink-0 border-r border-[rgba(122,112,94,0.18)] bg-[rgba(255,252,247,0.9)] backdrop-blur-sm fixed inset-y-0 left-0 z-20">
        {/* Logo */}
        <div className="flex flex-col items-center gap-2 py-8 px-4 border-b border-[rgba(122,112,94,0.12)]">
          <img src={vgLogoUrl} alt="VrischGewagt" className="w-16 h-16 object-contain opacity-85" />
          <p className="text-[0.58rem] uppercase tracking-[0.2em] text-[rgba(75,71,65,0.5)]">Farm Manager</p>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-1 p-3 flex-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => (
            <SidebarLink key={item.to} item={item} />
          ))}
        </nav>

        {/* Bottom: user + back */}
        <div className="p-3 border-t border-[rgba(122,112,94,0.12)] flex flex-col gap-1">
          <NavLink
            to="/circle"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[0.68rem] uppercase tracking-[0.12em] text-[rgba(75,71,65,0.5)] no-underline hover:text-[rgba(43,43,43,0.7)] transition-all"
          >
            <span className="text-sm">←</span> Circle
          </NavLink>
          <div className="flex items-center gap-2 px-3 py-2">
            <div className="w-7 h-7 rounded-full bg-[rgba(122,112,94,0.2)] flex items-center justify-center text-[0.7rem] font-semibold text-[rgba(43,43,43,0.7)]">
              {initial}
            </div>
            <span className="text-[0.65rem] text-[rgba(75,71,65,0.6)] truncate">
              {member?.username || member?.name || ''}
            </span>
          </div>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="flex-1 min-h-screen md:ml-52 pb-20 md:pb-6">
        <Outlet />
      </main>

      {/* ── Mobile Bottom Nav ── */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-20 flex items-center justify-around border-t border-[rgba(122,112,94,0.15)] bg-[rgba(255,252,247,0.96)] backdrop-blur-sm pb-safe">
        {BOTTOM_NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.exact}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 py-2.5 px-3 text-center transition-all ${
                isActive ? 'text-[rgba(43,43,43,0.9)]' : 'text-[rgba(75,71,65,0.5)]'
              }`
            }
          >
            <span className="text-lg leading-none">{item.icon}</span>
            <span className="text-[0.52rem] uppercase tracking-[0.1em]">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
