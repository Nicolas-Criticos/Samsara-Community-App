import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase.js';
import { useAuthSession } from '../../../hooks/useAuthSession.js';
import { formatDate, formatCurrency } from '../../../lib/vg/helpers.js';

const CATEGORIES = [
  { key: 'Filters', icon: '🔧' },
  { key: 'Gas', icon: '⛽' },
  { key: 'Diesel', icon: '🛢️' },
  { key: 'Water', icon: '💧' },
  { key: 'Electrical', icon: '⚡' },
  { key: 'Other', icon: '📦' },
];

const CATEGORY_ICON = Object.fromEntries(CATEGORIES.map(c => [c.key, c.icon]));

export default function VgInventory() {
  const { data: session } = useAuthSession();
  const userId = session?.user?.id;
  const qc = useQueryClient();

  const [categoryFilter, setCategoryFilter] = useState('All');
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // ─── Form state ───
  const emptyForm = { category: 'Filters', item_name: '', location: '', quantity: '', unit: 'litres', cost: '', installed_date: new Date().toISOString().slice(0, 10), next_due_date: '', notes: '' };
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  // ─── Queries ───
  const { data: logs, isLoading } = useQuery({
    queryKey: ['vg', 'inventory'],
    queryFn: () => supabase.from('vg_inventory_logs').select('*').order('created_at', { ascending: false }).then(r => r.data || []),
  });

  // ─── Filtered data ───
  const filtered = useMemo(() => {
    if (!logs) return [];
    if (categoryFilter === 'All') return logs;
    return logs.filter(l => l.category === categoryFilter);
  }, [logs, categoryFilter]);

  // ─── Stats ───
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const thisMonthLogs = useMemo(() => (logs || []).filter(l => l.created_at >= thisMonthStart), [logs, thisMonthStart]);
  const thisMonthCost = useMemo(() => thisMonthLogs.reduce((s, l) => s + (Number(l.cost) || 0), 0), [thisMonthLogs]);
  const dieselLitresThisMonth = useMemo(() => thisMonthLogs
    .filter(l => l.category === 'Diesel')
    .reduce((s, l) => s + (Number(l.quantity) || 0), 0), [thisMonthLogs]);

  const nextDue = useMemo(() => {
    const future = (logs || []).filter(l => l.next_due_date && l.next_due_date >= new Date().toISOString().slice(0, 10));
    future.sort((a, b) => a.next_due_date.localeCompare(b.next_due_date));
    return future[0] || null;
  }, [logs]);

  // ─── Group by month ───
  const grouped = useMemo(() => {
    const map = new Map();
    for (const l of filtered) {
      const month = l.created_at ? l.created_at.slice(0, 7) : 'Unknown';
      if (!map.has(month)) map.set(month, []);
      map.get(month).push(l);
    }
    return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [filtered]);

  // ─── Replacement intervals ───
  const replacementStats = useMemo(() => {
    const byLocation = {};
    for (const l of logs || []) {
      if (!l.item_name || !l.location) continue;
      const key = `${l.item_name}::${l.location}`;
      if (!byLocation[key]) byLocation[key] = [];
      byLocation[key].push(new Date(l.created_at));
    }
    const stats = [];
    for (const [key, dates] of Object.entries(byLocation)) {
      if (dates.length < 2) continue;
      dates.sort((a, b) => a - b);
      const gaps = [];
      for (let i = 1; i < dates.length; i++) {
        gaps.push(Math.round((dates[i] - dates[i - 1]) / 86400000));
      }
      const [itemName, location] = key.split('::');
      stats.push({ itemName, location, count: dates.length, avgDays: Math.round(gaps.reduce((s, g) => s + g, 0) / gaps.length), gaps });
    }
    return stats;
  }, [logs]);

  // ─── Actions ───
  function openNewForm() {
    setForm({ ...emptyForm, installed_date: new Date().toISOString().slice(0, 10) });
    setEditingEntry(null);
    setShowForm(true);
  }

  function openEdit(entry) {
    setForm({
      category: entry.category || 'Filters',
      item_name: entry.item_name || '',
      location: entry.location || '',
      quantity: entry.quantity != null ? String(entry.quantity) : '',
      unit: entry.unit || 'litres',
      cost: entry.cost != null ? String(entry.cost) : '',
      installed_date: entry.installed_date || '',
      next_due_date: entry.next_due_date || '',
      notes: entry.notes || '',
    });
    setEditingEntry(entry);
    setShowForm(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!form.item_name.trim()) return;
    setSaving(true);
    try {
      const row = {
        category: form.category,
        item_name: form.item_name.trim(),
        location: form.location.trim() || null,
        quantity: form.quantity ? Number(form.quantity) : null,
        unit: form.unit || null,
        cost: form.cost ? Number(form.cost) : null,
        installed_date: form.installed_date || null,
        next_due_date: form.next_due_date || null,
        notes: form.notes.trim() || null,
      };
      if (editingEntry) {
        await supabase.from('vg_inventory_logs').update(row).eq('id', editingEntry.id);
      } else {
        row.created_by = userId;
        await supabase.from('vg_inventory_logs').insert(row);
      }
      qc.invalidateQueries({ queryKey: ['vg', 'inventory'] });
      setShowForm(false);
      setForm(emptyForm);
      setEditingEntry(null);
    } finally { setSaving(false); }
  }

  async function handleDelete(id) {
    await supabase.from('vg_inventory_logs').delete().eq('id', id);
    qc.invalidateQueries({ queryKey: ['vg', 'inventory'] });
    setDeleteConfirm(null);
  }

  const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      {/* Header */}
      <div className="border-b border-[rgba(122,112,94,0.12)] bg-[rgba(255,252,247,0.8)] backdrop-blur-sm px-4 sm:px-6 py-4 sm:py-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-[0.6rem] uppercase tracking-[0.2em] text-[rgba(75,71,65,0.45)] mb-1">VrischGewagt</p>
            <h1 className="text-xl font-light text-[#2b2b2b] tracking-wide">Inventory & Consumables</h1>
          </div>
          <button onClick={openNewForm} className="rounded-full px-4 py-2 text-[0.65rem] uppercase tracking-[0.12em] bg-[rgba(107,127,94,0.85)] text-white shadow-none hover:scale-100">+ Log Entry</button>
        </div>

        {/* Category filter pills */}
        <div className="flex gap-1 overflow-x-auto">
          <button onClick={() => setCategoryFilter('All')}
            className={`rounded-full px-2.5 py-1 text-[0.6rem] uppercase tracking-[0.08em] transition-all shadow-none hover:scale-100 whitespace-nowrap ${
              categoryFilter === 'All' ? 'bg-[rgba(122,112,94,0.18)] text-[rgba(43,43,43,0.9)]' : 'bg-transparent text-[rgba(75,71,65,0.45)] hover:bg-[rgba(122,112,94,0.08)]'
            }`}>All</button>
          {CATEGORIES.map(c => (
            <button key={c.key} onClick={() => setCategoryFilter(c.key)}
              className={`rounded-full px-2.5 py-1 text-[0.6rem] uppercase tracking-[0.08em] transition-all shadow-none hover:scale-100 whitespace-nowrap ${
                categoryFilter === c.key ? 'bg-[rgba(122,112,94,0.18)] text-[rgba(43,43,43,0.9)]' : 'bg-transparent text-[rgba(75,71,65,0.45)] hover:bg-[rgba(122,112,94,0.08)]'
              }`}>{c.icon} {c.key}</button>
          ))}
        </div>
      </div>

      <div className="p-4 sm:p-6 max-w-6xl space-y-5">
        {/* Stats cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl border border-[rgba(122,112,94,0.15)] bg-[rgba(255,252,247,0.8)] px-5 py-3">
            <p className="text-xl font-light text-[#6b7f5e]">{thisMonthLogs.length}</p>
            <p className="text-[0.58rem] uppercase tracking-[0.12em] text-[rgba(75,71,65,0.45)]">Entries This Month</p>
          </div>
          <div className="rounded-xl border border-[rgba(122,112,94,0.15)] bg-[rgba(255,252,247,0.8)] px-5 py-3">
            <p className="text-xl font-light text-[#c2a66d]">{formatCurrency(thisMonthCost)}</p>
            <p className="text-[0.58rem] uppercase tracking-[0.12em] text-[rgba(75,71,65,0.45)]">Cost This Month</p>
          </div>
          <div className="rounded-xl border border-[rgba(122,112,94,0.15)] bg-[rgba(255,252,247,0.8)] px-5 py-3">
            <p className="text-xl font-light text-[#2b2b2b]">{dieselLitresThisMonth} L</p>
            <p className="text-[0.58rem] uppercase tracking-[0.12em] text-[rgba(75,71,65,0.45)]">Diesel This Month</p>
          </div>
          <div className="rounded-xl border border-[rgba(122,112,94,0.15)] bg-[rgba(255,252,247,0.8)] px-5 py-3">
            <p className="text-xl font-light text-[#2b2b2b]">{nextDue ? `${nextDue.item_name}` : '—'}</p>
            <p className="text-[0.58rem] uppercase tracking-[0.12em] text-[rgba(75,71,65,0.45)]">{nextDue ? `Next: ${formatDate(nextDue.next_due_date)}` : 'Nothing Due'}</p>
          </div>
        </div>

        {/* Add/Edit Form */}
        {showForm && (
          <form onSubmit={handleSave} className="rounded-2xl border border-[rgba(122,112,94,0.2)] bg-[rgba(255,252,247,0.95)] p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[0.82rem] font-medium text-[#2b2b2b]">{editingEntry ? 'Edit Entry' : 'New Entry'}</h3>
              <button type="button" onClick={() => { setShowForm(false); setEditingEntry(null); }} className="bg-transparent p-0 text-xl text-[rgba(75,71,65,0.35)] shadow-none rounded-none hover:scale-100">×</button>
            </div>
            <div className="grid grid-cols-12 gap-3 mb-4">
              {/* Category */}
              <div className="col-span-6 sm:col-span-3">
                <label className="block text-[0.58rem] uppercase tracking-[0.1em] text-[rgba(75,71,65,0.45)] mb-1">Category</label>
                <select value={form.category} onChange={e => setForm(f => ({...f, category: e.target.value}))}
                  className="w-full bg-transparent border-0 border-b border-[rgba(122,112,94,0.28)] px-0 py-2 text-[0.82rem] outline-none">
                  {CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.icon} {c.key}</option>)}
                </select>
              </div>
              {/* Item Name */}
              <div className="col-span-6 sm:col-span-3">
                <label className="block text-[0.58rem] uppercase tracking-[0.1em] text-[rgba(75,71,65,0.45)] mb-1">Item Name</label>
                <input value={form.item_name} onChange={e => setForm(f => ({...f, item_name: e.target.value}))} required placeholder="e.g. Fuel filter"
                  className="w-full bg-transparent border-0 border-b border-[rgba(122,112,94,0.28)] px-0 py-2 text-[0.82rem] outline-none" />
              </div>
              {/* Location */}
              <div className="col-span-6 sm:col-span-3">
                <label className="block text-[0.58rem] uppercase tracking-[0.1em] text-[rgba(75,71,65,0.45)] mb-1">Location</label>
                <input value={form.location} onChange={e => setForm(f => ({...f, location: e.target.value}))} placeholder="Cottage 3 bathroom"
                  className="w-full bg-transparent border-0 border-b border-[rgba(122,112,94,0.28)] px-0 py-2 text-[0.82rem] outline-none" />
              </div>
              {/* Quantity + Unit */}
              <div className="col-span-3 sm:col-span-1.5">
                <label className="block text-[0.58rem] uppercase tracking-[0.1em] text-[rgba(75,71,65,0.45)] mb-1">Qty</label>
                <input type="number" step="0.01" min="0" value={form.quantity} onChange={e => setForm(f => ({...f, quantity: e.target.value}))} placeholder="0"
                  className="w-full bg-transparent border-0 border-b border-[rgba(122,112,94,0.28)] px-0 py-2 text-[0.82rem] outline-none" />
              </div>
              <div className="col-span-3 sm:col-span-1.5">
                <label className="block text-[0.58rem] uppercase tracking-[0.1em] text-[rgba(75,71,65,0.45)] mb-1">Unit</label>
                <select value={form.unit} onChange={e => setForm(f => ({...f, unit: e.target.value}))}
                  className="w-full bg-transparent border-0 border-b border-[rgba(122,112,94,0.28)] px-0 py-2 text-[0.82rem] outline-none">
                  {['litres','units','kg','packs','bottles','metres','hours','other'].map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              {/* Cost */}
              <div className="col-span-4 sm:col-span-2">
                <label className="block text-[0.58rem] uppercase tracking-[0.1em] text-[rgba(75,71,65,0.45)] mb-1">Cost (R)</label>
                <input type="number" step="0.01" min="0" value={form.cost} onChange={e => setForm(f => ({...f, cost: e.target.value}))} placeholder="0"
                  className="w-full bg-transparent border-0 border-b border-[rgba(122,112,94,0.28)] px-0 py-2 text-[0.82rem] outline-none" />
              </div>
              {/* Installed Date */}
              <div className="col-span-4 sm:col-span-2">
                <label className="block text-[0.58rem] uppercase tracking-[0.1em] text-[rgba(75,71,65,0.45)] mb-1">Date Installed</label>
                <input type="date" value={form.installed_date} onChange={e => setForm(f => ({...f, installed_date: e.target.value}))}
                  className="w-full bg-transparent border-0 border-b border-[rgba(122,112,94,0.28)] px-0 py-2 text-[0.82rem] outline-none" />
              </div>
              {/* Next Due Date */}
              <div className="col-span-4 sm:col-span-2">
                <label className="block text-[0.58rem] uppercase tracking-[0.1em] text-[rgba(75,71,65,0.45)] mb-1">Next Due</label>
                <input type="date" value={form.next_due_date} onChange={e => setForm(f => ({...f, next_due_date: e.target.value}))}
                  className="w-full bg-transparent border-0 border-b border-[rgba(122,112,94,0.28)] px-0 py-2 text-[0.82rem] outline-none" />
              </div>
              {/* Notes */}
              <div className="col-span-12">
                <label className="block text-[0.58rem] uppercase tracking-[0.1em] text-[rgba(75,71,65,0.45)] mb-1">Notes</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} rows={2} placeholder="Optional notes…"
                  className="w-full bg-transparent border border-[rgba(122,112,94,0.18)] rounded-xl px-3 py-2 text-[0.8rem] outline-none resize-none" />
              </div>
            </div>
            <button type="submit" disabled={saving || !form.item_name.trim()}
              className="rounded-full px-5 py-2 text-[0.65rem] uppercase tracking-[0.12em] bg-[rgba(107,127,94,0.85)] text-white shadow-none hover:scale-100 disabled:opacity-50">
              {saving ? 'Saving…' : editingEntry ? 'Update Entry' : 'Save Entry'}
            </button>
          </form>
        )}

        {/* Replacement stats */}
        {replacementStats.length > 0 && (
          <div className="rounded-2xl border border-[rgba(122,112,94,0.2)] bg-[rgba(255,252,247,0.95)] overflow-hidden">
            <div className="px-4 py-3 border-b border-[rgba(122,112,94,0.1)] bg-[rgba(248,244,236,0.9)]">
              <p className="text-[0.6rem] uppercase tracking-[0.14em] text-[rgba(75,71,65,0.5)]">Replacement Intervals</p>
            </div>
            <div className="divide-y divide-[rgba(122,112,94,0.08)]">
              {replacementStats.map((stat, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-2.5">
                  <div>
                    <p className="text-[0.78rem] text-[#2b2b2b]">{stat.itemName}</p>
                    <p className="text-[0.62rem] text-[rgba(75,71,65,0.45)]">{stat.location}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[0.78rem] font-medium text-[#6b7f5e]">~{stat.avgDays} days</p>
                    <p className="text-[0.58rem] text-[rgba(75,71,65,0.4)]">{stat.count} replacements</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Delete confirm modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(44,42,37,0.4)] backdrop-blur-sm p-4" onClick={() => setDeleteConfirm(null)}>
            <div className="bg-[rgba(255,252,247,0.98)] rounded-2xl border border-[rgba(122,112,94,0.2)] p-6 max-w-sm w-full shadow-xl" onClick={e => e.stopPropagation()}>
              <p className="text-[0.85rem] text-[#2b2b2b] mb-3">Delete this entry?</p>
              <p className="text-[0.72rem] text-[rgba(75,71,65,0.5)] mb-5">"{deleteConfirm.item_name}" — this cannot be undone.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteConfirm(null)}
                  className="flex-1 rounded-full py-2 text-[0.65rem] uppercase tracking-[0.1em] border border-[rgba(122,112,94,0.2)] bg-transparent text-[rgba(75,71,65,0.6)] shadow-none hover:scale-100">Cancel</button>
                <button onClick={() => handleDelete(deleteConfirm.id)}
                  className="flex-1 rounded-full py-2 text-[0.65rem] uppercase tracking-[0.1em] bg-[rgba(194,100,80,0.85)] text-white shadow-none hover:scale-100">Delete</button>
              </div>
            </div>
          </div>
        )}

        {/* Log entries grouped by month */}
        {isLoading ? (
          <p className="text-center text-[0.82rem] text-[rgba(75,71,65,0.35)] py-10">Loading…</p>
        ) : grouped.length === 0 ? (
          <p className="text-center text-[0.82rem] text-[rgba(75,71,65,0.35)] py-10">No inventory entries yet. Tap "+ Log Entry" to add one.</p>
        ) : (
          <div className="space-y-6">
            {grouped.map(([month, entries]) => {
              const [y, m] = month.split('-');
              return (
                <div key={month}>
                  <p className="text-[0.65rem] uppercase tracking-[0.14em] text-[rgba(75,71,65,0.5)] mb-2 px-1">{MONTH_NAMES[Number(m) - 1]} {y}</p>
                  <div className="space-y-1.5">
                    {entries.map(entry => (
                      <div key={entry.id} onClick={() => openEdit(entry)}
                        className="rounded-xl border border-[rgba(122,112,94,0.12)] bg-[rgba(255,252,247,0.9)] px-4 py-3 cursor-pointer hover:bg-[rgba(122,112,94,0.03)] transition-colors flex items-center gap-3 group">
                        <span className="text-lg shrink-0">{CATEGORY_ICON[entry.category] || '📦'}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-[0.8rem] font-medium text-[#2b2b2b] truncate">{entry.item_name}</p>
                            {entry.quantity && <span className="text-[0.65rem] text-[rgba(75,71,65,0.5)] shrink-0">{entry.quantity} {entry.unit}</span>}
                          </div>
                          <div className="flex items-center gap-2 text-[0.62rem] text-[rgba(75,71,65,0.4)]">
                            {entry.location && <span>{entry.location}</span>}
                            {entry.installed_date && <span>· {formatDate(entry.installed_date)}</span>}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          {entry.cost != null && <p className="text-[0.75rem] font-medium text-[#6b7f5e]">{formatCurrency(entry.cost)}</p>}
                          <button onClick={e => { e.stopPropagation(); setDeleteConfirm(entry); }}
                            className="opacity-0 group-hover:opacity-100 bg-transparent shadow-none rounded-none p-0 text-[rgba(75,71,65,0.3)] hover:text-[#8b4a4a] hover:scale-100 text-xs transition-opacity">Delete</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
