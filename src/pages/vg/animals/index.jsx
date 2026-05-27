import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';
import { fetchLivestockMonthly, upsertLivestockMonthly, fetchLivestockRegistry, insertLivestockRegistry, updateLivestockRegistry } from '../../../lib/vg/api.js';
import { ANIMAL_TYPES, MONTH_SHORT } from '../../../lib/vg/constants.js';
import { currentYearMonth, prevMonth, nextMonth, last12Months, formatDate, capitalize } from '../../../lib/vg/helpers.js';
import { useAuthSession } from '../../../hooks/useAuthSession.js';

function PageHeader({ animalType, setAnimalType, year, month, onPrev, onNext }) {
  return (
    <div className="border-b border-[rgba(122,112,94,0.12)] bg-[rgba(255,252,247,0.8)] backdrop-blur-sm px-6 py-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[0.6rem] uppercase tracking-[0.2em] text-[rgba(75,71,65,0.45)] mb-1">VrischGewagt</p>
          <h1 className="text-xl font-light text-[#2b2b2b] tracking-wide">Animals</h1>
        </div>
        {/* Month nav */}
        <div className="flex items-center gap-3">
          <button onClick={onPrev} className="rounded-lg px-3 py-1.5 text-sm bg-transparent text-[rgba(75,71,65,0.6)] hover:bg-[rgba(122,112,94,0.1)]">←</button>
          <span className="text-[0.78rem] font-medium text-[#2b2b2b] w-24 text-center">{MONTH_SHORT[month - 1]} {year}</span>
          <button onClick={onNext} className="rounded-lg px-3 py-1.5 text-sm bg-transparent text-[rgba(75,71,65,0.6)] hover:bg-[rgba(122,112,94,0.1)]">→</button>
        </div>
      </div>
      {/* Type toggle */}
      <div className="flex gap-2">
        {Object.entries(ANIMAL_TYPES).map(([key, val]) => (
          <button
            key={key}
            onClick={() => setAnimalType(key)}
            className={`rounded-full px-4 py-1.5 text-[0.68rem] uppercase tracking-[0.12em] transition-all ${
              animalType === key
                ? 'bg-[rgba(122,112,94,0.18)] text-[rgba(43,43,43,0.9)]'
                : 'bg-transparent text-[rgba(75,71,65,0.5)] hover:bg-[rgba(122,112,94,0.08)]'
            }`}
          >
            {val.icon} {val.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function LivestockInputModal({ animalType, category, year, month, existing, onClose, onSaved }) {
  const { data: session } = useAuthSession();
  const qc = useQueryClient();
  const [form, setForm] = useState({
    opening_count: existing?.opening_count ?? 0,
    births: existing?.births ?? 0,
    deaths: existing?.deaths ?? 0,
    slaughtered: existing?.slaughtered ?? 0,
    sold: existing?.sold ?? 0,
    purchased: existing?.purchased ?? 0,
    notes: existing?.notes ?? '',
  });
  const [saving, setSaving] = useState(false);

  const closing = form.opening_count + form.births + form.purchased - form.deaths - form.slaughtered - form.sold;

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await upsertLivestockMonthly({
        year, month,
        animal_type: animalType,
        category,
        opening_count: Number(form.opening_count),
        births: Number(form.births),
        deaths: Number(form.deaths),
        slaughtered: Number(form.slaughtered),
        sold: Number(form.sold),
        purchased: Number(form.purchased),
        notes: form.notes,
        created_by: session?.user?.id,
      });
      qc.invalidateQueries({ queryKey: ['vg', 'livestock', animalType, year, month] });
      qc.invalidateQueries({ queryKey: ['vg', 'livestock', 'chart', animalType] });
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  const field = (label, key) => (
    <div>
      <label className="block text-[0.62rem] uppercase tracking-[0.14em] text-[rgba(75,71,65,0.55)] mb-1">{label}</label>
      <input
        type="number"
        min="0"
        value={form[key]}
        onChange={e => setForm(f => ({ ...f, [key]: Number(e.target.value) }))}
        className="w-full bg-transparent border-0 border-b border-[rgba(122,112,94,0.3)] px-0 py-2 text-[0.9rem] text-[#2b2b2b] outline-none focus:border-[rgba(107,127,94,0.6)]"
      />
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(44,42,37,0.4)] backdrop-blur-sm p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <form onSubmit={handleSave} className="bg-[rgba(255,252,247,0.98)] rounded-2xl border border-[rgba(122,112,94,0.2)] p-8 w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-light text-[#2b2b2b]">{capitalize(category)} — {MONTH_SHORT[month-1]} {year}</h2>
          <button type="button" onClick={onClose} className="bg-transparent p-0 text-2xl text-[rgba(75,71,65,0.4)] hover:text-[rgba(75,71,65,0.8)] shadow-none rounded-none hover:scale-100">×</button>
        </div>
        <div className="grid grid-cols-2 gap-5 mb-5">
          {field('Opening Count', 'opening_count')}
          {field('Births', 'births')}
          {field('Deaths', 'deaths')}
          {field('Slaughtered', 'slaughtered')}
          {field('Sold', 'sold')}
          {field('Purchased', 'purchased')}
        </div>
        <div className="rounded-xl bg-[rgba(107,127,94,0.08)] px-4 py-3 mb-5 flex items-center justify-between">
          <span className="text-[0.72rem] uppercase tracking-[0.12em] text-[rgba(75,71,65,0.6)]">Closing Count</span>
          <span className="text-xl font-light text-[#6b7f5e]">{closing}</span>
        </div>
        <div className="mb-6">
          <label className="block text-[0.62rem] uppercase tracking-[0.14em] text-[rgba(75,71,65,0.55)] mb-1">Notes</label>
          <textarea
            value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            rows={2}
            className="w-full bg-transparent border border-[rgba(122,112,94,0.2)] rounded-xl px-3 py-2 text-[0.85rem] outline-none resize-none"
          />
        </div>
        <button type="submit" disabled={saving} className="w-full rounded-full py-3 text-[0.7rem] uppercase tracking-[0.14em] bg-[rgba(107,127,94,0.85)] text-white">
          {saving ? 'Saving…' : 'Save'}
        </button>
      </form>
    </div>
  );
}

function CategoryCard({ row, category, animalType, year, month, onEdit }) {
  return (
    <div className="rounded-2xl border border-[rgba(122,112,94,0.2)] bg-[rgba(255,252,247,0.95)] p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[0.78rem] uppercase tracking-[0.12em] font-semibold text-[#2b2b2b]">{capitalize(category)}</h3>
        <button onClick={() => onEdit(category)} className="rounded-full px-3 py-1 text-[0.62rem] uppercase tracking-[0.1em] bg-transparent border border-[rgba(122,112,94,0.3)] text-[rgba(75,71,65,0.6)] hover:bg-[rgba(122,112,94,0.1)] shadow-none hover:scale-100">
          {row ? 'Edit' : 'Log'}
        </button>
      </div>
      {row ? (
        <div className="space-y-2">
          <div className="flex justify-between text-[0.78rem]">
            <span className="text-[rgba(75,71,65,0.55)]">Opening</span>
            <span className="text-[#2b2b2b] font-medium">{row.opening_count}</span>
          </div>
          {row.births > 0 && <div className="flex justify-between text-[0.78rem]"><span className="text-[rgba(75,71,65,0.55)]">+ Births</span><span className="text-[#6b7f5e]">+{row.births}</span></div>}
          {row.purchased > 0 && <div className="flex justify-between text-[0.78rem]"><span className="text-[rgba(75,71,65,0.55)]">+ Purchased</span><span className="text-[#6b7f5e]">+{row.purchased}</span></div>}
          {row.deaths > 0 && <div className="flex justify-between text-[0.78rem]"><span className="text-[rgba(75,71,65,0.55)]">− Deaths</span><span className="text-[#8b4a4a]">−{row.deaths}</span></div>}
          {row.slaughtered > 0 && <div className="flex justify-between text-[0.78rem]"><span className="text-[rgba(75,71,65,0.55)]">− Slaughtered</span><span className="text-[#8b4a4a]">−{row.slaughtered}</span></div>}
          {row.sold > 0 && <div className="flex justify-between text-[0.78rem]"><span className="text-[rgba(75,71,65,0.55)]">− Sold</span><span className="text-[#c2a66d]">−{row.sold}</span></div>}
          <div className="border-t border-[rgba(122,112,94,0.15)] pt-2 flex justify-between">
            <span className="text-[0.78rem] text-[rgba(75,71,65,0.7)] font-semibold">Closing</span>
            <span className="text-lg font-light text-[#6b7f5e]">{row.closing_count}</span>
          </div>
        </div>
      ) : (
        <p className="text-[0.75rem] text-[rgba(75,71,65,0.4)] italic">No data logged yet</p>
      )}
    </div>
  );
}

function AnimalRegistrySection({ animalType }) {
  const [open, setOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const { data: session } = useAuthSession();
  const qc = useQueryClient();

  const { data: animals } = useQuery({
    queryKey: ['vg', 'registry', animalType],
    queryFn: () => fetchLivestockRegistry(animalType).then(r => r.data || []),
    enabled: open,
  });

  const [form, setForm] = useState({ tag_id: '', name: '', category: '', birth_date: '', status: 'active', notes: '' });

  async function saveAnimal(e) {
    e.preventDefault();
    const row = { ...form, animal_type: animalType };
    if (editing) {
      await updateLivestockRegistry(editing.id, row);
    } else {
      await insertLivestockRegistry(row);
    }
    qc.invalidateQueries({ queryKey: ['vg', 'registry', animalType] });
    setShowModal(false);
    setEditing(null);
    setForm({ tag_id: '', name: '', category: '', birth_date: '', status: 'active', notes: '' });
  }

  const categories = ANIMAL_TYPES[animalType]?.categories || [];

  return (
    <section className="mt-8">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 bg-transparent shadow-none text-[0.7rem] uppercase tracking-[0.14em] text-[rgba(75,71,65,0.6)] hover:text-[rgba(43,43,43,0.8)] rounded-none px-0 py-0 hover:scale-100"
      >
        <span>{open ? '▾' : '▸'}</span> Individual Registry ({ANIMAL_TYPES[animalType]?.label})
      </button>

      {open && (
        <div className="mt-4 rounded-2xl border border-[rgba(122,112,94,0.2)] bg-[rgba(255,252,247,0.95)] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-[rgba(122,112,94,0.1)]">
            <p className="text-[0.68rem] uppercase tracking-[0.14em] text-[rgba(75,71,65,0.5)]">{(animals || []).length} animals</p>
            <button onClick={() => { setEditing(null); setForm({ tag_id: '', name: '', category: categories[0] || '', birth_date: '', status: 'active', notes: '' }); setShowModal(true); }} className="rounded-full px-4 py-1.5 text-[0.62rem] uppercase tracking-[0.1em] bg-[rgba(107,127,94,0.85)] text-white shadow-none hover:scale-100">
              + Add Animal
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-[0.6rem] uppercase tracking-[0.12em] text-[rgba(75,71,65,0.5)] bg-[rgba(248,244,236,0.8)]">
                <tr>
                  {['Tag ID', 'Name', 'Category', 'Status', 'Birth Date', 'Notes'].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left font-semibold border-b border-[rgba(122,112,94,0.1)]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(animals || []).map((a, i, arr) => (
                  <tr key={a.id} onClick={() => { setEditing(a); setForm({ tag_id: a.tag_id || '', name: a.name || '', category: a.category, birth_date: a.birth_date || '', status: a.status, notes: a.notes || '' }); setShowModal(true); }}
                    className={`cursor-pointer hover:bg-[rgba(122,112,94,0.04)] ${i < arr.length - 1 ? 'border-b border-[rgba(122,112,94,0.08)]' : ''}`}>
                    <td className="px-4 py-3 text-[0.8rem] font-medium">{a.tag_id || '—'}</td>
                    <td className="px-4 py-3 text-[0.8rem]">{a.name || '—'}</td>
                    <td className="px-4 py-3 text-[0.8rem]">{capitalize(a.category)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[0.6rem] uppercase tracking-wide font-semibold ${a.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-600'}`}>
                        {a.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[0.8rem] text-[rgba(75,71,65,0.6)]">{formatDate(a.birth_date)}</td>
                    <td className="px-4 py-3 text-[0.8rem] text-[rgba(75,71,65,0.6)] max-w-[160px] truncate">{a.notes || '—'}</td>
                  </tr>
                ))}
                {!(animals || []).length && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-[0.8rem] text-[rgba(75,71,65,0.4)]">No animals in registry yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(44,42,37,0.4)] backdrop-blur-sm p-4" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <form onSubmit={saveAnimal} className="bg-[rgba(255,252,247,0.98)] rounded-2xl border border-[rgba(122,112,94,0.2)] p-8 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-light">{editing ? 'Edit Animal' : 'Add Animal'}</h2>
              <button type="button" onClick={() => setShowModal(false)} className="bg-transparent p-0 text-2xl text-[rgba(75,71,65,0.4)] shadow-none rounded-none hover:scale-100">×</button>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              {[['Tag ID', 'tag_id', 'text'], ['Name', 'name', 'text'], ['Birth Date', 'birth_date', 'date']].map(([label, key, type]) => (
                <div key={key} className={key === 'birth_date' ? 'col-span-2' : ''}>
                  <label className="block text-[0.62rem] uppercase tracking-[0.14em] text-[rgba(75,71,65,0.55)] mb-1">{label}</label>
                  <input type={type} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    className="w-full bg-transparent border-0 border-b border-[rgba(122,112,94,0.3)] px-0 py-2 text-[0.85rem] outline-none" />
                </div>
              ))}
              <div>
                <label className="block text-[0.62rem] uppercase tracking-[0.14em] text-[rgba(75,71,65,0.55)] mb-1">Category</label>
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  className="w-full bg-transparent border-0 border-b border-[rgba(122,112,94,0.3)] px-0 py-2 text-[0.85rem] outline-none">
                  {categories.map(c => <option key={c} value={c}>{capitalize(c)}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[0.62rem] uppercase tracking-[0.14em] text-[rgba(75,71,65,0.55)] mb-1">Status</label>
                <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                  className="w-full bg-transparent border-0 border-b border-[rgba(122,112,94,0.3)] px-0 py-2 text-[0.85rem] outline-none">
                  {['active', 'sold', 'deceased', 'slaughtered'].map(s => <option key={s} value={s}>{capitalize(s)}</option>)}
                </select>
              </div>
            </div>
            <div className="mb-6">
              <label className="block text-[0.62rem] uppercase tracking-[0.14em] text-[rgba(75,71,65,0.55)] mb-1">Notes</label>
              <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2}
                className="w-full bg-transparent border border-[rgba(122,112,94,0.2)] rounded-xl px-3 py-2 text-[0.85rem] outline-none resize-none" />
            </div>
            <button type="submit" className="w-full rounded-full py-3 text-[0.7rem] uppercase tracking-[0.14em] bg-[rgba(107,127,94,0.85)] text-white">Save</button>
          </form>
        </div>
      )}
    </section>
  );
}

export default function VgAnimals() {
  const now = currentYearMonth();
  const [year, setYear] = useState(now.year);
  const [month, setMonth] = useState(now.month);
  const [animalType, setAnimalType] = useState('sheep');
  const [modalCategory, setModalCategory] = useState(null);

  const categories = ANIMAL_TYPES[animalType]?.categories || [];

  const { data: monthlyData } = useQuery({
    queryKey: ['vg', 'livestock', animalType, year, month],
    queryFn: () => fetchLivestockMonthly(year, month, animalType).then(r => r.data || []),
  });

  // Chart data — last 12 months
  const months12 = last12Months();
  const { data: chartData } = useQuery({
    queryKey: ['vg', 'livestock', 'chart', animalType],
    queryFn: async () => {
      const results = await Promise.all(
        months12.map(m => fetchLivestockMonthly(m.year, m.month, animalType).then(r => ({ ...m, rows: r.data || [] })))
      );
      return results.map(({ year, month, rows }) => {
        const entry = { name: `${MONTH_SHORT[month-1]} ${year}` };
        categories.forEach(cat => {
          const row = rows.find(r => r.category === cat);
          entry[cat] = row?.closing_count || 0;
        });
        return entry;
      });
    },
  });

  const rowByCategory = Object.fromEntries((monthlyData || []).map(r => [r.category, r]));
  const existingForCategory = modalCategory ? rowByCategory[modalCategory] : null;

  const COLORS = { ram: '#8b6f47', ewe: '#c2a66d', lamb: '#d4c09a', bull: '#5a7a5a', cow: '#6b7f5e', calf: '#8fb88f' };

  function onPrev() { const p = prevMonth(year, month); setYear(p.year); setMonth(p.month); }
  function onNext() { const n = nextMonth(year, month); setYear(n.year); setMonth(n.month); }

  return (
    <div className="min-h-screen">
      <PageHeader animalType={animalType} setAnimalType={setAnimalType} year={year} month={month} onPrev={onPrev} onNext={onNext} />

      <div className="p-6 max-w-5xl">
        {/* Category cards */}
        <section className="mb-8">
          <p className="text-[0.6rem] uppercase tracking-[0.2em] text-[rgba(75,71,65,0.45)] mb-4">
            {ANIMAL_TYPES[animalType]?.label} — {MONTH_SHORT[month-1]} {year}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {categories.map(cat => (
              <CategoryCard
                key={cat}
                row={rowByCategory[cat]}
                category={cat}
                animalType={animalType}
                year={year}
                month={month}
                onEdit={setModalCategory}
              />
            ))}
          </div>
        </section>

        {/* Trend chart */}
        {chartData && chartData.length > 0 && (
          <section className="mb-8">
            <p className="text-[0.6rem] uppercase tracking-[0.2em] text-[rgba(75,71,65,0.45)] mb-4">12-Month Trend</p>
            <div className="rounded-2xl border border-[rgba(122,112,94,0.2)] bg-[rgba(255,252,247,0.95)] p-5">
              <div style={{ height: 240 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(122,112,94,0.12)" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'rgba(75,71,65,0.5)' }} />
                    <YAxis tick={{ fontSize: 10, fill: 'rgba(75,71,65,0.5)' }} />
                    <Tooltip contentStyle={{ background: 'rgba(255,252,247,0.97)', border: '1px solid rgba(122,112,94,0.2)', borderRadius: 12, fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.1em' }} />
                    {categories.map(cat => (
                      <Line key={cat} type="monotone" dataKey={cat} stroke={COLORS[cat] || '#8b6f47'} strokeWidth={2} dot={false} />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>
        )}

        {/* Registry */}
        <AnimalRegistrySection animalType={animalType} />
      </div>

      {/* Input modal */}
      {modalCategory && (
        <LivestockInputModal
          animalType={animalType}
          category={modalCategory}
          year={year}
          month={month}
          existing={existingForCategory}
          onClose={() => setModalCategory(null)}
          onSaved={() => setModalCategory(null)}
        />
      )}
    </div>
  );
}
