import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { fetchSales, fetchExpenses, fetchUnitCosts, fetchStaffLogsForYear } from '../../../lib/vg/api.js';
import { supabase } from '../../../lib/supabase.js';

// Build accommodation chart data from vg_accomm_sales_history for a given calendar year.
// The history table uses financial_year (Mar-Feb) + month. We need calendar months Jan-Dec.
// e.g. calendar year 2025: Jan-Feb comes from FY 2024-2025, Mar-Dec from FY 2025-2026.
function buildAccommCalendarData(histRows, year) {
  const fyPrev = `${year - 1}-${year}`;   // Jan + Feb of this year
  const fyCurr = `${year}-${year + 1}`;   // Mar-Dec of this year
  return Array.from({ length: 12 }, (_, i) => {
    const month = i + 1; // 1=Jan … 12=Dec
    const fy = month <= 2 ? fyPrev : fyCurr;
    const row = (histRows || []).find(r => r.financial_year === fy && r.month === month);
    return { name: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][i], revenue: row ? row.revenue : 0 };
  });
}
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
      // Note: accommodation revenue is handled separately via accomm history table
      revenue = 0;
      costs = (unitCostsData || []).filter(c => inMonth(c.date)).reduce((t, c) => t + c.amount, 0);
    } else if (category === 'staff') {
      const logs = (staffLogsData || []).filter(l => l.month === month);
      costs = logs.reduce((t, l) => t + ((l.days_worked * (l.vg_staff?.daily_rate || 0)) + (l.bonus || 0) - (l.advance || 0)), 0);
      revenue = 0;
    } else if (category === 'total') {
      // Produce revenue (all categories)
      revenue += (salesData || []).filter(s => inMonth(s.date)).reduce((t, s) => t + s.sell_price_actual * s.units, 0);
      // Accommodation revenue — NOTE: total section does not include historical accommodation
      // (only live bookings for current year are in vg_bookings; historical is in separate table)
      revenue += (bookingsData || []).filter(b => b.check_in >= from && b.check_in <= to).reduce((t, b) => t + (b.total || 0), 0);
      // All expenses
      costs += (expensesData || []).filter(e => inMonth(e.date)).reduce((t, e) => t + e.amount, 0);
      // Maintenance
      costs += (unitCostsData || []).filter(c => inMonth(c.date)).reduce((t, c) => t + c.amount, 0);
      // Staff
      const logs = (staffLogsData || []).filter(l => l.month === month);
      costs += logs.reduce((t, l) => t + ((l.days_worked * (l.vg_staff?.daily_rate || 0)) + (l.bonus || 0) - (l.advance || 0)), 0);
    } else {
      // Produce category filter
      revenue = (salesData || []).filter(s => inMonth(s.date) && s.vg_products?.category === category).reduce((t, s) => t + s.sell_price_actual * s.units, 0);
      costs = (expensesData || []).filter(e => inMonth(e.date) && e.category === category).reduce((t, e) => t + e.amount, 0);
    }

    return { name: MONTH_SHORT[i], revenue, costs, profit: revenue - costs };
  });
}

const PRODUCE_COLORS = { olive_oil: '#6b7f5e', olives: '#8b9e6b', meat: '#c2a66d', other: '#9e8b6b' };
const PRODUCE_KEYS = ['olive_oil','olives','meat','other'];
const PRODUCE_LABELS = { olive_oil: 'Olive Oil', olives: 'Olives', meat: 'Meat', other: 'Other' };

const ALL_SECTIONS = [
  { key: 'total', title: 'Farm Total', showRevenue: true },
  { key: 'farm_produce', title: 'Farm Produce', special: 'produce' },
  { key: 'accommodation', title: 'Accommodation', special: 'accommodation' },
  { key: 'staff', title: 'Staff Costs', showRevenue: false },
];

export default function VgHistory() {
  const isAdmin = useIsAdmin();
  const [year, setYear] = useState(new Date().getFullYear());

  const [sectionOrder, setSectionOrder] = useState(ALL_SECTIONS.map(s => s.key));
  const [collapsed, setCollapsed] = useState({});
  const [visibleProduce, setVisibleProduce] = useState(Object.fromEntries(PRODUCE_KEYS.map(k => [k, true])));

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
    queryFn: () => supabase.from('vg_bookings').select('check_in,check_out,total').gte('check_in', `${year}-01-01`).lte('check_in', `${year}-12-31`).then(r => r.data || []),
    enabled: isAdmin,
  });

  // Accommodation historical data — stored in vg_accomm_sales_history by financial year
  // Fetch both FYs that overlap with the selected calendar year
  const { data: accommHist } = useQuery({
    queryKey: ['vg', 'history', 'accomm_hist', year],
    queryFn: async () => {
      const fyPrev = `${year - 1}-${year}`;
      const fyCurr = `${year}-${year + 1}`;
      const { data } = await supabase.from('vg_accomm_sales_history')
        .select('financial_year,month,revenue')
        .in('financial_year', [fyPrev, fyCurr]);
      return data || [];
    },
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

          if (section.special === 'produce') {
            const produceChartData = Array.from({ length: 12 }, (_, i) => {
              const month = i + 1;
              const monthStr = String(month).padStart(2, '0');
              const from = `${year}-${monthStr}-01`;
              const to = `${year}-${monthStr}-31`;
              const inMonth = (dateStr) => dateStr >= from && dateStr <= to;
              const entry = { name: MONTH_SHORT[i] };
              for (const cat of PRODUCE_KEYS) {
                entry[cat] = (sales || []).filter(s => inMonth(s.date) && s.vg_products?.category === cat).reduce((t, s) => t + s.sell_price_actual * s.units, 0);
              }
              return entry;
            });

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
                  <>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {PRODUCE_KEYS.map(cat => {
                        const on = visibleProduce[cat];
                        return (
                          <button key={cat} onClick={() => setVisibleProduce(v => ({ ...v, [cat]: !v[cat] }))}
                            className={`rounded-full px-3 py-1 text-[0.62rem] uppercase tracking-[0.1em] transition-all shadow-none hover:scale-100 ${on ? 'text-white' : 'text-[rgba(75,71,65,0.5)] bg-transparent border border-[rgba(122,112,94,0.2)]'}`}
                            style={on ? { background: PRODUCE_COLORS[cat] } : {}}>
                            {PRODUCE_LABELS[cat]}
                          </button>
                        );
                      })}
                    </div>
                    <div style={{ height: 200 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={produceChartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(122,112,94,0.12)" />
                          <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'rgba(75,71,65,0.5)' }} />
                          <YAxis tick={{ fontSize: 10, fill: 'rgba(75,71,65,0.5)' }} tickFormatter={v => v >= 1000 ? `R${(v/1000).toFixed(0)}k` : `R${v}`} />
                          <Tooltip contentStyle={{ background: 'rgba(255,252,247,0.97)', border: '1px solid rgba(122,112,94,0.2)', borderRadius: 12, fontSize: 12 }} formatter={v => formatCurrency(v)} />
                          <Legend wrapperStyle={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em' }} />
                          {PRODUCE_KEYS.filter(cat => visibleProduce[cat]).map(cat => (
                            <Line key={cat} type="monotone" dataKey={cat} stroke={PRODUCE_COLORS[cat]} strokeWidth={2} dot={false} name={PRODUCE_LABELS[cat]} />
                          ))}
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </>
                )}
              </div>
            );
          }

          // Accommodation section — uses vg_accomm_sales_history
          if (section.special === 'accommodation') {
            const accommData = buildAccommCalendarData(accommHist, year);
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
                      <LineChart data={accommData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(122,112,94,0.12)" />
                        <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'rgba(75,71,65,0.5)' }} />
                        <YAxis tick={{ fontSize: 10, fill: 'rgba(75,71,65,0.5)' }} tickFormatter={v => v >= 1000 ? `R${(v/1000).toFixed(0)}k` : `R${v}`} />
                        <Tooltip contentStyle={{ background: 'rgba(255,252,247,0.97)', border: '1px solid rgba(122,112,94,0.2)', borderRadius: 12, fontSize: 12 }} formatter={v => formatCurrency(v)} />
                        <Legend wrapperStyle={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em' }} />
                        <Line type="monotone" dataKey="revenue" stroke="#7a8f9e" strokeWidth={2} dot={false} name="Revenue" />
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
