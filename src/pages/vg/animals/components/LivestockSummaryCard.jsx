import { Card, SectionLabel } from "../../components/ui.jsx";
import {
  ANIMAL_CATEGORY_LABELS,
  ANIMAL_CATEGORY_ICONS,
} from "../../../../lib/vg/constants.js";

function Row({ label, value, sign }) {
  return (
    <div className="flex items-center justify-between text-[0.78rem]">
      <span className="text-[rgba(75,71,65,0.65)]">{label}</span>
      <span className="text-[#2b2b2b]">
        {sign === "+" ? "+" : sign === "-" ? "−" : ""}
        {value || 0}
      </span>
    </div>
  );
}

export default function LivestockSummaryCard({ category, row, onEdit }) {
  const closing = row?.closing_count ?? row
    ? Number(row?.opening_count || 0) +
      Number(row?.births || 0) +
      Number(row?.purchased || 0) -
      Number(row?.deaths || 0) -
      Number(row?.slaughtered || 0) -
      Number(row?.sold || 0)
    : 0;

  return (
    <Card
      as="button"
      className="!bg-[rgba(255,252,247,0.95)] !text-left flex flex-col gap-3 !p-5 !uppercase-none w-full !rounded-2xl hover:scale-[1.005] transition-transform !tracking-normal !shadow-[0_6px_18px_rgba(0,0,0,0.06)]"
      onClick={onEdit}
      style={{ textTransform: "none" }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[1.2rem]">{ANIMAL_CATEGORY_ICONS[category]}</span>
          <span className="text-[0.86rem] tracking-[0.04em] text-[#2b2b2b] font-light">
            {ANIMAL_CATEGORY_LABELS[category] || category}
          </span>
        </div>
        <SectionLabel className="!normal-case">Tap to edit</SectionLabel>
      </div>

      <div className="flex flex-col gap-1.5">
        <Row label="Opening" value={row?.opening_count} />
        <Row label="Births" value={row?.births} sign="+" />
        <Row label="Purchased" value={row?.purchased} sign="+" />
        <Row label="Deaths" value={row?.deaths} sign="-" />
        <Row label="Slaughter" value={row?.slaughtered} sign="-" />
        <Row label="Sold" value={row?.sold} sign="-" />
      </div>

      <div className="flex items-center justify-between border-t border-[rgba(122,112,94,0.18)] pt-3">
        <span className="text-[0.62rem] uppercase tracking-[0.18em] text-[rgba(75,71,65,0.55)]">Closing</span>
        <span className="text-[1.4rem] font-light text-[#2b2b2b]">{closing}</span>
      </div>
    </Card>
  );
}
