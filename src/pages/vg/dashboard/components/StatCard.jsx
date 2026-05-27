import { Card } from "../../components/ui.jsx";

export default function StatCard({ label, value, sublabel, accent = "#c2a66d" }) {
  return (
    <Card className="flex flex-col gap-2 px-5 py-4">
      <div className="text-[0.6rem] uppercase tracking-[0.18em] text-[rgba(75,71,65,0.55)]">
        {label}
      </div>
      <div
        className="text-[1.5rem] font-light tracking-[0.02em]"
        style={{ color: "#2b2b2b" }}
      >
        {value}
      </div>
      {sublabel ? (
        <div
          className="text-[0.68rem] tracking-[0.05em]"
          style={{ color: accent }}
        >
          {sublabel}
        </div>
      ) : null}
    </Card>
  );
}
