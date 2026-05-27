import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { fetchUnits, insertUnit, updateUnit, fetchBookings, insertBooking, deleteBooking, fetchUnitCosts, insertUnitCost, deleteUnitCost, fetchStaff, insertStaff, updateStaff, fetchStaffLogs, upsertStaffLog } from '../../../lib/vg/api.js';
import { formatCurrency, formatDate, currentYearMonth, prevMonth, nextMonth, daysInMonth, capitalize } from '../../../lib/vg/helpers.js';
import { useIsAdmin } from '../hooks/useCurrentMember.js';
import { useAuthSession } from '../../../hooks/useAuthSession.js';
import { MONTH_SHORT as MS } from '../../../lib/vg/constants.js';

// ─── Unit Card ─────────────────────────────────────────────────────────────

function UnitCard({ unit, bookings, year, month, isAdmin, onEdit }) {
  const days = daysInMonth(year, month);
  const nightsBooked = (bookings || [])
    .filter(b => b.unit_id === unit.id)
    .reduce((t, b) => t + (b.nights || 0), 0);
  const occupancy = Math.min(100, Math.round((nightsBooked / days) * 100));
  const revenue = (bookings || [])
    .filter(b => b.unit_id === unit.id)
    .reduce((t, b) => t + (b.total || 0), 0);

  return (
    <div className="rounded-2xl border border-[rgba(122,112,94,0.2)] bg-[rgba(255,252,247,0.95)] p-5">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-[0.85rem] font-medium text-[#2b2b2b]">{unit.name}</h3>
          <p className="text-[0.68rem] text-[rgba(75,71,65,0.5)]">R {unit.default_rate}/night</p>
        </div>
        {isAdmin && (
          <button onClick={() => onEdit(unit)} className="rounded-full px-3 py-1 text-[0.6rem] uppercase tracking-[0.1em] bg-transparent border border-[rgba(122,112,94,0.3)] text-[rgba(75,71,65,0.6)] shadow-none hover:scale-100 hover:bg-[rgba(122,112,94,0.1)]">Edit</button>
        )}
      </div>
      <div className="mb-3">
        <div className="flex justify-between text-[0.68rem] text-[rgba(75,71,65,0.5)] mb-1">
          <span>Occupancy</span><span>{occupancy}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-[rgba(122,112,94,0.15)] overflow-hidden">
          <div className="h-full rounded-full bg-[#6b7f5e] transition-all" style={{ width: `${occupancy}%` }} />
        </div>
      </div>
      <div className="flex justify-between text-[0.78rem]">
        <span className="text-[rgba(75,71,65,0.55)]">{nightsBooked} nights booked</span>
        {isAdmin && <span className="font-medium text-[#6b7f5e]">{formatCurrency(revenue)}</span>}
      </div>
    </div>
  );
}

// ─── Unit Modal ─────────────────────────────────────────────────────────────

function UnitModal({ unit, onClose, onSaved }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: unit?.name || '', default_rate: unit?.default_rate || '' });
  const [saving, setSaving] = useState(false);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      if (unit) await updateUnit(unit.id, { name: form.name, default_rate: Number(form.default_rate) });
      else await insertUnit({ name: form.name, default_rate: Number(form.default_rate), active: true });
      qc.invalidateQueries({ queryKey: ['vg', 'units'] });
      onSaved();
    } finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(44,42,37,0.4)] backdrop-blur-sm p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <form onSubmit={handleSave} className="bg-[rgba(255,252,247,0.98)] rounded-2xl border border-[rgba(122,112,94,0.2)] p-8 w-full max-w-sm shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-light">{unit ? 'Edit Unit' : 'Add Unit'}</h2>
          <button type="button" onClick={onClose} className="bg-transparent p-0 text-2xl text-[rgba(75,71,65,0.4)] shadow-none rounded-none hover:scale-100">×</button>
        </div>
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-[0.62rem] uppercase tracking-[0.14em] text-[rgba(75,71,65,0.55)] mb-1">Unit Name</label>
            <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required
              className="w-full bg-transparent border-0 border-b border-[rgba(122,112,94,0.3)] px-0 py-2 text-[0.85rem] outline-none" />
          </div>
          <div>
            <label className="block text-[0.62rem] uppercase tracking-[0.14em] text-[rgba(75,71,65,0.55)] mb-1">Default Rate (R/night)</label>
            <input type="number" min="0" step="0.01" value={form.default_rate} onChange={e => setForm(f => ({ ...f, default_rate: e.target.value }))}
              className="w-full bg-transparent border-0 border-b border-[rgba(122,112,94,0.3)] px-0 py-2 text-[0.85rem] outline-none" />
          </div>
        </div>
        <button type="submit" disabled={saving} className="w-full rounded-full py-3 text-[0.7rem] uppercase tracking-[0.14em] bg-[rgba(107,127,94,0.85)] text-white">{saving ? 'Saving…' : 'Save'}</button>
      </form>
    </div>
  );
}

// ─── Staff Log Row ─────────────────────────────────────────────────────────

function StaffLogRow({ staff, log, year, month, isAdmin }) {
  const { data: session } = useAuthSession();
  const qc = useQueryClient();
  const [days, setDays] = useState(log?.days_worked ?? '');
  const [bonus, setBonus] = useState(log?.bonus ?? '');
  const [saving, setSaving] = useState(false);

  const salary = (Number(days) || 0) * staff.daily_rate + (Number(bonus) || 0);

  async function save() {
    setSaving(true);
    try {
      await upsertStaffLog({ staff_id: staff.id, year, month, days_worked: Number(days) || 0, bonus: Number(bonus) || 0, created_by: session?.user?.id });
      qc.invalidateQueries({ queryKey: ['vg', 'staffLogs', year, month] });
    } finally { setSaving(false); }
  }

  return (
    <div className="flex items-center gap-4 py-3 border-b border-[rgba(122,112,94,0.08)] last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-[0.82rem] font-medium text-[#2b2b2b] truncate">{staff.name}</p>
        <p className="text-[0.68rem] text-[rgba(75,71,65,0.5)]">{staff.role} · R {staff.daily_rate}/day</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <div>
          <label className="block text-[0.55rem] uppercase tracking-[0.1em] text-[rgba(75,71,65,0.45)] mb-0.5 text-center">Days</label>
          <input type="number" min="0" step="0.5" value={days} onChange={e => setDays(e.target.value)}
            className="w-14 bg-transparent border border-[rgba(122,112,94,0.25)] rounded-lg px-2 py-1.5 text-[0.8rem] text-center outline-none focus:border-[rgba(107,127,94,0.5)]" />
        </div>
        <div>
          <label className="block text-[0.55rem] uppercase tracking-[0.1em] text-[rgba(75,71,65,0.45)] mb-0.5 text-center">Bonus</label>
          <input type="number" min="0" value={bonus} onChange={e => setBonus(e.target.value)}
            className="w-20 bg-transparent border border-[rgba(122,112,94,0.25)] rounded-lg px-2 py-1.5 text-[0.8rem] text-center outline-none focus:border-[rgba(107,127,94,0.5)]" />
        </div>
        {isAdmin && <p className="text-[0.82rem] font-medium text-[#6b7f5e] min-w-[64px] text-right">{formatCurrency(salary)}</p>}
        <button onClick={save} disabled={saving} className="rounded-full px-3 py-1.5 text-[0.6rem] uppercase tracking-[0.1em] bg-[rgba(107,127,94,0.85)] text-white shadow-none hover:scale-100">{saving ? '…' : 'Save'}</button>
      </div>
    </div>
  );
}

// ─── Staff Modal ────────────────────────────────────────────────────────────

function StaffModal({ staff, onClose, onSaved }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: staff?.name || '', role: staff?.role || '', daily_rate: staff?.daily_rate || '' });
  const [saving, setSaving] = useState(false);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      if (staff) await updateStaff(staff.id, { name: form.name, role: form.role, daily_rate: Number(form.daily_rate) });
      else await insertStaff({ name: form.name, role: form.role, daily_rate: Number(form.daily_rate), active: true });
      qc.invalidateQueries({ queryKey: ['vg', 'staff'] });
      onSaved();
    } finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(44,42,37,0.4)] backdrop-blur-sm p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <form onSubmit={handleSave} className="bg-[rgba(255,252,247,0.98)] rounded-2xl border border-[rgba(122,112,94,0.2)] p-8 w-full max-w-sm shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-light">{staff ? 'Edit Staff' : 'Add Staff'}</h2>
          <button type="button" onClick={onClose} className="bg-transparent p-0 text-2xl text-[rgba(75,71,65,0.4)] shadow-none rounded-none hover:scale-100">×</button>
        </div>
        <div className="space-y-4 mb-6">
          {[['Name', 'name', 'text'], ['Role', 'role', 'text'], ['Daily Rate (R)', 'daily_rate', 'number']].map(([label, key, type]) => (
            <div key={key}>
              <label className="block text-[0.62rem] uppercase tracking-[0.14em] text-[rgba(75,71,65,0.55)] mb-1">{label}</label>
              <input type={type} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                className="w-full bg-transparent border-0 border-b border-[rgba(122,112,94,0.3)] px-0 py-2 text-[0.85rem] outline-none" />
            </div>
          ))}
        </div>
        <button type="submit" disabled={saving} className="w-full rounded-full py-3 text-[0.7rem] uppercase tracking-[0.14em] bg-[rgba(107,127,94,0.85)] text-white">{saving ? 'Saving…' : 'Save'}</button>
      </form>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function VgAccommodation() {
  const { data: session } = useAuthSession();
  const isAdmin = useIsAdmin();
  const qc = useQueryClient();
  const now = currentYearMonth();
  const [year, setYear] = useState(now.year);
  const [month, setMonth] = useState(now.month);
  const [unitModal, setUnitModal] = useState(null);
  const [staffModal, setStaffModal] = useState(null);
  const [bookingForm, setBookingForm] = useState({ unit_id: '', guest_name: '', check_in: '', check_out: '', rate_per_night: '', notes: '' });
  const [costForm, setCostForm] = useState({ unit_id: '', date: new Date().toISOString().slice(0,10), description: '', amount: '', category: 'maintenance' });
  const [bookSaving, setBookSaving] = useState(false);
  const [costSaving, setCostSaving] = useState(false);

  const { data: units } = useQuery({ queryKey: ['vg', 'units'], queryFn: () => fetchUnits().then(r => r.data || []) });
  const { data: bookings } = useQuery({ queryKey: ['vg', 'bookings', year, month], queryFn: () => fetchBookings({ year, month }).then(r => r.data || []) });
  const { data: unitCosts } = useQuery({ queryKey: ['vg', 'unitCosts', year, month], queryFn: () => fetchUnitCosts({ year, month }).then(r => r.data || []), enabled: isAdmin });
  const { data: staff } = useQuery({ queryKey: ['vg', 'staff'], queryFn: () => fetchStaff().then(r => r.data || []) });
  const { data: staffLogs } = useQuery({ queryKey: ['vg', 'staffLogs', year, month], queryFn: () => fetchStaffLogs(year, month).then(r => r.data || []) });

  const totalRevenue = (bookings || []).reduce((t, b) => t + (b.total || 0), 0);
  const totalMaintenance = (unitCosts || []).reduce((t, c) => t + c.amount, 0);
  const totalStaffCost = (staffLogs || []).reduce((t, l) => t + ((l.days_worked * (l.vg_staff?.daily_rate || 0)) + (l.bonus || 0)), 0);
  const logByStaffId = Object.fromEntries((staffLogs || []).map(l => [l.staff_id, l]));

  async function logBooking(e) {
    e.preventDefault();
    setBookSaving(true);
    try {
      await insertBooking({ ...bookingForm, rate_per_night: Number(bookingForm.rate_per_night), created_by: session?.user?.id });
      qc.invalidateQueries({ queryKey: ['vg', 'bookings'] });
      setBookingForm(f => ({ ...f, guest_name: '', check_in: '', check_out: '', notes: '' }));
    } finally { setBookSaving(false); }
  }

  async function logCost(e) {
    e.preventDefault();
    setCostSaving(true);
    try {
      await insertUnitCost({ ...costForm, amount: Number(costForm.amount), created_by: session?.user?.id });
      qc.invalidateQueries({ queryKey: ['vg', 'unitCosts'] });
      setCostForm(f => ({ ...f, description: '', amount: '' }));
    } finally { setCostSaving(false); }
  }

  function onPrev() { const p = prevMonth(year, month); setYear(p.year); setMonth(p.month); }
  function onNext() { const n = nextMonth(year, month); setYear(n.year); setMonth(n.month); }

  // Chart data: nights booked per unit this month
  const occupancyChartData = (units || []).map(u => ({
    name: u.name,
    nights: (bookings || []).filter(b => b.unit_id === u.id).reduce((t, b) => t + (b.nights || 0), 0),
  }));

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b border-[rgba(122,112,94,0.12)] bg-[rgba(255,252,247,0.8)] backdrop-blur-sm px-6 py-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[0.6rem] uppercase tracking-[0.2em] text-[rgba(75,71,65,0.45)] mb-1">VrischGewagt</p>
            <h1 className="text-xl font-light text-[#2b2b2b] tracking-wide">Accommodation</h1>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={onPrev} className="rounded-lg px-3 py-1.5 text-sm bg-transparent text-[rgba(75,71,65,0.6)] hover:bg-[rgba(122,112,94,0.1)] shadow-none hover:scale-100">←</button>
            <span className="text-[0.78rem] font-medium text-[#2b2b2b] w-24 text-center">{MS[month-1]} {year}</span>
            <button onClick={onNext} className="rounded-lg px-3 py-1.5 text-sm bg-transparent text-[rgba(75,71,65,0.6)] hover:bg-[rgba(122,112,94,0.1)] shadow-none hover:scale-100">→</button>
          </div>
        </div>
      </div>

      <div className="p-6 max-w-5xl space-y-8">
        {/* Admin summary */}
        {isAdmin && (
          <section>
            <p className="text-[0.6rem] uppercase tracking-[0.2em] text-[rgba(75,71,65,0.45)] mb-4">{MS[month-1]} {year} — Summary</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-2xl border border-[rgba(122,112,94,0.2)] bg-[rgba(255,252,247,0.95)] p-5">
                <p className="text-[0.62rem] uppercase tracking-[0.14em] text-[rgba(75,71,65,0.5)] mb-1">Revenue</p>
                <p className="text-2xl font-light text-[#6b7f5e]">{formatCurrency(totalRevenue)}</p>
              </div>
              <div className="rounded-2xl border border-[rgba(122,112,94,0.2)] bg-[rgba(255,252,247,0.95)] p-5">
                <p className="text-[0.62rem] uppercase tracking-[0.14em] text-[rgba(75,71,65,0.5)] mb-1">Maintenance</p>
                <p className="text-2xl font-light text-[#c2a66d]">{formatCurrency(totalMaintenance)}</p>
              </div>
              <div className="rounded-2xl border border-[rgba(122,112,94,0.2)] bg-[rgba(255,252,247,0.95)] p-5">
                <p className="text-[0.62rem] uppercase tracking-[0.14em] text-[rgba(75,71,65,0.5)] mb-1">Staff Cost</p>
                <p className="text-2xl font-light text-[#c2a66d]">{formatCurrency(totalStaffCost)}</p>
              </div>
            </div>
          </section>
        )}

        {/* Units */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <p className="text-[0.6rem] uppercase tracking-[0.2em] text-[rgba(75,71,65,0.45)]">Units</p>
            {isAdmin && <button onClick={() => setUnitModal({ unit: null })} className="rounded-full px-4 py-1.5 text-[0.62rem] uppercase tracking-[0.1em] bg-[rgba(107,127,94,0.85)] text-white shadow-none hover:scale-100">+ Add Unit</button>}
          </div>
          {!(units || []).length ? (
            <p className="text-[0.8rem] text-[rgba(75,71,65,0.4)] italic">No units yet</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {(units || []).map(u => (
                <UnitCard key={u.id} unit={u} bookings={bookings} year={year} month={month} isAdmin={isAdmin} onEdit={u => setUnitModal({ unit: u })} />
              ))}
            </div>
          )}
        </section>

        {/* Occupancy chart */}
        {(units || []).length > 0 && (
          <section>
            <p className="text-[0.6rem] uppercase tracking-[0.2em] text-[rgba(75,71,65,0.45)] mb-4">Occupancy — Nights Booked</p>
            <div className="rounded-2xl border border-[rgba(122,112,94,0.2)] bg-[rgba(255,252,247,0.95)] p-5">
              <div style={{ height: 180 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={occupancyChartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(122,112,94,0.12)" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'rgba(75,71,65,0.5)' }} />
                    <YAxis tick={{ fontSize: 10, fill: 'rgba(75,71,65,0.5)' }} />
                    <Tooltip contentStyle={{ background: 'rgba(255,252,247,0.97)', border: '1px solid rgba(122,112,94,0.2)', borderRadius: 12, fontSize: 12 }} />
                    <Bar dataKey="nights" fill="#6b7f5e" radius={[6, 6, 0, 0]} name="Nights Booked" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>
        )}

        {/* New Booking */}
        <section className="rounded-2xl border border-[rgba(122,112,94,0.2)] bg-[rgba(255,252,247,0.95)] p-6">
          <p className="text-[0.65rem] uppercase tracking-[0.18em] text-[rgba(75,71,65,0.5)] mb-5">New Booking</p>
          <form onSubmit={logBooking}>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-5 mb-5">
              <div>
                <label className="block text-[0.62rem] uppercase tracking-[0.14em] text-[rgba(75,71,65,0.55)] mb-1">Unit</label>
                <select value={bookingForm.unit_id} onChange={e => { const u = (units||[]).find(x => x.id === e.target.value); setBookingForm(f => ({ ...f, unit_id: e.target.value, rate_per_night: u?.default_rate || '' })); }}
                  className="w-full bg-transparent border-0 border-b border-[rgba(122,112,94,0.3)] px-0 py-2 text-[0.85rem] outline-none" required>
                  <option value="">Select unit</option>
                  {(units||[]).map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
              <div className="col-span-2 sm:col-span-2">
                <label className="block text-[0.62rem] uppercase tracking-[0.14em] text-[rgba(75,71,65,0.55)] mb-1">Guest Name</label>
                <input type="text" value={bookingForm.guest_name} onChange={e => setBookingForm(f => ({ ...f, guest_name: e.target.value }))} required
                  className="w-full bg-transparent border-0 border-b border-[rgba(122,112,94,0.3)] px-0 py-2 text-[0.85rem] outline-none" />
              </div>
              <div>
                <label className="block text-[0.62rem] uppercase tracking-[0.14em] text-[rgba(75,71,65,0.55)] mb-1">Check In</label>
                <input type="date" value={bookingForm.check_in} onChange={e => setBookingForm(f => ({ ...f, check_in: e.target.value }))} required
                  className="w-full bg-transparent border-0 border-b border-[rgba(122,112,94,0.3)] px-0 py-2 text-[0.85rem] outline-none" />
              </div>
              <div>
                <label className="block text-[0.62rem] uppercase tracking-[0.14em] text-[rgba(75,71,65,0.55)] mb-1">Check Out</label>
                <input type="date" value={bookingForm.check_out} onChange={e => setBookingForm(f => ({ ...f, check_out: e.target.value }))} required
                  className="w-full bg-transparent border-0 border-b border-[rgba(122,112,94,0.3)] px-0 py-2 text-[0.85rem] outline-none" />
              </div>
              <div>
                <label className="block text-[0.62rem] uppercase tracking-[0.14em] text-[rgba(75,71,65,0.55)] mb-1">Rate / Night (R)</label>
                <input type="number" min="0" step="0.01" value={bookingForm.rate_per_night} onChange={e => setBookingForm(f => ({ ...f, rate_per_night: e.target.value }))}
                  className="w-full bg-transparent border-0 border-b border-[rgba(122,112,94,0.3)] px-0 py-2 text-[0.85rem] outline-none" />
              </div>
            </div>
            {isAdmin && bookingForm.check_in && bookingForm.check_out && bookingForm.rate_per_night && (
              <div className="rounded-xl bg-[rgba(107,127,94,0.08)] px-4 py-3 mb-4 flex justify-between items-center">
                <span className="text-[0.7rem] uppercase tracking-[0.1em] text-[rgba(75,71,65,0.5)]">
                  {Math.max(0, Math.round((new Date(bookingForm.check_out) - new Date(bookingForm.check_in)) / 86400000))} nights
                </span>
                <span className="text-xl font-light text-[#6b7f5e]">
                  {formatCurrency(Math.max(0, Math.round((new Date(bookingForm.check_out) - new Date(bookingForm.check_in)) / 86400000)) * Number(bookingForm.rate_per_night))}
                </span>
              </div>
            )}
            <button type="submit" disabled={bookSaving} className="rounded-full px-6 py-2.5 text-[0.68rem] uppercase tracking-[0.12em] bg-[rgba(107,127,94,0.85)] text-white">
              {bookSaving ? 'Saving…' : 'Log Booking'}
            </button>
          </form>

          {/* Bookings list */}
          {(bookings || []).length > 0 && (
            <div className="mt-5 pt-4 border-t border-[rgba(122,112,94,0.1)]">
              <p className="text-[0.6rem] uppercase tracking-[0.12em] text-[rgba(75,71,65,0.4)] mb-3">Bookings This Month</p>
              {(bookings || []).map(b => (
                <div key={b.id} className="flex items-center justify-between py-2.5 border-b border-[rgba(122,112,94,0.08)] last:border-0">
                  <div>
                    <p className="text-[0.82rem] font-medium text-[#2b2b2b]">{b.guest_name}</p>
                    <p className="text-[0.68rem] text-[rgba(75,71,65,0.5)]">{b.vg_units?.name} · {formatDate(b.check_in)} → {formatDate(b.check_out)} · {b.nights}n</p>
                  </div>
                  {isAdmin && <p className="text-[0.82rem] font-light text-[#6b7f5e]">{formatCurrency(b.total)}</p>}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Maintenance costs (admin only) */}
        {isAdmin && (
          <section className="rounded-2xl border border-[rgba(122,112,94,0.2)] bg-[rgba(255,252,247,0.95)] p-6">
            <p className="text-[0.65rem] uppercase tracking-[0.18em] text-[rgba(75,71,65,0.5)] mb-5">Maintenance Costs</p>
            <form onSubmit={logCost}>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-5 mb-4">
                <div>
                  <label className="block text-[0.62rem] uppercase tracking-[0.14em] text-[rgba(75,71,65,0.55)] mb-1">Unit</label>
                  <select value={costForm.unit_id} onChange={e => setCostForm(f => ({ ...f, unit_id: e.target.value }))}
                    className="w-full bg-transparent border-0 border-b border-[rgba(122,112,94,0.3)] px-0 py-2 text-[0.85rem] outline-none">
                    <option value="">All / General</option>
                    {(units||[]).map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[0.62rem] uppercase tracking-[0.14em] text-[rgba(75,71,65,0.55)] mb-1">Date</label>
                  <input type="date" value={costForm.date} onChange={e => setCostForm(f => ({ ...f, date: e.target.value }))}
                    className="w-full bg-transparent border-0 border-b border-[rgba(122,112,94,0.3)] px-0 py-2 text-[0.85rem] outline-none" />
                </div>
                <div>
                  <label className="block text-[0.62rem] uppercase tracking-[0.14em] text-[rgba(75,71,65,0.55)] mb-1">Category</label>
                  <select value={costForm.category} onChange={e => setCostForm(f => ({ ...f, category: e.target.value }))}
                    className="w-full bg-transparent border-0 border-b border-[rgba(122,112,94,0.3)] px-0 py-2 text-[0.85rem] outline-none">
                    {['maintenance','cleaning','supplies','repairs','other'].map(c => <option key={c} value={c}>{capitalize(c)}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-[0.62rem] uppercase tracking-[0.14em] text-[rgba(75,71,65,0.55)] mb-1">Description</label>
                  <input type="text" value={costForm.description} onChange={e => setCostForm(f => ({ ...f, description: e.target.value }))}
                    className="w-full bg-transparent border-0 border-b border-[rgba(122,112,94,0.3)] px-0 py-2 text-[0.85rem] outline-none" />
                </div>
                <div>
                  <label className="block text-[0.62rem] uppercase tracking-[0.14em] text-[rgba(75,71,65,0.55)] mb-1">Amount (R)</label>
                  <input type="number" min="0" step="0.01" value={costForm.amount} onChange={e => setCostForm(f => ({ ...f, amount: e.target.value }))} required
                    className="w-full bg-transparent border-0 border-b border-[rgba(122,112,94,0.3)] px-0 py-2 text-[0.85rem] outline-none" />
                </div>
              </div>
              <button type="submit" disabled={costSaving} className="rounded-full px-6 py-2.5 text-[0.68rem] uppercase tracking-[0.12em] bg-[rgba(107,127,94,0.85)] text-white">
                {costSaving ? 'Logging…' : 'Log Cost'}
              </button>
            </form>
            {(unitCosts || []).length > 0 && (
              <div className="mt-4 pt-4 border-t border-[rgba(122,112,94,0.1)] space-y-2">
                {(unitCosts||[]).slice(0,6).map(c => (
                  <div key={c.id} className="flex justify-between text-[0.8rem] py-1.5 border-b border-[rgba(122,112,94,0.06)]">
                    <div><p className="text-[#2b2b2b]">{c.description}</p><p className="text-[0.68rem] text-[rgba(75,71,65,0.5)]">{c.vg_units?.name || 'General'} · {formatDate(c.date)}</p></div>
                    <p className="text-[#c2a66d]">{formatCurrency(c.amount)}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Staff */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <p className="text-[0.6rem] uppercase tracking-[0.2em] text-[rgba(75,71,65,0.45)]">Staff — {MS[month-1]} {year}</p>
            {isAdmin && <button onClick={() => setStaffModal({ staff: null })} className="rounded-full px-4 py-1.5 text-[0.62rem] uppercase tracking-[0.1em] bg-[rgba(107,127,94,0.85)] text-white shadow-none hover:scale-100">+ Add Staff</button>}
          </div>
          {!(staff || []).length ? (
            <p className="text-[0.8rem] text-[rgba(75,71,65,0.4)] italic">No staff added yet</p>
          ) : (
            <div className="rounded-2xl border border-[rgba(122,112,94,0.2)] bg-[rgba(255,252,247,0.95)] px-5 py-2">
              {(staff || []).map(s => (
                <StaffLogRow key={s.id} staff={s} log={logByStaffId[s.id]} year={year} month={month} isAdmin={isAdmin} />
              ))}
              {isAdmin && (
                <div className="flex justify-end py-3 border-t border-[rgba(122,112,94,0.1)] mt-2">
                  <div className="text-right">
                    <p className="text-[0.6rem] uppercase tracking-[0.12em] text-[rgba(75,71,65,0.45)]">Total Staff Cost</p>
                    <p className="text-xl font-light text-[#c2a66d]">{formatCurrency(totalStaffCost)}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      {unitModal && <UnitModal unit={unitModal.unit} onClose={() => setUnitModal(null)} onSaved={() => setUnitModal(null)} />}
      {staffModal && <StaffModal staff={staffModal.staff} onClose={() => setStaffModal(null)} onSaved={() => setStaffModal(null)} />}
    </div>
  );
}
