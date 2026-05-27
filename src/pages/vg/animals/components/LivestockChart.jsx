import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, SectionLabel } from "../../components/ui.jsx";
import {
  ANIMAL_CATEGORY_LABELS,
  CHART_PALETTE,
} from "../../../../lib/vg/constants.js";
import { shortMonthLabel } from "../../../../lib/vg/helpers.js";

export default function LivestockChart({ history, categories, months }) {
  const data = months.map(({ year, month }) => {
    const point = { name: shortMonthLabel(year, month) };
    categories.forEach((cat) => {
      const row = (history || []).find(
        (r) => r.year === year && r.month === month && r.category === cat
      );
      point[ANIMAL_CATEGORY_LABELS[cat] || cat] = row?.closing_count ?? null;
    });
    return point;
  });

  return (
    <Card className="px-5 py-5">
      <div className="flex items-center justify-between mb-4">
        <SectionLabel>Closing counts · last 12 months</SectionLabel>
      </div>
      <div className="h-[240px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(122,112,94,0.18)" />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: "rgba(75,71,65,0.7)" }} />
            <YAxis tick={{ fontSize: 10, fill: "rgba(75,71,65,0.7)" }} allowDecimals={false} />
            <Tooltip
              contentStyle={{
                background: "rgba(255,252,247,0.97)",
                border: "1px solid rgba(122,112,94,0.25)",
                borderRadius: 10,
                fontSize: 12,
              }}
            />
            <Legend wrapperStyle={{ fontSize: 11, color: "#2b2b2b" }} />
            {categories.map((cat, i) => (
              <Line
                key={cat}
                type="monotone"
                dataKey={ANIMAL_CATEGORY_LABELS[cat] || cat}
                stroke={CHART_PALETTE[i % CHART_PALETTE.length]}
                strokeWidth={2}
                dot={{ r: 3 }}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
