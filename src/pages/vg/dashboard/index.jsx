import { useQuery } from '@tanstack/react-query';
import { useIsAdmin } from '../hooks/useCurrentMember.js';
import { fetchBookings, fetchSales, fetchExpenses, fetchStaffLogs, fetchLivestockMonthly } from '../../../lib/vg/api.js';
import { formatCurrency, currentYearMonth, formatDate } from '../../../lib/vg/helpers.js';
import { MONTH_NAMES } from '../../../lib/vg/constants.js';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { last12Months } from '../../../lib/vg/helpers.js';

function StatCard({ label, value, sub, color = '#6b7f5e' }) {
  return (
    <div className="rounded-2xl border border-[rgba(122,112,94,0.2)] bg-[rgba(255,252,247,0.95)] p-5 backdrop-blur-sm">
      <p className="text-[0.62rem] uppercase tracking-[0.16em] text-[rgba(75,71,65,0.55)] mb-2">{label}</p>
      <p className="text-2xl font-light" style={{ color }}>{value}</p>
      {sub && <p className="text-[0.7rem] text-[rgba(75,71,65,0.5)] mt-1">{sub}</p>}
    </div>
  );
}

function PageHeader() {
  const { year, month } = currentYearMonth();
  return (
    <div className="border-b border-[rgba(122,112,94,0.12)] bg-[rgba(255,252,247,0.8)] backdrop-blur-sm px-6 py-5">
      <p className="text-[0.6rem] uppercase tracking-[0.2em] text-[rgba(75,71,65,0.45)] mb-1">VrischGewagt</p>
      <h1 className="text-xl font-light text-[#2b2b2b] tracking-wide">Dashboard</h1>
      <p className="text-[0.72rem] text-[rgba(75,71,65,0.55)] mt-0.5">{MONTH_NAMES[month - 1]} {year}</p>
    </div>
  );
}

export default function VgDashboard() {
  const isAdmin = useIsAdmin();
  const { year, month } = currentYearMonth();

  const { data: sales } = useQuery({
    queryKey: ['vg', 'sales', year, month],
    queryFn: () => fetchSales({ year, month }).then(r => r.data || []),
  });

  const { data: expenses } = useQuery({
    queryKey: ['vg', 'expenses', year, month],
    queryFn: () => fetchExpenses({ year, month }).then(r => r.data || []),
    enabled: isAdmin,
  });

  const { data: bookings } = useQuery({
    queryKey: ['vg', 'bookings', year, month],
    queryFn: () => fetchBookings({ year, month }).then(r => r.data || []),
  });

  const { data: staffLogs } = useQuery({
    queryKey: ['vg', 'staffLogs', year, month],
    queryFn: () => fetchStaffLogs(year, month).then(r => r.data || []),
    enabled: isAdmin,
  });

  const { data: sheepData } = useQuery({
    queryKey: ['vg', 'livestock', 'sheep', year, month],
    queryFn: () => fetchLivestockMonthly(year, month, 'sheep').then(r => r.data || []),
  });

  const { data: cattleData } = useQuery({
    queryKey: ['vg', 'livestock', 'cattle', year, month],
    queryFn: () => fetchLivestockMonthly(year, month, 'cattle').then(r => r.data || []),
  });

  const totalSalesRevenue = (sales || []).reduce((s, r) => s + (r.sell_price_actual * r.units), 0);
  const totalBookingRevenue = (bookings || []).reduce((s, r) => s + (r.total || 0), 0);
  const totalRevenue = totalSalesRevenue + totalBookingRevenue;

  const totalExpenses = (expenses || []).reduce((s, r) => s + r.amount, 0);
  const totalStaffCost = (staffLogs || []).reduce((s, r) => s + ((r.days_worked * (r.vg_staff?.daily_rate || 0)) + (r.bonus || 0)), 0);
  const totalCosts = totalExpenses + totalStaffCost;
  const netProfit = totalRevenue - totalCosts;

  const totalSheep = (sheepData || []).reduce((s, r) => s + (r.closing_count || 0), 0);
  const totalCattle = (cattleData || []).reduce((s, r) => s + (r.closing_count || 0), 0);

  return (
    <div className="min-h-screen">
      <PageHeader />
      <div className="p-6 max-w-5xl">
        {/* Admin financial cards */}
        {isAdmin && (
          <section className="mb-8">
            <p className="text-[0.6rem] uppercase tracking-[0.2em] text-[rgba(75,71,65,0.45)] mb-4">This Month — Financials</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard label="Total Revenue" value={formatCurrency(totalRevenue)} color="#6b7f5e" />
              <StatCard label="Total Costs" value={formatCurrency(totalCosts)} color="#c2a66d" />
              <StatCard
                label="Net Profit"
                value={formatCurrency(netProfit)}
                color={netProfit >= 0 ? '#6b7f5e' : '#8b4a4a'}
                sub={netProfit >= 0 ? 'Positive' : 'Negative'}
              />
            </div>
          </section>
        )}

        {/* Livestock quick stats — everyone sees this */}
        <section className="mb-8">
          <p className="text-[0.6rem] uppercase tracking-[0.2em] text-[rgba(75,71,65,0.45)] mb-4">Livestock</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard label="Sheep" value={totalSheep || '—'} color="#8b6f47" />
            <StatCard label="Cattle" value={totalCattle || '—'} color="#5a7a5a" />
            <StatCard label="Bookings" value={(bookings || []).length} sub="this month" color="#4a6b8b" />
            <StatCard label="Sales" value={(sales || []).length} sub="this month" color="#6b7f5e" />
          </div>
        </section>

        {/* Recent bookings */}
        {(bookings || []).length > 0 && (
          <section className="mb-8">
            <p className="text-[0.6rem] uppercase tracking-[0.2em] text-[rgba(75,71,65,0.45)] mb-4">Recent Bookings</p>
            <div className="rounded-2xl border border-[rgba(122,112,94,0.2)] bg-[rgba(255,252,247,0.95)] overflow-hidden">
              {(bookings || []).slice(0, 5).map((b, i, arr) => (
                <div
                  key={b.id}
                  className={`flex items-center justify-between px-5 py-3.5 text-sm ${i < arr.length - 1 ? 'border-b border-[rgba(122,112,94,0.1)]' : ''}`}
                >
                  <div>
                    <p className="font-medium text-[0.85rem] text-[#2b2b2b]">{b.guest_name}</p>
                    <p className="text-[0.7rem] text-[rgba(75,71,65,0.55)]">{b.vg_units?.name} · {formatDate(b.check_in)} → {formatDate(b.check_out)}</p>
                  </div>
                  {isAdmin && (
                    <p className="text-[0.85rem] font-light text-[#6b7f5e]">{formatCurrency(b.total)}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Recent sales */}
        {(sales || []).length > 0 && isAdmin && (
          <section className="mb-8">
            <p className="text-[0.6rem] uppercase tracking-[0.2em] text-[rgba(75,71,65,0.45)] mb-4">Recent Sales</p>
            <div className="rounded-2xl border border-[rgba(122,112,94,0.2)] bg-[rgba(255,252,247,0.95)] overflow-hidden">
              {(sales || []).slice(0, 5).map((s, i, arr) => (
                <div
                  key={s.id}
                  className={`flex items-center justify-between px-5 py-3.5 ${i < arr.length - 1 ? 'border-b border-[rgba(122,112,94,0.1)]' : ''}`}
                >
                  <div>
                    <p className="font-medium text-[0.85rem] text-[#2b2b2b]">{s.vg_products?.name || '—'}</p>
                    <p className="text-[0.7rem] text-[rgba(75,71,65,0.55)]">{formatDate(s.date)} · {s.units} units</p>
                  </div>
                  <p className="text-[0.85rem] font-light text-[#6b7f5e]">{formatCurrency(s.sell_price_actual * s.units)}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
