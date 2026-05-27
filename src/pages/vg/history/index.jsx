import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { fetchSales, fetchExpenses, fetchBookings, fetchUnitCosts, fetchStaffLogsForYear } from '../../../lib/vg/api.js';
import { formatCurrency } from '../../../lib/vg/helpers.js';
import { useIsAdmin } from '../hooks/useCurrentMember.js';
import { MONTH_SHORT } from '../../../lib/vg/constants.js';

function buildMonthlyData(year, salesData, expensesData, bookingsData, unitCostsData, staffLogsData, category) {
  return Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    const monthStr = String(month).padStart(2, '0');
    const from = `${year}-${monthStr}-01`;
    const to = `${year}-${monthStr}-31`;

    const inMonth = (dateStr) => dateStr >= from && dateStr <= to;

    let revenue = 0;
    let costs = 0;

    if (category === 'accommodation') {
      revenue = (bookingsData || []).filter(b => b.check_in >= from && b.check_in <= to).reduce((t, b) => t + (b.total || 0), 0);
      costs = (unitCostsData || []).filter(c => inMonth(c.date)).reduce((t, c) => t + c.amount, 0);
    } else if (category === 'staff') {
      const logs = (staffLogsData || []).filter(l => l.month === month);
      costs = logs.reduce((t, l) => t + ((l.days_worked * (l.vg_staff?.daily_rate || 0)) + (l.bonus || 0)), 0);
      revenue = 0;
    } else if (category === 'total') {
      // Produce revenue (all categories)
      revenue += (salesData || []).filter(s => inMonth(s.date)).reduce((t, s) => t + s.sell_price_actual * s.units, 0);
      // Accommodation revenue
      revenue += (bookingsData || []).filter(b => b.check_in >= from && b.check_in <= to).reduce((t, b) => t + (b.total || 0), 0);
      // All expenses
      costs += (expensesData || []).filter(e => inMonth(e.date)).reduce((t, e) => t + e.amount, 0);
      // Maintenance
      costs += (unitCostsData || []).filter(c => inMonth(c.date)).reduce((t, c) => t + c.amount, 0);
      // Staff
      const logs = (staffLogsData || []).filter(l => l.month === month);
      costs += logs.reduce((t, l) => t + ((l.days_worked * (l.vg_staff?.daily_rate || 0)) + (l.bonus || 0)), 0);
    } else {
      // Produce category filter
      revenue = (salesData || []).filter(s => inMonth(s.date) && s.vg_products?.category === category).reduce((t, s) => t + s.sell_price_actual * s.units, 0);
      costs = (expensesData || []).filter(e => inMonth(e.date) && e.category === category).reduce((t, e) => t + e.amount, 0);
    }

    return { name: MONTH_SHORT[i], revenue, costs, profit: revenue - costs };
  });
}

function HistoryChart({ title, data, showRevenue = true }) {
  const [hidden, setHidden] = useState({});

  const toggle = (key) => setHidden(h => ({ ...h, [key]: !h[key] }));

  return (
    <div className="rounded-2xl border border-[rgba(122,112,94,0.2)] bg-[rgba(255,252,247,0.95)] p-5">
      <p className="text-[0.7rem] uppercase tracking-[0.16em] text-[rgba(75,71,65,0.6)] mb-4 font-semibold">{title}</p>
      <div style={{ height: 200 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(122,112,94,0.12)" />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'rgba(75,71,65,0.5)' }} />
            <YAxis tick={{ fontSize: 10, fill: 'rgba(75,71,65,0.5)' }} tickFormatter={v => v >= 1000 ? `R${(v/1000).toFixed(0)}k` : `R${v}`} />
            <Tooltip
              contentStyle={{ background: 'rgba(255,252,247,0.97)', border: '1px solid rgba(122,112,94,0.2)', borderRadius: 12, fontSize: 12 }}
              formatter={v => formatCurrency(v)}
            />
            <Legend
              wrapperStyle={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer' }}
              onClick={e => toggle(e.dataKey)}
            />
            {showRevenue && <Line type="monotone" dataKey="revenue" stroke="#6b7f5e" strokeWidth={2} dot={false} hide={!!hidden.revenue} name="Revenue" />}
            <Line type="monotone" dataKey="costs" stroke="#c2a66d" strokeWidth={2} dot={false} hide={!!hidden.costs} name="Costs" />
            {showRevenue && <Line type="monotone" dataKey="profit" stroke="#2b2b2b" strokeWidth={2} dot={false} strokeDasharray="4 2" hide={!!hidden.profit} name="Profit" />}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default function VgHistory() {
  const isAdmin = useIsAdmin();
  const [year, setYear] = useState(new Date().getFullYear());

  const { data: sales } = useQuery({
    queryKey: ['vg', 'history', 'sales', year],
    queryFn: () => fetchSales().then(r => (r.data || []).filter(s => s.date?.startsWith(year.toString()))),
    enabled: isAdmin,
  });

  const { data: expenses } = useQuery({
    queryKey: ['vg', 'history', 'expenses', year],
    queryFn: () => fetchExpenses().then(r => (r.data || []).filter(e => e.date?.startsWith(year.toString()))),
    enabled: isAdmin,
  });

  const { data: bookings } = useQuery({
    queryKey: ['vg', 'history', 'bookings', year],
    queryFn: () => fetchBookings().then(r => (r.data || []).filter(b => b.check_in?.startsWith(year.toString()))),
    enabled: isAdmin,
  });

  const { data: unitCosts } = useQuery({
    queryKey: ['vg', 'history', 'unitCosts', year],
    queryFn: () => fetchUnitCosts().then(r => (r.data || []).filter(c => c.date?.startsWith(year.toString()))),
    enabled: isAdmin,
  });

  const { data: staffLogs } = useQuery({
    queryKey: ['vg', 'history', 'staffLogs', year],
    queryFn: () => fetchStaffLogsForYear(year).then(r => r.data || []),
    enabled: isAdmin,
  });

  if (!isAdmin) {
    return (
      <div className="min-h-screen">
        <div className="border-b border-[rgba(122,112,94,0.12)] bg-[rgba(255,252,247,0.8)] backdrop-blur-sm px-6 py-5">
          <p className="text-[0.6rem] uppercase tracking-[0.2em] text-[rgba(75,71,65,0.45)] mb-1">VrischGewagt</p>
          <h1 className="text-xl font-light text-[#2b2b2b] tracking-wide">History</h1>
        </div>
        <div className="p-6">
          <p className="text-[0.85rem] text-[rgba(75,71,65,0.5)] italic">Financial history is restricted to administrators.</p>
        </div>
      </div>
    );
  }

  const SECTIONS = [
    { key: 'olive_oil', title: 'Olive Oil', showRevenue: true },
    { key: 'olives', title: 'Olives', showRevenue: true },
    { key: 'meat', title: 'Meat', showRevenue: true },
    { key: 'other', title: 'Other Products', showRevenue: true },
    { key: 'accommodation', title: 'Accommodation', showRevenue: true },
    { key: 'staff', title: 'Staff Costs', showRevenue: false },
    { key: 'total', title: 'Farm Total', showRevenue: true },
  ];

  return (
    <div className="min-h-screen">
      <div className="border-b border-[rgba(122,112,94,0.12)] bg-[rgba(255,252,247,0.8)] backdrop-blur-sm px-6 py-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[0.6rem] uppercase tracking-[0.2em] text-[rgba(75,71,65,0.45)] mb-1">VrischGewagt</p>
            <h1 className="text-xl font-light text-[#2b2b2b] tracking-wide">History</h1>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setYear(y => y - 1)} className="rounded-lg px-3 py-1.5 text-sm bg-transparent text-[rgba(75,71,65,0.6)] hover:bg-[rgba(122,112,94,0.1)] shadow-none hover:scale-100">←</button>
            <span className="text-[0.9rem] font-light text-[#2b2b2b] w-16 text-center">{year}</span>
            <button onClick={() => setYear(y => y + 1)} className="rounded-lg px-3 py-1.5 text-sm bg-transparent text-[rgba(75,71,65,0.6)] hover:bg-[rgba(122,112,94,0.1)] shadow-none hover:scale-100">→</button>
          </div>
        </div>
      </div>

      <div className="p-6 max-w-5xl space-y-5">
        {SECTIONS.map(section => {
          const data = buildMonthlyData(year, sales, expenses, bookings, unitCosts, staffLogs, section.key);
          return (
            <HistoryChart key={section.key} title={section.title} data={data} showRevenue={section.showRevenue} />
          );
        })}
      </div>
    </div>
  );
}
