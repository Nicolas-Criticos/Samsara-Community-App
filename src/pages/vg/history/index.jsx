import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { fetchSales, fetchExpenses, fetchBookings, fetchUnitCosts, fetchStaffLogsForYear } from '../../../lib/vg/api.js';
import { formatCurrency } from '../../../lib/vg/helpers.js';
import { useIsAdmin } from '../hooks/useCurrentMember.js';
import { MONTH_SHORT } from '../../../lib/vg/constants.js';
import { supabase } from '../../../lib/supabase.js';

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

// Financial year: e.g. '2025-2026' runs Mar 2025 → Feb 2026
// Months in financial year order: Mar(3), Apr(4)...Feb(2)
const FY_MONTHS = [3,4,5,6,7,8,9,10,11,12,1,2];
const FY_LABELS = ['Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb'];

function buildAccommHistoryData(histRows) {
  return FY_MONTHS.map((m, i) => {
    const row = (histRows || []).find(r => r.month === m);
    return {
      name: FY_LABELS[i],
      revenue: row ? row.revenue : 0,
      costs: 0,
      profit: row ? row.revenue : 0,
    };
  });
}

const ALL_SECTIONS = [
  { key: 'olive_oil', title: 'Olive Oil', showRevenue: true },
  { key: 'olives', title: 'Olives', showRevenue: true },
  { key: 'meat', title: 'Meat', showRevenue: true },
  { key: 'other', title: 'Other Products', showRevenue: true },
  { key: 'staff', title: 'Staff Costs', showRevenue: false },
  { key: 'total', title: 'Farm Total', showRevenue: true },
  { key: 'accommodation_hist', title: 'Accommodation', showRevenue: true, special: true },
];

export default function VgHistory() {
  const isAdmin = useIsAdmin();
  const [year, setYear] = useState(new Date().getFullYear());

  // Financial year selector (for accommodation history)
  const currentFY = () => {
    const now = new Date();
    const m = now.getMonth() + 1;
    const y = now.getFullYear();
    return m >= 3 ? `${y}-${y+1}` : `${y-1}-${y}`;
  };
  const [financialYear, setFinancialYear] = useState(currentFY);

  const parseFY = (fy) => { const [a] = fy.split('-'); return parseInt(a); };
  const prevFY = () => { const y = parseFY(financialYear); setFinancialYear(`${y-1}-${y}`); };
  const nextFY = () => { const y = parseFY(financialYear); setFinancialYear(`${y+1}-${y+2}`); };

  const [sectionOrder, setSectionOrder] = useState(ALL_SECTIONS.map(s => s.key));
  const [collapsed, setCollapsed] = useState({});

  function moveUp(idx) {
    if (idx === 0) return;
    setSectionOrder(o => { const a = [...o]; [a[idx-1], a[idx]] = [a[idx], a[idx-1]]; return a; });
  }
  function moveDown(idx) {
    setSectionOrder(o => { if (idx >= o.length-1) return o; const a = [...o]; [a[idx], a[idx+1]] = [a[idx+1], a[idx]]; return a; });
  }
  function toggleCollapse(key) {
    setCollapsed(c => ({ ...c, [key]: !c[key] }));
  }

  const { data: accommHistory } = useQuery({
    queryKey: ['vg', 'accomm_history', financialYear],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vg_accomm_sales_history')
        .select('*')
        .eq('financial_year', financialYear);
      if (error) throw error;
      return data || [];
    },
    enabled: isAdmin,
  });

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
        {sectionOrder.map((key, idx) => {
          const section = ALL_SECTIONS.find(s => s.key === key);
          if (!section) return null;
          const isCollapsed = !!collapsed[key];

          if (section.special) {
            // Accommodation with financial year selector
            const accommChartData = buildAccommHistoryData(accommHistory);
            return (
              <div key={key} className="rounded-2xl border border-[rgba(122,112,94,0.2)] bg-[rgba(255,252,247,0.95)] p-5">
                <div className="flex items-center gap-2 mb-4">
                  <button onClick={() => toggleCollapse(key)} className="text-[0.75rem] bg-transparent p-0 shadow-none text-[rgba(75,71,65,0.5)] hover:scale-100 mr-1">{isCollapsed ? '▶' : '▼'}</button>
                  <p className="text-[0.7rem] uppercase tracking-[0.16em] text-[rgba(75,71,65,0.6)] font-semibold flex-1">Accommodation</p>
                  <div className="flex items-center gap-1">
                    <button onClick={prevFY} className="rounded-lg px-2 py-1 text-xs bg-transparent text-[rgba(75,71,65,0.6)] hover:bg-[rgba(122,112,94,0.1)] shadow-none hover:scale-100">←</button>
                    <span className="text-[0.75rem] font-light text-[#2b2b2b] w-24 text-center">{financialYear}</span>
                    <button onClick={nextFY} className="rounded-lg px-2 py-1 text-xs bg-transparent text-[rgba(75,71,65,0.6)] hover:bg-[rgba(122,112,94,0.1)] shadow-none hover:scale-100">→</button>
                  </div>
                  <div className="flex flex-col gap-0.5 ml-2">
                    <button onClick={() => moveUp(idx)} disabled={idx === 0} className="text-[0.6rem] bg-transparent p-0 shadow-none text-[rgba(75,71,65,0.4)] hover:scale-100 disabled:opacity-20 leading-none">↑</button>
                    <button onClick={() => moveDown(idx)} disabled={idx === sectionOrder.length-1} className="text-[0.6rem] bg-transparent p-0 shadow-none text-[rgba(75,71,65,0.4)] hover:scale-100 disabled:opacity-20 leading-none">↓</button>
                  </div>
                </div>
                {!isCollapsed && (
                  <div style={{ height: 200 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={accommChartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(122,112,94,0.12)" />
                        <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'rgba(75,71,65,0.5)' }} />
                        <YAxis tick={{ fontSize: 10, fill: 'rgba(75,71,65,0.5)' }} tickFormatter={v => v >= 1000 ? `R${(v/1000).toFixed(0)}k` : `R${v}`} />
                        <Tooltip contentStyle={{ background: 'rgba(255,252,247,0.97)', border: '1px solid rgba(122,112,94,0.2)', borderRadius: 12, fontSize: 12 }} formatter={v => formatCurrency(v)} />
                        <Legend wrapperStyle={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em' }} />
                        <Line type="monotone" dataKey="revenue" stroke="#6b7f5e" strokeWidth={2} dot={false} name="Revenue" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            );
          }

          // Standard section
          const data = buildMonthlyData(year, sales, expenses, bookings, unitCosts, staffLogs, section.key);
          return (
            <div key={key} className="rounded-2xl border border-[rgba(122,112,94,0.2)] bg-[rgba(255,252,247,0.95)] p-5">
              <div className="flex items-center gap-2 mb-4">
                <button onClick={() => toggleCollapse(key)} className="text-[0.75rem] bg-transparent p-0 shadow-none text-[rgba(75,71,65,0.5)] hover:scale-100 mr-1">{isCollapsed ? '▶' : '▼'}</button>
                <p className="text-[0.7rem] uppercase tracking-[0.16em] text-[rgba(75,71,65,0.6)] font-semibold flex-1">{section.title}</p>
                <div className="flex flex-col gap-0.5">
                  <button onClick={() => moveUp(idx)} disabled={idx === 0} className="text-[0.6rem] bg-transparent p-0 shadow-none text-[rgba(75,71,65,0.4)] hover:scale-100 disabled:opacity-20 leading-none">↑</button>
                  <button onClick={() => moveDown(idx)} disabled={idx === sectionOrder.length-1} className="text-[0.6rem] bg-transparent p-0 shadow-none text-[rgba(75,71,65,0.4)] hover:scale-100 disabled:opacity-20 leading-none">↓</button>
                </div>
              </div>
              {!isCollapsed && (
                <div style={{ height: 200 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(122,112,94,0.12)" />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'rgba(75,71,65,0.5)' }} />
                      <YAxis tick={{ fontSize: 10, fill: 'rgba(75,71,65,0.5)' }} tickFormatter={v => v >= 1000 ? `R${(v/1000).toFixed(0)}k` : `R${v}`} />
                      <Tooltip contentStyle={{ background: 'rgba(255,252,247,0.97)', border: '1px solid rgba(122,112,94,0.2)', borderRadius: 12, fontSize: 12 }} formatter={v => formatCurrency(v)} />
                      <Legend wrapperStyle={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer' }} onClick={e => {}} />
                      {section.showRevenue && <Line type="monotone" dataKey="revenue" stroke="#6b7f5e" strokeWidth={2} dot={false} name="Revenue" />}
                      <Line type="monotone" dataKey="costs" stroke="#c2a66d" strokeWidth={2} dot={false} name="Costs" />
                      {section.showRevenue && <Line type="monotone" dataKey="profit" stroke="#2b2b2b" strokeWidth={2} dot={false} strokeDasharray="4 2" name="Profit" />}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
