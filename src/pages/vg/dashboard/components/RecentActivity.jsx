import { Card, SectionLabel, EmptyState } from "../../components/ui.jsx";
import { formatDate, formatCurrency } from "../../../../lib/vg/helpers.js";

export default function RecentActivity({ items, hideAmounts = false }) {
  return (
    <Card className="px-5 py-5">
      <div className="flex items-center justify-between mb-3">
        <SectionLabel>Recent activity</SectionLabel>
      </div>
      {items.length === 0 ? (
        <EmptyState icon="🪶" title="No activity yet" hint="Log a sale, booking or animal entry to see history here." />
      ) : (
        <ul className="flex flex-col">
          {items.map((it, idx) => (
            <li
              key={it.key}
              className={`flex items-start gap-3 py-2.5 ${
                idx !== items.length - 1 ? "border-b border-[rgba(122,112,94,0.12)]" : ""
              }`}
            >
              <span className="text-[1rem] mt-0.5 opacity-80">{it.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="text-[0.78rem] text-[#2b2b2b] truncate">{it.title}</div>
                <div className="text-[0.62rem] text-[rgba(75,71,65,0.55)] uppercase tracking-[0.12em]">
                  {formatDate(it.date)}{it.sub ? ` · ${it.sub}` : ""}
                </div>
              </div>
              {!hideAmounts && it.amount != null ? (
                <div className="text-[0.78rem] text-[#2b2b2b] font-light shrink-0">
                  {formatCurrency(it.amount)}
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
