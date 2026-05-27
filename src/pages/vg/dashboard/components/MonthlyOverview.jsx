import { useMemo } from "react";
import {
  AreaChart,
  Area,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, SectionLabel } from "../../components/ui.jsx";
import { CHART_COLORS } from "../../../../lib/vg/constants.js";
import { formatCurrency, shortMonthLabel } from "../../../../lib/vg/helpers.js";

export default function MonthlyOverview({ data }) {
  const chartData = useMemo(
    () =>
      data.map((d) => ({
        name: shortMonthLabel(d.year, d.month),
        Revenue: d.revenue,
        Costs: d.costs,
        Profit: d.revenue - d.costs,
      })),
    [data]
  );

  return (
    <Card className="px-5 py-5">
      <div className="flex items-center justify-between mb-4">
        <SectionLabel>Last 12 months</SectionLabel>
      </div>
      <div className="h-[260px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
            <defs>
              <linearGradient id="grRev" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={CHART_COLORS.gold} stopOpacity={0.45} />
                <stop offset="100%" stopColor={CHART_COLORS.gold} stopOpacity={0.04} />
              </linearGradient>
              <linearGradient id="grCost" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={CHART_COLORS.rose} stopOpacity={0.32} />
                <stop offset="100%" stopColor={CHART_COLORS.rose} stopOpacity={0.04} />
              </linearGradient>
              <linearGradient id="grProf" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={CHART_COLORS.olive} stopOpacity={0.45} />
                <stop offset="100%" stopColor={CHART_COLORS.olive} stopOpacity={0.04} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(122,112,94,0.18)" />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: "rgba(75,71,65,0.7)" }} />
            <YAxis tick={{ fontSize: 10, fill: "rgba(75,71,65,0.7)" }} tickFormatter={(v) => `R${Math.round(v / 1000)}k`} />
            <Tooltip
              formatter={(v) => formatCurrency(v)}
              contentStyle={{ background: "rgba(255,252,247,0.97)", border: "1px solid rgba(122,112,94,0.25)", borderRadius: 10, fontSize: 12 }}
            />
            <Legend wrapperStyle={{ fontSize: 11, color: "#2b2b2b" }} />
            <Area type="monotone" dataKey="Revenue" stroke={CHART_COLORS.gold} fill="url(#grRev)" strokeWidth={2} />
            <Area type="monotone" dataKey="Costs" stroke={CHART_COLORS.rose} fill="url(#grCost)" strokeWidth={2} />
            <Area type="monotone" dataKey="Profit" stroke={CHART_COLORS.olive} fill="url(#grProf)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
