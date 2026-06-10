import { useState, useMemo, useRef, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase.js';
import { useAuthSession } from '../../../hooks/useAuthSession.js';
import { useCurrentMember } from '../hooks/useCurrentMember.js';
import { useIsAdmin } from '../hooks/useCurrentMember.js';
import { formatDate, capitalize, formatCurrency } from '../../../lib/vg/helpers.js';
import { MONTH_SHORT, MEMBER_COLORS } from '../../../lib/vg/constants.js';

const STATUS_PILL = {
  open: 'bg-emerald-100 text-emerald-800',
  closed: 'bg-stone-200 text-stone-600',
  application: 'bg-amber-100 text-amber-800',
  completed: 'bg-[rgba(107,127,94,0.15)] text-[#6b7f5e]',
  archived: 'bg-stone-100 text-stone-400',
};

function getMemberColor(member, allMembers) {
  if (member?.color) return member.color;
  const idx = (allMembers || []).findIndex(m => m.id === member?.id || m.user_id === member?.user_id);
  return MEMBER_COLORS[(idx >= 0 ? idx : 0) % MEMBER_COLORS.length];
}

function progressPct(start, end) {
  if (!start) return 0;
  const s = new Date(start), e = end ? new Date(end) : new Date(), n = new Date();
  if (n <= s) return 0;
  if (n >= e) return 100;
  return Math.min(100, Math.round(((n - s) / (e - s)) * 100));
}

function daysCount(start, end) {
  if (!start || !end) return null;
  return Math.max(0, Math.round((new Date(end) - new Date(start)) / 86400000));
}

// ─── BOM Table ────────────────────────────────────────────────────────────

function BomTable({ projectId, isAdmin }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: '', quantity: 1, unit_cost: '' });
  const [adding, setAdding] = useState(false);

  const { data: items } = useQuery({
    queryKey: ['vg', 'bom', projectId],
    queryFn: () => supabase.from('project_bom_items').select('*').eq('project_id', projectId).order('created_at').then(r => r.data || []),
  });

  const total = (items || []).reduce((s, i) => s + (i.quantity * i.unit_cost), 0);

  async function addItem(e) {
    e.preventDefault();
    await supabase.from('project_bom_items').insert({ project_id: projectId, name: form.name, quantity: Number(form.quantity), unit_cost: Number(form.unit_cost) });
    qc.invalidateQueries({ queryKey: ['vg', 'bom', projectId] });
    setForm({ name: '', quantity: 1, unit_cost: '' });
    setAdding(false);
  }

  async function deleteItem(id) {
    await supabase.from('project_bom_items').delete().eq('id', id);
    qc.invalidateQueries({ queryKey: ['vg', 'bom', projectId] });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-[0.6rem] uppercase tracking-[0.14em] text-[rgba(75,71,65,0.45)]">Bill of Materials</p>
        {isAdmin && <button onClick={() => setAdding(!adding)} className="rounded-full px-3 py-1 text-[0.6rem] uppercase tracking-[0.1em] bg-[rgba(107,127,94,0.85)] text-white shadow-none hover:scale-100">+ Item</button>}
      </div>

      {adding && (
        <form onSubmit={addItem} className="grid grid-cols-12 gap-2 mb-3 p-3 rounded-xl bg-[rgba(122,112,94,0.06)]">
          <input placeholder="Item name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required
            className="col-span-5 bg-transparent border-b border-[rgba(122,112,94,0.3)] px-0 py-1.5 text-[0.8rem] outline-none" />
          <input type="number" placeholder="Qty" min="0" step="0.01" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
            className="col-span-2 bg-transparent border-b border-[rgba(122,112,94,0.3)] px-1 py-1.5 text-[0.8rem] outline-none text-center" />
          <input type="number" placeholder="Unit R" min="0" step="0.01" value={form.unit_cost} onChange={e => setForm(f => ({ ...f, unit_cost: e.target.value }))} required
            className="col-span-3 bg-transparent border-b border-[rgba(122,112,94,0.3)] px-1 py-1.5 text-[0.8rem] outline-none" />
          <button type="submit" className="col-span-2 rounded-full py-1 text-[0.6rem] uppercase tracking-[0.08em] bg-[rgba(107,127,94,0.85)] text-white shadow-none hover:scale-100">Add</button>
        </form>
      )}

      {(items || []).length > 0 ? (
        <div className="rounded-xl border border-[rgba(122,112,94,0.15)] overflow-hidden">
          <table className="min-w-full text-[0.75rem]">
            <thead className="bg-[rgba(248,244,236,0.9)] text-[0.58rem] uppercase tracking-[0.1em] text-[rgba(75,71,65,0.5)]">
              <tr>
                <th className="px-3 py-2 text-left">Item</th>
                <th className="px-3 py-2 text-center">Qty</th>
                <th className="px-3 py-2 text-right">Unit Cost</th>
                <th className="px-3 py-2 text-right">Total</th>
                {isAdmin && <th className="px-2 py-2" />}
              </tr>
            </thead>
            <tbody>
              {(items || []).map((item, i) => (
                <tr key={item.id} className={`border-t border-[rgba(122,112,94,0.08)] ${i % 2 === 0 ? '' : 'bg-[rgba(122,112,94,0.02)]'}`}>
                  <td className="px-3 py-2.5 text-[#2b2b2b]">{item.name}</td>
                  <td className="px-3 py-2.5 text-center text-[rgba(75,71,65,0.7)]">{item.quantity}</td>
                  <td className="px-3 py-2.5 text-right text-[rgba(75,71,65,0.7)]">{formatCurrency(item.unit_cost)}</td>
                  <td className="px-3 py-2.5 text-right font-medium text-[#2b2b2b]">{formatCurrency(item.quantity * item.unit_cost)}</td>
                  {isAdmin && <td className="px-2 py-2 text-center"><button onClick={() => deleteItem(item.id)} className="bg-transparent shadow-none rounded-none p-0 text-[rgba(75,71,65,0.3)] hover:text-[#8b4a4a] hover:scale-100 text-xs">×</button></td>}
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t-2 border-[rgba(122,112,94,0.2)] bg-[rgba(248,244,236,0.7)]">
              <tr>
                <td colSpan={isAdmin ? 3 : 3} className="px-3 py-2.5 text-[0.62rem] uppercase tracking-[0.1em] text-[rgba(75,71,65,0.5)] font-semibold">Total Cost</td>
                <td className="px-3 py-2.5 text-right text-base font-light text-[#6b7f5e]">{formatCurrency(total)}</td>
                {isAdmin && <td />}
              </tr>
            </tfoot>
          </table>
        </div>
      ) : (
        <p className="text-[0.75rem] text-[rgba(75,71,65,0.35)] italic">No items added yet</p>
      )}
    </div>
  );
}

// ─── Gantt Chart ──────────────────────────────────────────────────────────

function GanttChart({ projects, members }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  function daysInMonth(y, m) { return new Date(y, m + 1, 0).getDate(); }
  const days = daysInMonth(year, month);
  const dayArr = Array.from({ length: days }, (_, i) => i + 1);
  const todayDay = year === now.getFullYear() && month === now.getMonth() ? now.getDate() : null;

  function prevM() { if (month === 0) { setYear(y => y-1); setMonth(11); } else setMonth(m => m-1); }
  function nextM() { if (month === 11) { setYear(y => y+1); setMonth(0); } else setMonth(m => m+1); }

  const scheduled = (projects || []).filter(p => p.start_date && !p.archived);
  const unscheduled = (projects || []).filter(p => !p.start_date && !p.archived);

  function activeDays(project) {
    const start = new Date(project.start_date);
    const end = project.end_date ? new Date(project.end_date) : now;
    const active = new Set();
    for (let d = 1; d <= days; d++) {
      const cell = new Date(year, month, d);
      if (cell >= start && cell <= end) active.add(d);
    }
    return active;
  }

  function creatorColor(project) {
    const m = (members || []).find(m => m.user_id === project.created_by);
    return getMemberColor(m, members);
  }

  const muted = 'text-[rgba(75,71,65,0.5)]';
  const border = 'border-[rgba(122,112,94,0.1)]';
  const LABEL_W = 'w-32 min-w-[8rem]';
  const DAY_W = 'w-6 min-w-[1.5rem]';

  function ProjectRow({ p }) {
    const active = activeDays(p);
    const color = creatorColor(p);
    const hasEnd = !!p.end_date;
    return (
      <div className={`flex border-b ${border} hover:bg-[rgba(122,112,94,0.025)] transition-colors`}>
        <div className={`sticky left-0 z-10 ${LABEL_W} shrink-0 border-r ${border} bg-[rgba(255,252,247,0.95)] px-2 py-2 flex flex-col justify-center gap-0.5 overflow-hidden`}>
          <span className="truncate text-[0.68rem] font-medium text-[#2b2b2b] leading-tight">{p.title}</span>
          {p.end_date && <span className="text-[0.5rem] text-[rgba(75,71,65,0.4)]">→ {String(p.end_date).slice(0,10)}</span>}
        </div>
        {dayArr.map(d => {
          const isActive = active.has(d);
          const isFirst = isActive && !active.has(d-1);
          const isLast = isActive && !active.has(d+1);
          const isOpenEnd = isLast && !hasEnd;
          return (
            <div key={d} className={`relative ${DAY_W} shrink-0 border-r ${border} py-1.5 ${todayDay === d ? 'bg-amber-500/8' : ''}`}>
              {isActive && (
                <div className={`absolute inset-y-1.5 ${isFirst ? 'left-1' : 'left-0'} ${isLast ? 'right-1' : 'right-0'} opacity-80 ${isFirst ? 'rounded-l-full' : ''} ${isLast && !isOpenEnd ? 'rounded-r-full' : ''} ${isOpenEnd ? 'border-r-2 border-dashed' : ''}`}
                  style={{ backgroundColor: isOpenEnd ? 'transparent' : color, borderColor: isOpenEnd ? color : undefined, opacity: 0.75 }} />
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[rgba(122,112,94,0.2)] bg-[rgba(255,252,247,0.95)] overflow-hidden">
      {/* Header nav */}
      <div className={`flex items-center justify-between px-4 py-2.5 border-b ${border} bg-[rgba(248,244,236,0.95)]`}>
        <div className="flex items-center gap-2">
          <button onClick={prevM} className="rounded-lg p-1.5 text-sm bg-transparent text-[rgba(75,71,65,0.6)] hover:bg-[rgba(122,112,94,0.1)] shadow-none hover:scale-100">←</button>
          <button onClick={nextM} className="rounded-lg p-1.5 text-sm bg-transparent text-[rgba(75,71,65,0.6)] hover:bg-[rgba(122,112,94,0.1)] shadow-none hover:scale-100">→</button>
          <span className="text-[0.78rem] font-medium text-[#2b2b2b]">{MONTH_SHORT[month]} {year}</span>
        </div>
        {(year !== now.getFullYear() || month !== now.getMonth()) && (
          <button onClick={() => { setYear(now.getFullYear()); setMonth(now.getMonth()); }} className="rounded-lg px-3 py-1 text-[0.6rem] uppercase tracking-[0.1em] bg-transparent text-[rgba(75,71,65,0.5)] hover:bg-[rgba(122,112,94,0.1)] shadow-none hover:scale-100">Today</button>
        )}
      </div>
      {/* Grid */}
      <div className="overflow-auto max-h-[400px]">
        <div className="inline-flex min-w-full flex-col">
          {/* Day headers */}
          <div className={`sticky top-0 z-20 flex border-b ${border} bg-[rgba(245,241,233,0.99)]`}>
            <div className={`sticky left-0 z-30 ${LABEL_W} shrink-0 border-r ${border} bg-[rgba(245,241,233,0.99)] px-2 py-2 text-[0.58rem] uppercase tracking-[0.12em] ${muted}`}>Project</div>
            {dayArr.map(d => (
              <div key={d} className={`${DAY_W} shrink-0 border-r ${border} py-2 text-center text-[0.58rem] font-semibold ${muted} ${todayDay === d ? 'bg-amber-500/20 text-amber-700 font-bold' : ''}`}>{d}</div>
            ))}
          </div>
          {scheduled.map(p => <ProjectRow key={p.id} p={p} />)}
          {unscheduled.length > 0 && (
            <>
              <div className={`sticky left-0 border-b px-4 py-1.5 text-[0.58rem] uppercase tracking-widest ${muted} bg-[rgba(245,241,233,0.98)] border-[rgba(122,112,94,0.1)]`}>Unscheduled</div>
              {unscheduled.map(p => (
                <div key={p.id} className={`flex border-b ${border}`}>
                  <div className={`sticky left-0 z-10 ${LABEL_W} shrink-0 border-r ${border} bg-[rgba(255,252,247,0.95)] px-2 py-2`}>
                    <span className="truncate text-[0.68rem] text-[rgba(75,71,65,0.6)]">{p.title}</span>
                  </div>
                  {dayArr.map(d => <div key={d} className={`${DAY_W} shrink-0 border-r ${border} ${todayDay === d ? 'bg-amber-500/8' : ''}`} />)}
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Completion Summary Modal ─────────────────────────────────────────────

function CompletionSummary({ project, onClose }) {
  const isAdmin = useIsAdmin();
  const qc = useQueryClient();

  const { data: bom } = useQuery({
    queryKey: ['vg', 'bom', project.id],
    queryFn: () => supabase.from('project_bom_items').select('*').eq('project_id', project.id).then(r => r.data || []),
  });

  const { data: tasks } = useQuery({
    queryKey: ['vg', 'tasks', project.id],
    queryFn: () => supabase.from('project_tasks').select('*').eq('project', project.id).then(r => r.data || []),
  });

  const { data: review } = useQuery({
    queryKey: ['vg', 'review', project.id],
    queryFn: () => supabase.from('project_reviews').select('*').eq('project_id', project.id).maybeSingle().then(r => r.data),
  });

  const [reflection, setReflection] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (review?.content) setReflection(review.content); }, [review]);

  const totalCost = (bom || []).reduce((s, i) => s + i.quantity * i.unit_cost, 0);
  const completedTasks = (tasks || []).filter(t => t.status === 'done').length;
  const duration = daysCount(project.start_date, project.completed_at || project.end_date);

  async function saveReflection() {
    setSaving(true);
    try {
      if (review) {
        await supabase.from('project_reviews').update({ content: reflection }).eq('id', review.id);
      } else {
        await supabase.from('project_reviews').insert({ project_id: project.id, realm: 'vrischgewagt', content: reflection });
      }
      qc.invalidateQueries({ queryKey: ['vg', 'review', project.id] });
    } finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-[rgba(44,42,37,0.45)] backdrop-blur-sm p-4 overflow-y-auto" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-[rgba(255,252,247,0.98)] rounded-2xl border border-[rgba(122,112,94,0.2)] w-full max-w-lg shadow-xl my-8">
        {/* Header */}
        <div className="px-7 pt-7 pb-5 border-b border-[rgba(122,112,94,0.1)]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[0.58rem] uppercase tracking-[0.18em] text-[#6b7f5e] mb-1">Completed Project</p>
              <h2 className="text-xl font-light text-[#2b2b2b]">{project.title}</h2>
              {project.completed_at && <p className="text-[0.72rem] text-[rgba(75,71,65,0.5)] mt-1">Completed {formatDate(project.completed_at)}</p>}
            </div>
            <button onClick={onClose} className="bg-transparent p-0 text-2xl text-[rgba(75,71,65,0.35)] shadow-none rounded-none hover:scale-100">×</button>
          </div>
        </div>

        <div className="px-7 py-6 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-light text-[#6b7f5e]">{duration ?? '—'}</p>
              <p className="text-[0.58rem] uppercase tracking-[0.12em] text-[rgba(75,71,65,0.45)]">Days</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-light text-[#c2a66d]">{formatCurrency(totalCost)}</p>
              <p className="text-[0.58rem] uppercase tracking-[0.12em] text-[rgba(75,71,65,0.45)]">Total Cost</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-light text-[#2b2b2b]">{completedTasks}/{(tasks||[]).length}</p>
              <p className="text-[0.58rem] uppercase tracking-[0.12em] text-[rgba(75,71,65,0.45)]">Tasks Done</p>
            </div>
          </div>

          {/* Dates */}
          {(project.start_date || project.end_date) && (
            <div className="flex gap-6 text-[0.78rem]">
              {project.start_date && <div><p className="text-[0.58rem] uppercase tracking-[0.1em] text-[rgba(75,71,65,0.4)] mb-0.5">Started</p><p className="text-[#2b2b2b]">{formatDate(project.start_date)}</p></div>}
              {(project.completed_at || project.end_date) && <div><p className="text-[0.58rem] uppercase tracking-[0.1em] text-[rgba(75,71,65,0.4)] mb-0.5">Completed</p><p className="text-[#2b2b2b]">{formatDate(project.completed_at || project.end_date)}</p></div>}
            </div>
          )}

          {/* BOM summary */}
          {(bom || []).length > 0 && (
            <div>
              <p className="text-[0.6rem] uppercase tracking-[0.14em] text-[rgba(75,71,65,0.45)] mb-2">Materials Used</p>
              <div className="space-y-1.5">
                {(bom || []).map(item => (
                  <div key={item.id} className="flex justify-between text-[0.78rem]">
                    <span className="text-[rgba(43,43,43,0.8)]">{item.name} <span className="text-[rgba(75,71,65,0.4)]">×{item.quantity}</span></span>
                    <span className="text-[rgba(75,71,65,0.7)]">{formatCurrency(item.quantity * item.unit_cost)}</span>
                  </div>
                ))}
                <div className="flex justify-between border-t border-[rgba(122,112,94,0.15)] pt-2 mt-2">
                  <span className="text-[0.72rem] uppercase tracking-[0.1em] text-[rgba(75,71,65,0.5)] font-semibold">Total</span>
                  <span className="text-[0.9rem] font-light text-[#6b7f5e]">{formatCurrency(totalCost)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Reflection notes */}
          <div>
            <p className="text-[0.6rem] uppercase tracking-[0.14em] text-[rgba(75,71,65,0.45)] mb-2">Reflection Notes</p>
            <textarea
              value={reflection}
              onChange={e => setReflection(e.target.value)}
              rows={4}
              placeholder="What went well? What would you do differently? Key learnings…"
              className="w-full bg-[rgba(122,112,94,0.04)] border border-[rgba(122,112,94,0.15)] rounded-xl px-4 py-3 text-[0.85rem] outline-none resize-none focus:border-[rgba(107,127,94,0.4)] text-[#2b2b2b] leading-relaxed placeholder:text-[rgba(75,71,65,0.3)]"
            />
            <button onClick={saveReflection} disabled={saving} className="mt-2 rounded-full px-5 py-2 text-[0.65rem] uppercase tracking-[0.12em] bg-[rgba(107,127,94,0.85)] text-white shadow-none hover:scale-100">
              {saving ? 'Saving…' : 'Save Notes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Project Detail Drawer ──────────────────────────────────────────────

function ProjectDetail({ project, onClose, onEdit, members }) {
  const qc = useQueryClient();
  const isAdmin = useIsAdmin();
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDue, setTaskDue] = useState('');
  const [showCompletion, setShowCompletion] = useState(false);

  const { data: tasks } = useQuery({
    queryKey: ['vg', 'tasks', project.id],
    queryFn: () => supabase.from('project_tasks').select('*').eq('project', project.id).order('created_at').then(r => r.data || []),
  });

  const completedCount = (tasks || []).filter(t => t.status === 'done').length;
  const progress = project.start_date ? progressPct(project.start_date, project.end_date) : (tasks?.length ? Math.round((completedCount / tasks.length) * 100) : 0);

  async function toggleTask(task) {
    await supabase.from('project_tasks').update({ status: task.status === 'done' ? 'todo' : 'done' }).eq('id', task.id);
    qc.invalidateQueries({ queryKey: ['vg', 'tasks', project.id] });
  }

  async function addTask(e) {
    e.preventDefault();
    if (!taskTitle.trim()) return;
    await supabase.from('project_tasks').insert({ project: project.id, name: taskTitle.trim(), status: 'todo', due_date: taskDue || null });
    qc.invalidateQueries({ queryKey: ['vg', 'tasks', project.id] });
    setTaskTitle(''); setTaskDue('');
  }

  async function markComplete() {
    if (!confirm(`Mark "${project.title}" as completed?`)) return;
    await supabase.from('projects').update({ completed_at: new Date().toISOString(), status: 'closed' }).eq('id', project.id);
    qc.invalidateQueries({ queryKey: ['vg', 'projects'] });
    onClose();
  }

  async function deleteProject() {
    if (!confirm(`Permanently delete "${project.title}"? This cannot be undone.`)) return;
    await supabase.from('project_tasks').delete().eq('project', project.id);
    await supabase.from('project_bom_items').delete().eq('project_id', project.id);
    await supabase.from('projects').delete().eq('id', project.id);
    qc.invalidateQueries({ queryKey: ['vg', 'projects'] });
    onClose();
  }

  const creator = (members || []).find(m => m.user_id === project.created_by);
  const color = getMemberColor(creator, members);
  const isCompleted = !!project.completed_at;

  return (
    <>
    <div className="fixed inset-0 z-40 flex items-start justify-end bg-[rgba(44,42,37,0.25)] backdrop-blur-[2px]" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-[rgba(255,252,247,0.99)] w-full sm:max-w-md h-full overflow-y-auto border-l border-[rgba(122,112,94,0.18)] shadow-2xl flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-[rgba(255,252,247,0.97)] backdrop-blur-sm border-b border-[rgba(122,112,94,0.1)] px-4 sm:px-6 py-4 sm:py-5 z-10">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color }} />
                <h2 className="text-base font-medium text-[#2b2b2b] leading-tight">{project.title}</h2>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`inline-flex rounded-full px-2 py-0.5 text-[0.55rem] uppercase tracking-wide font-semibold ${STATUS_PILL[isCompleted ? 'completed' : project.status] || STATUS_PILL.open}`}>
                  {isCompleted ? 'Completed' : project.status || 'open'}
                </span>
                {project.timeline && <span className="text-[0.65rem] text-[rgba(75,71,65,0.45)]">{project.timeline}</span>}
                {creator && <span className="text-[0.65rem] text-[rgba(75,71,65,0.45)]">by {creator.username || creator.name}</span>}
              </div>
            </div>
            <button onClick={onClose} className="bg-transparent p-1 text-xl text-[rgba(75,71,65,0.35)] shadow-none rounded-none hover:scale-100 shrink-0">×</button>
          </div>
          {/* Action buttons — wrap on mobile */}
          <div className="flex items-center gap-1.5 mt-3 flex-wrap">
            {isCompleted && (
              <button onClick={() => setShowCompletion(true)} className="rounded-full px-3 py-1 text-[0.58rem] uppercase tracking-[0.1em] bg-[rgba(107,127,94,0.12)] text-[#6b7f5e] border border-[rgba(107,127,94,0.25)] shadow-none hover:scale-100">Summary</button>
            )}
            {!isCompleted && isAdmin && (
              <button onClick={markComplete} className="rounded-full px-3 py-1 text-[0.58rem] uppercase tracking-[0.1em] bg-[rgba(107,127,94,0.85)] text-white shadow-none hover:scale-100">✓ Complete</button>
            )}
            <button onClick={() => onEdit(project)} className="rounded-full px-3 py-1 text-[0.58rem] uppercase tracking-[0.1em] bg-transparent border border-[rgba(122,112,94,0.25)] text-[rgba(75,71,65,0.6)] shadow-none hover:scale-100 hover:bg-[rgba(122,112,94,0.08)]">Edit</button>
            {isAdmin && (
              <button onClick={deleteProject} className="rounded-full px-3 py-1 text-[0.58rem] uppercase tracking-[0.1em] bg-transparent border border-[rgba(194,100,80,0.3)] text-[rgba(194,100,80,0.7)] shadow-none hover:scale-100 hover:bg-[rgba(194,100,80,0.08)]">Delete</button>
            )}
          </div>
        </div>

        <div className="flex-1 px-4 sm:px-6 py-5 space-y-6">
          {/* Progress */}
          <div>
            <div className="flex justify-between text-[0.58rem] uppercase tracking-[0.12em] text-[rgba(75,71,65,0.45)] mb-1.5">
              <span>Progress</span><span>{progress}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-[rgba(122,112,94,0.1)] overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, backgroundColor: color }} />
            </div>
          </div>

          {/* Dates */}
          {(project.start_date || project.end_date) && (
            <div className="flex gap-5 text-[0.78rem]">
              {project.start_date && <div><p className="text-[0.58rem] uppercase tracking-[0.1em] text-[rgba(75,71,65,0.4)] mb-0.5">Start</p><p>{formatDate(project.start_date)}</p></div>}
              {project.end_date && <div><p className="text-[0.58rem] uppercase tracking-[0.1em] text-[rgba(75,71,65,0.4)] mb-0.5">End</p><p>{formatDate(project.end_date)}</p></div>}
              {project.start_date && project.end_date && <div><p className="text-[0.58rem] uppercase tracking-[0.1em] text-[rgba(75,71,65,0.4)] mb-0.5">Duration</p><p>{daysCount(project.start_date, project.end_date)} days</p></div>}
            </div>
          )}

          {/* Description */}
          {project.description && (
            <p className="text-[0.82rem] text-[rgba(43,43,43,0.8)] leading-relaxed">{project.description}</p>
          )}

          {/* Tasks */}
          <div>
            <p className="text-[0.6rem] uppercase tracking-[0.14em] text-[rgba(75,71,65,0.45)] mb-3">Tasks ({completedCount}/{(tasks||[]).length})</p>
            <div className="space-y-0.5 mb-3">
              {(tasks || []).map(t => (
                <div key={t.id} className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-[rgba(122,112,94,0.04)] cursor-pointer" onClick={() => toggleTask(t)}>
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${t.status === 'done' ? 'bg-[#6b7f5e] border-[#6b7f5e]' : 'border-[rgba(122,112,94,0.3)]'}`} style={t.status === 'done' ? { backgroundColor: color, borderColor: color } : {}}>
                    {t.status === 'done' && <span className="text-white text-[0.5rem]">✓</span>}
                  </div>
                  <span className={`flex-1 text-[0.8rem] ${t.status === 'done' ? 'line-through text-[rgba(75,71,65,0.35)]' : 'text-[#2b2b2b]'}`}>{t.name || t.title}</span>
                  {t.due_date && <span className="text-[0.62rem] text-[rgba(75,71,65,0.35)]">{formatDate(t.due_date)}</span>}
                </div>
              ))}
            </div>
            <form onSubmit={addTask} className="flex gap-2">
              <input placeholder="Add a task…" value={taskTitle} onChange={e => setTaskTitle(e.target.value)}
                className="flex-1 bg-transparent border-b border-[rgba(122,112,94,0.25)] px-0 py-1.5 text-[0.8rem] outline-none placeholder:text-[rgba(75,71,65,0.3)]" />
              <input type="date" value={taskDue} onChange={e => setTaskDue(e.target.value)}
                className="w-28 bg-transparent border-b border-[rgba(122,112,94,0.25)] px-0 py-1.5 text-[0.75rem] outline-none text-[rgba(75,71,65,0.6)]" />
              <button type="submit" className="rounded-full px-3 py-1 text-[0.6rem] uppercase tracking-[0.08em] bg-[rgba(107,127,94,0.85)] text-white shadow-none hover:scale-100">+</button>
            </form>
          </div>

          {/* BOM */}
          <BomTable projectId={project.id} isAdmin={isAdmin} />
        </div>
      </div>
    </div>
    {showCompletion && <CompletionSummary project={project} onClose={() => setShowCompletion(false)} />}
    </>
  );
}

// ─── Project Card ─────────────────────────────────────────────────────────

function ProjectCard({ project, members, onClick }) {
  const creator = (members || []).find(m => m.user_id === project.created_by);
  const color = getMemberColor(creator, members);
  const progress = project.start_date ? progressPct(project.start_date, project.end_date) : 0;
  const isCompleted = !!project.completed_at;

  return (
    <div onClick={onClick} className="rounded-2xl border bg-[rgba(255,252,247,0.95)] p-4 cursor-pointer hover:shadow-md transition-all group"
      style={{ borderColor: `${color}35`, borderLeftWidth: 3, borderLeftColor: color }}>
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <h3 className="text-[0.82rem] font-medium text-[#2b2b2b] group-hover:text-[#6b7f5e] transition-colors leading-tight">{project.title}</h3>
        <span className={`shrink-0 inline-flex rounded-full px-2 py-0.5 text-[0.52rem] uppercase tracking-wide font-semibold ${STATUS_PILL[isCompleted ? 'completed' : project.status] || STATUS_PILL.open}`}>
          {isCompleted ? '✓' : project.status || 'open'}
        </span>
      </div>
      {project.description && <p className="text-[0.72rem] text-[rgba(75,71,65,0.55)] mb-2.5 line-clamp-2 leading-relaxed">{project.description}</p>}
      {project.start_date && (
        <div className="h-1 rounded-full bg-[rgba(122,112,94,0.1)] overflow-hidden mb-2.5">
          <div className="h-full rounded-full" style={{ width: `${progress}%`, backgroundColor: color, opacity: 0.7 }} />
        </div>
      )}
      <div className="flex items-center justify-between">
        {creator && (
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-full flex items-center justify-center text-[0.45rem] font-bold text-white" style={{ backgroundColor: color }}>
              {(creator.name || creator.username || '?').charAt(0).toUpperCase()}
            </div>
            <span className="text-[0.62rem] text-[rgba(75,71,65,0.45)]">{creator.username || creator.name}</span>
          </div>
        )}
        {project.end_date && <span className="text-[0.6rem] text-[rgba(75,71,65,0.35)]">{formatDate(project.end_date)}</span>}
      </div>
    </div>
  );
}

// ─── Create/Edit Modal ─────────────────────────────────────────────────────

function ProjectModal({ project, onClose, userId }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    title: project?.title || '',
    description: project?.description || '',
    status: project?.status || 'open',
    timeline: project?.timeline || '',
    start_date: project?.start_date || '',
    end_date: project?.end_date || '',
  });
  const [saving, setSaving] = useState(false);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const row = { title: form.title.trim(), description: form.description.trim(), status: form.status, timeline: form.timeline || null, start_date: form.start_date || null, end_date: form.end_date || null, realm: 'vrischgewagt' };
      if (project) await supabase.from('projects').update(row).eq('id', project.id);
      else { row.created_by = userId; await supabase.from('projects').insert(row); }
      qc.invalidateQueries({ queryKey: ['vg', 'projects'] });
      onClose();
    } finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-[rgba(44,42,37,0.4)] backdrop-blur-sm p-4 overflow-y-auto" onClick={e => e.target === e.currentTarget && onClose()}>
      <form onSubmit={handleSave} className="bg-[rgba(255,252,247,0.98)] rounded-2xl border border-[rgba(122,112,94,0.2)] p-7 w-full max-w-md shadow-xl my-8">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-light">{project ? 'Edit Project' : 'New Project'}</h2>
          <button type="button" onClick={onClose} className="bg-transparent p-0 text-2xl text-[rgba(75,71,65,0.4)] shadow-none rounded-none hover:scale-100">×</button>
        </div>
        <div className="space-y-4 mb-5">
          {[['Title','title','text'],['Description','description','textarea'],['Timeline','timeline','text']].map(([l,k,t]) => (
            <div key={k}>
              <label className="block text-[0.6rem] uppercase tracking-[0.14em] text-[rgba(75,71,65,0.5)] mb-1">{l}</label>
              {t === 'textarea' ? (
                <textarea value={form[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} rows={3}
                  className="w-full bg-transparent border border-[rgba(122,112,94,0.18)] rounded-xl px-3 py-2 text-[0.85rem] outline-none resize-none" />
              ) : (
                <input type={t} value={form[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))}
                  className="w-full bg-transparent border-0 border-b border-[rgba(122,112,94,0.28)] px-0 py-2 text-[0.85rem] outline-none" />
              )}
            </div>
          ))}
          <div>
            <label className="block text-[0.6rem] uppercase tracking-[0.14em] text-[rgba(75,71,65,0.5)] mb-1">Status</label>
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
              className="w-full bg-transparent border-0 border-b border-[rgba(122,112,94,0.28)] px-0 py-2 text-[0.85rem] outline-none">
              {['open','closed','application'].map(s => <option key={s} value={s}>{capitalize(s)}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[['Start Date','start_date'],['End Date','end_date']].map(([l,k]) => (
              <div key={k}>
                <label className="block text-[0.6rem] uppercase tracking-[0.14em] text-[rgba(75,71,65,0.5)] mb-1">{l}</label>
                <input type="date" value={form[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))}
                  className="w-full bg-transparent border-0 border-b border-[rgba(122,112,94,0.28)] px-0 py-2 text-[0.85rem] outline-none" />
              </div>
            ))}
          </div>
        </div>
        <button type="submit" disabled={saving || !form.title.trim()} className="w-full rounded-full py-3 text-[0.68rem] uppercase tracking-[0.14em] bg-[rgba(107,127,94,0.85)] text-white">
          {saving ? 'Saving…' : project ? 'Update' : 'Create Project'}
        </button>
      </form>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────

export default function VgProjects() {
  const { data: session } = useAuthSession();
  const userId = session?.user?.id;
  const [view, setView] = useState('cards'); // 'cards' | 'table' | 'gantt'
  const [filter, setFilter] = useState('active');
  const [projectModal, setProjectModal] = useState(null);
  const [detailProject, setDetailProject] = useState(null);
  const [memberFilter, setMemberFilter] = useState(null);

  const { data: projects } = useQuery({
    queryKey: ['vg', 'projects'],
    queryFn: () => supabase.from('projects').select('*').eq('realm', 'vrischgewagt').order('created_at', { ascending: false }).then(r => r.data || []),
  });

  const { data: members } = useQuery({
    queryKey: ['vg', 'members'],
    queryFn: () => supabase.from('members').select('id, user_id, name, username, color').neq('archived', true).then(r => r.data || []),
  });

  const filtered = useMemo(() => {
    let list = projects || [];
    if (memberFilter) list = list.filter(p => p.created_by === memberFilter);
    switch (filter) {
      case 'active': return list.filter(p => !p.archived && !p.completed_at);
      case 'completed': return list.filter(p => p.completed_at && !p.archived);
      case 'archived': return list.filter(p => p.archived);
      default: return list;
    }
  }, [projects, filter, memberFilter]);

  const activeCt = (projects||[]).filter(p => !p.archived && !p.completed_at).length;
  const completedCt = (projects||[]).filter(p => p.completed_at).length;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b border-[rgba(122,112,94,0.12)] bg-[rgba(255,252,247,0.8)] backdrop-blur-sm px-4 sm:px-6 py-4 sm:py-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-[0.6rem] uppercase tracking-[0.2em] text-[rgba(75,71,65,0.45)] mb-1">VrischGewagt</p>
            <h1 className="text-xl font-light text-[#2b2b2b] tracking-wide">Projects</h1>
          </div>
          <button onClick={() => setProjectModal({ project: null })} className="rounded-full px-4 py-2 text-[0.65rem] uppercase tracking-[0.12em] bg-[rgba(107,127,94,0.85)] text-white shadow-none hover:scale-100">+ New</button>
        </div>

        {/* Filters row */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          {/* Status filters + member filters */}
          <div className="flex items-center gap-2 overflow-x-auto">
            <div className="flex gap-1 shrink-0">
              {['active','completed','all','archived'].map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`rounded-full px-2.5 py-1 text-[0.6rem] uppercase tracking-[0.08em] transition-all shadow-none hover:scale-100 whitespace-nowrap ${
                    filter === f ? 'bg-[rgba(122,112,94,0.18)] text-[rgba(43,43,43,0.9)]' : 'bg-transparent text-[rgba(75,71,65,0.45)] hover:bg-[rgba(122,112,94,0.08)]'
                  }`}>{f}</button>
              ))}
            </div>

            {/* Member filter */}
            {(members || []).length > 0 && (
              <div className="flex gap-1 border-l border-[rgba(122,112,94,0.15)] pl-2 shrink-0">
                {(members || []).map((m) => {
                  const color = getMemberColor(m, members);
                  const active = memberFilter === m.user_id;
                  return (
                    <button key={m.id} onClick={() => setMemberFilter(active ? null : m.user_id)}
                      title={m.username || m.name}
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[0.5rem] font-bold text-white transition-all shadow-none hover:scale-110 ${active ? 'ring-2 ring-offset-1' : 'opacity-60 hover:opacity-100'}`}
                      style={{ backgroundColor: color }}>
                      {(m.name || m.username || '?').charAt(0).toUpperCase()}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* View toggle */}
          <div className="flex gap-1 sm:ml-auto">
            {[['cards','⊞'],['table','☰'],['gantt','▬']].map(([v, icon]) => (
              <button key={v} onClick={() => setView(v)}
                className={`rounded-lg w-8 h-8 flex items-center justify-center text-sm transition-all shadow-none hover:scale-100 ${
                  view === v ? 'bg-[rgba(122,112,94,0.18)] text-[rgba(43,43,43,0.9)]' : 'bg-transparent text-[rgba(75,71,65,0.4)] hover:bg-[rgba(122,112,94,0.08)]'
                }`}>{icon}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 max-w-6xl space-y-5">
        {/* Stats */}
        <div className="flex gap-4 text-center">
          <div className="rounded-xl border border-[rgba(122,112,94,0.15)] bg-[rgba(255,252,247,0.8)] px-5 py-3">
            <p className="text-xl font-light text-[#6b7f5e]">{activeCt}</p>
            <p className="text-[0.58rem] uppercase tracking-[0.12em] text-[rgba(75,71,65,0.45)]">Active</p>
          </div>
          <div className="rounded-xl border border-[rgba(122,112,94,0.15)] bg-[rgba(255,252,247,0.8)] px-5 py-3">
            <p className="text-xl font-light text-[#c2a66d]">{completedCt}</p>
            <p className="text-[0.58rem] uppercase tracking-[0.12em] text-[rgba(75,71,65,0.45)]">Done</p>
          </div>
          <div className="rounded-xl border border-[rgba(122,112,94,0.15)] bg-[rgba(255,252,247,0.8)] px-5 py-3">
            <p className="text-xl font-light text-[#2b2b2b]">{(projects||[]).length}</p>
            <p className="text-[0.58rem] uppercase tracking-[0.12em] text-[rgba(75,71,65,0.45)]">Total</p>
          </div>
        </div>

        {/* Gantt */}
        {view === 'gantt' && <GanttChart projects={filtered} members={members} />}

        {/* Table view */}
        {view === 'table' && (
          <div className="rounded-2xl border border-[rgba(122,112,94,0.2)] bg-[rgba(255,252,247,0.95)] overflow-hidden">
            <table className="min-w-full text-sm">
              <thead className="text-[0.58rem] uppercase tracking-[0.12em] text-[rgba(75,71,65,0.5)] bg-[rgba(248,244,236,0.9)]">
                <tr>
                  {['Project','Status','Creator','Start','End','Progress'].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-semibold border-b border-[rgba(122,112,94,0.1)]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => {
                  const creator = (members||[]).find(m => m.user_id === p.created_by);
                  const color = getMemberColor(creator, members);
                  const prog = p.start_date ? progressPct(p.start_date, p.end_date) : 0;
                  return (
                    <tr key={p.id} onClick={() => setDetailProject(p)}
                      className={`cursor-pointer border-b border-[rgba(122,112,94,0.06)] hover:bg-[rgba(122,112,94,0.04)] transition-colors ${i % 2 === 0 ? '' : 'bg-[rgba(122,112,94,0.015)]'}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                          <span className="font-medium text-[0.82rem] text-[#2b2b2b]">{p.title}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-[0.55rem] uppercase tracking-wide font-semibold ${STATUS_PILL[p.completed_at ? 'completed' : p.status] || STATUS_PILL.open}`}>
                          {p.completed_at ? 'Done' : p.status || 'open'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[0.78rem] text-[rgba(75,71,65,0.65)]">{creator?.username || creator?.name || '—'}</td>
                      <td className="px-4 py-3 text-[0.75rem] text-[rgba(75,71,65,0.55)]">{p.start_date ? String(p.start_date).slice(0,10) : '—'}</td>
                      <td className="px-4 py-3 text-[0.75rem] text-[rgba(75,71,65,0.55)]">{p.end_date ? String(p.end_date).slice(0,10) : '—'}</td>
                      <td className="px-4 py-3 w-28">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 rounded-full bg-[rgba(122,112,94,0.12)] overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${prog}%`, backgroundColor: color }} />
                          </div>
                          <span className="text-[0.62rem] text-[rgba(75,71,65,0.45)] w-7 text-right">{prog}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {!filtered.length && <tr><td colSpan={6} className="px-4 py-10 text-center text-[0.82rem] text-[rgba(75,71,65,0.35)]">No projects found</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {/* Cards view */}
        {view === 'cards' && (
          !filtered.length ? (
            <p className="text-center text-[0.82rem] text-[rgba(75,71,65,0.35)] py-10">No projects found</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(p => <ProjectCard key={p.id} project={p} members={members} onClick={() => setDetailProject(p)} />)}
            </div>
          )
        )}
      </div>

      {projectModal && <ProjectModal project={projectModal.project} onClose={() => setProjectModal(null)} userId={userId} />}
      {detailProject && (
        <ProjectDetail
          project={detailProject}
          onClose={() => setDetailProject(null)}
          onEdit={p => { setDetailProject(null); setProjectModal({ project: p }); }}
          members={members}
        />
      )}
    </div>
  );
}
