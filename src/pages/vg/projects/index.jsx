import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase.js';
import { useAuthSession } from '../../../hooks/useAuthSession.js';
import { useCurrentMember } from '../hooks/useCurrentMember.js';
import { formatDate, capitalize } from '../../../lib/vg/helpers.js';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';

// ─── Helpers ──────────────────────────────────────────────────────────────

const STATUS_OPTIONS = ['active', 'completed', 'paused', 'archived'];

const STATUS_PILL = {
  active: 'bg-emerald-100 text-emerald-800',
  completed: 'bg-stone-200 text-stone-600',
  paused: 'bg-amber-100 text-amber-800',
  archived: 'bg-stone-200/70 text-stone-500',
};

const MEMBER_COLORS = [
  '#6b7f5e', '#c2a66d', '#8b6f47', '#5a7a5a', '#4a6b8b',
  '#7a5a8b', '#8b4a4a', '#4a8b7a', '#8b8b3a', '#6b5a8b',
];

function getMemberColor(member, index) {
  return member?.color || MEMBER_COLORS[index % MEMBER_COLORS.length];
}

function daysBetween(a, b) {
  if (!a || !b) return null;
  return Math.round((new Date(b) - new Date(a)) / 86400000);
}

function progressPercent(startDate, endDate) {
  if (!startDate) return 0;
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : new Date();
  const now = new Date();
  if (now < start) return 0;
  if (now > end) return 100;
  const total = end - start;
  if (total <= 0) return 100;
  return Math.min(100, Math.round(((now - start) / total) * 100));
}

// ─── Create/Edit Modal ──────────────────────────────────────────────────

function ProjectModal({ project, onClose, userId }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    title: project?.title || '',
    description: project?.description || '',
    status: project?.status || 'open',
    timeline: project?.timeline || '',
    start_date: project?.start_date || '',
    end_date: project?.end_date || '',
    roles_needed: Array.isArray(project?.roles_needed) ? project.roles_needed.join(', ') : (project?.roles_needed || ''),
  });
  const [saving, setSaving] = useState(false);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const row = {
        title: form.title.trim(),
        description: form.description.trim(),
        status: form.status,
        timeline: form.timeline.trim() || null,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        roles_needed: form.roles_needed ? form.roles_needed.split(',').map(s => s.trim()).filter(Boolean) : null,
        realm: 'vrischgewagt',
      };
      if (project) {
        await supabase.from('projects').update(row).eq('id', project.id);
      } else {
        row.created_by = userId;
        await supabase.from('projects').insert(row);
      }
      qc.invalidateQueries({ queryKey: ['vg', 'projects'] });
      onClose();
    } finally { setSaving(false); }
  }

  const inp = (label, key, type = 'text', full = false) => (
    <div className={full ? 'col-span-2' : ''}>
      <label className="block text-[0.62rem] uppercase tracking-[0.14em] text-[rgba(75,71,65,0.55)] mb-1">{label}</label>
      {type === 'textarea' ? (
        <textarea value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} rows={3}
          className="w-full bg-transparent border border-[rgba(122,112,94,0.2)] rounded-xl px-3 py-2 text-[0.85rem] outline-none resize-none" />
      ) : (
        <input type={type} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
          className="w-full bg-transparent border-0 border-b border-[rgba(122,112,94,0.3)] px-0 py-2 text-[0.85rem] outline-none" />
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-[rgba(44,42,37,0.4)] backdrop-blur-sm p-4 overflow-y-auto" onClick={e => e.target === e.currentTarget && onClose()}>
      <form onSubmit={handleSave} className="bg-[rgba(255,252,247,0.98)] rounded-2xl border border-[rgba(122,112,94,0.2)] p-8 w-full max-w-lg shadow-xl my-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-light">{project ? 'Edit Project' : 'New Project'}</h2>
          <button type="button" onClick={onClose} className="bg-transparent p-0 text-2xl text-[rgba(75,71,65,0.4)] shadow-none rounded-none hover:scale-100">×</button>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-4">
          {inp('Title', 'title', 'text', true)}
          {inp('Description', 'description', 'textarea', true)}
          <div>
            <label className="block text-[0.62rem] uppercase tracking-[0.14em] text-[rgba(75,71,65,0.55)] mb-1">Status</label>
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
              className="w-full bg-transparent border-0 border-b border-[rgba(122,112,94,0.3)] px-0 py-2 text-[0.85rem] outline-none">
              {['open', 'closed', 'application'].map(s => <option key={s} value={s}>{capitalize(s)}</option>)}
            </select>
          </div>
          {inp('Timeline', 'timeline')}
          {inp('Start Date', 'start_date', 'date')}
          {inp('End Date', 'end_date', 'date')}
          {inp('Roles Needed (comma separated)', 'roles_needed', 'text', true)}
        </div>
        <button type="submit" disabled={saving || !form.title.trim()} className="w-full rounded-full py-3 text-[0.7rem] uppercase tracking-[0.14em] bg-[rgba(107,127,94,0.85)] text-white mt-2">
          {saving ? 'Saving…' : project ? 'Update' : 'Create Project'}
        </button>
      </form>
    </div>
  );
}

// ─── Task Modal ─────────────────────────────────────────────────────────

function TaskModal({ projectId, task, onClose }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    title: task?.title || '',
    status: task?.status || 'todo',
    due_date: task?.due_date || '',
    priority: task?.priority ?? 0,
  });
  const [saving, setSaving] = useState(false);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const row = { ...form, priority: Number(form.priority), project_id: projectId };
      if (task) await supabase.from('project_tasks').update(row).eq('id', task.id);
      else await supabase.from('project_tasks').insert(row);
      qc.invalidateQueries({ queryKey: ['vg', 'tasks', projectId] });
      onClose();
    } finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(44,42,37,0.4)] backdrop-blur-sm p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <form onSubmit={handleSave} className="bg-[rgba(255,252,247,0.98)] rounded-2xl border border-[rgba(122,112,94,0.2)] p-8 w-full max-w-sm shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-light">{task ? 'Edit Task' : 'Add Task'}</h2>
          <button type="button" onClick={onClose} className="bg-transparent p-0 text-2xl text-[rgba(75,71,65,0.4)] shadow-none rounded-none hover:scale-100">×</button>
        </div>
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-[0.62rem] uppercase tracking-[0.14em] text-[rgba(75,71,65,0.55)] mb-1">Task Title</label>
            <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required
              className="w-full bg-transparent border-0 border-b border-[rgba(122,112,94,0.3)] px-0 py-2 text-[0.85rem] outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[0.62rem] uppercase tracking-[0.14em] text-[rgba(75,71,65,0.55)] mb-1">Status</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                className="w-full bg-transparent border-0 border-b border-[rgba(122,112,94,0.3)] px-0 py-2 text-[0.85rem] outline-none">
                {['todo', 'in_progress', 'done'].map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[0.62rem] uppercase tracking-[0.14em] text-[rgba(75,71,65,0.55)] mb-1">Due Date</label>
              <input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))}
                className="w-full bg-transparent border-0 border-b border-[rgba(122,112,94,0.3)] px-0 py-2 text-[0.85rem] outline-none" />
            </div>
          </div>
        </div>
        <button type="submit" disabled={saving} className="w-full rounded-full py-3 text-[0.7rem] uppercase tracking-[0.14em] bg-[rgba(107,127,94,0.85)] text-white">
          {saving ? 'Saving…' : 'Save Task'}
        </button>
      </form>
    </div>
  );
}

// ─── Project Detail Drawer ──────────────────────────────────────────────

function ProjectDetail({ project, onClose, onEdit, userId }) {
  const qc = useQueryClient();
  const [taskModal, setTaskModal] = useState(null);

  const { data: tasks } = useQuery({
    queryKey: ['vg', 'tasks', project.id],
    queryFn: () => supabase.from('project_tasks').select('*').eq('project_id', project.id).order('priority', { ascending: false }).order('created_at').then(r => r.data || []),
  });

  const completedCount = (tasks || []).filter(t => t.status === 'done').length;
  const totalTasks = (tasks || []).length;
  const progress = project.start_date ? progressPercent(project.start_date, project.end_date) : (totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0);

  async function toggleTask(task) {
    const newStatus = task.status === 'done' ? 'todo' : 'done';
    await supabase.from('project_tasks').update({ status: newStatus }).eq('id', task.id);
    qc.invalidateQueries({ queryKey: ['vg', 'tasks', project.id] });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end bg-[rgba(44,42,37,0.3)] backdrop-blur-sm" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-[rgba(255,252,247,0.98)] w-full max-w-lg h-full overflow-y-auto border-l border-[rgba(122,112,94,0.2)] shadow-xl">
        {/* Header */}
        <div className="sticky top-0 bg-[rgba(255,252,247,0.95)] backdrop-blur-sm border-b border-[rgba(122,112,94,0.12)] px-6 py-5 flex items-start justify-between z-10">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-light text-[#2b2b2b] mb-1">{project.title}</h2>
            <div className="flex items-center gap-2">
              <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[0.58rem] uppercase tracking-wide font-semibold ${STATUS_PILL[project.status] || STATUS_PILL.active}`}>
                {project.status || 'open'}
              </span>
              {project.timeline && <span className="text-[0.68rem] text-[rgba(75,71,65,0.5)]">{project.timeline}</span>}
            </div>
          </div>
          <div className="flex items-center gap-2 ml-3">
            <button onClick={() => onEdit(project)} className="rounded-full px-3 py-1 text-[0.6rem] uppercase tracking-[0.1em] bg-transparent border border-[rgba(122,112,94,0.3)] text-[rgba(75,71,65,0.6)] shadow-none hover:scale-100 hover:bg-[rgba(122,112,94,0.1)]">Edit</button>
            <button onClick={onClose} className="bg-transparent p-0 text-xl text-[rgba(75,71,65,0.4)] shadow-none rounded-none hover:scale-100">×</button>
          </div>
        </div>

        <div className="px-6 py-6 space-y-6">
          {/* Progress bar */}
          <div>
            <div className="flex justify-between text-[0.62rem] uppercase tracking-[0.12em] text-[rgba(75,71,65,0.5)] mb-1.5">
              <span>Progress</span><span>{progress}%</span>
            </div>
            <div className="h-2 rounded-full bg-[rgba(122,112,94,0.12)] overflow-hidden">
              <div className="h-full rounded-full bg-[#6b7f5e] transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>

          {/* Dates */}
          {(project.start_date || project.end_date) && (
            <div className="flex gap-4">
              {project.start_date && <div><p className="text-[0.6rem] uppercase tracking-[0.12em] text-[rgba(75,71,65,0.45)]">Start</p><p className="text-[0.82rem] text-[#2b2b2b]">{formatDate(project.start_date)}</p></div>}
              {project.end_date && <div><p className="text-[0.6rem] uppercase tracking-[0.12em] text-[rgba(75,71,65,0.45)]">End</p><p className="text-[0.82rem] text-[#2b2b2b]">{formatDate(project.end_date)}</p></div>}
            </div>
          )}

          {/* Description */}
          {project.description && (
            <div>
              <p className="text-[0.6rem] uppercase tracking-[0.12em] text-[rgba(75,71,65,0.45)] mb-2">Description</p>
              <p className="text-[0.85rem] text-[rgba(43,43,43,0.85)] leading-relaxed">{project.description}</p>
            </div>
          )}

          {/* Tasks */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[0.6rem] uppercase tracking-[0.12em] text-[rgba(75,71,65,0.45)]">Tasks ({completedCount}/{totalTasks})</p>
              <button onClick={() => setTaskModal({ task: null })} className="rounded-full px-3 py-1 text-[0.6rem] uppercase tracking-[0.1em] bg-[rgba(107,127,94,0.85)] text-white shadow-none hover:scale-100">+ Add</button>
            </div>
            {(tasks || []).length > 0 ? (
              <div className="space-y-1">
                {(tasks || []).map(t => (
                  <div key={t.id} className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-[rgba(122,112,94,0.04)] cursor-pointer" onClick={() => toggleTask(t)}>
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${t.status === 'done' ? 'border-[#6b7f5e] bg-[#6b7f5e]' : 'border-[rgba(122,112,94,0.3)]'}`}>
                      {t.status === 'done' && <span className="text-white text-[0.55rem]">✓</span>}
                    </div>
                    <span className={`text-[0.82rem] flex-1 ${t.status === 'done' ? 'line-through text-[rgba(75,71,65,0.4)]' : 'text-[#2b2b2b]'}`}>{t.title}</span>
                    {t.due_date && <span className="text-[0.65rem] text-[rgba(75,71,65,0.4)]">{formatDate(t.due_date)}</span>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[0.8rem] text-[rgba(75,71,65,0.4)] italic">No tasks yet</p>
            )}
          </div>
        </div>
      </div>

      {taskModal && <TaskModal projectId={project.id} task={taskModal.task} onClose={() => setTaskModal(null)} />}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────

export default function VgProjects() {
  const { data: session } = useAuthSession();
  const { data: member } = useCurrentMember();
  const userId = session?.user?.id;
  const [filter, setFilter] = useState('all');
  const [projectModal, setProjectModal] = useState(null);
  const [detailProject, setDetailProject] = useState(null);

  const { data: projects } = useQuery({
    queryKey: ['vg', 'projects'],
    queryFn: () => supabase.from('projects')
      .select('*')
      .eq('realm', 'vrischgewagt')
      .order('created_at', { ascending: false })
      .then(r => r.data || []),
  });

  const { data: members } = useQuery({
    queryKey: ['vg', 'members'],
    queryFn: () => supabase.from('members')
      .select('id, user_id, name, username, color')
      .neq('archived', true)
      .then(r => r.data || []),
  });

  const memberMap = useMemo(() => {
    const m = {};
    (members || []).forEach((mem, i) => { m[mem.user_id] = { ...mem, assignedColor: getMemberColor(mem, i) }; });
    return m;
  }, [members]);

  const filtered = useMemo(() => {
    if (!projects) return [];
    switch (filter) {
      case 'active': return projects.filter(p => !p.archived && !p.completed_at);
      case 'completed': return projects.filter(p => p.completed_at && !p.archived);
      case 'archived': return projects.filter(p => p.archived);
      default: return projects;
    }
  }, [projects, filter]);

  // Status distribution for chart
  const statusChart = useMemo(() => {
    if (!projects?.length) return [];
    const counts = {};
    for (const p of projects) {
      const s = p.archived ? 'archived' : p.completed_at ? 'completed' : (p.status || 'open');
      counts[s] = (counts[s] || 0) + 1;
    }
    return Object.entries(counts).map(([name, count]) => ({ name: capitalize(name), count }));
  }, [projects]);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b border-[rgba(122,112,94,0.12)] bg-[rgba(255,252,247,0.8)] backdrop-blur-sm px-6 py-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[0.6rem] uppercase tracking-[0.2em] text-[rgba(75,71,65,0.45)] mb-1">VrischGewagt</p>
            <h1 className="text-xl font-light text-[#2b2b2b] tracking-wide">Projects</h1>
          </div>
          <button onClick={() => setProjectModal({ project: null })} className="rounded-full px-5 py-2 text-[0.65rem] uppercase tracking-[0.12em] bg-[rgba(107,127,94,0.85)] text-white shadow-none hover:scale-100">+ New Project</button>
        </div>
        <div className="flex gap-2">
          {['all', 'active', 'completed', 'archived'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`rounded-full px-4 py-1.5 text-[0.68rem] uppercase tracking-[0.12em] transition-all shadow-none hover:scale-100 ${
                filter === f ? 'bg-[rgba(122,112,94,0.18)] text-[rgba(43,43,43,0.9)]' : 'bg-transparent text-[rgba(75,71,65,0.5)] hover:bg-[rgba(122,112,94,0.08)]'
              }`}>{f}</button>
          ))}
        </div>
      </div>

      <div className="p-6 max-w-5xl space-y-6">
        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-[rgba(122,112,94,0.2)] bg-[rgba(255,252,247,0.95)] p-4 text-center">
            <p className="text-2xl font-light text-[#6b7f5e]">{(projects || []).filter(p => !p.archived && !p.completed_at).length}</p>
            <p className="text-[0.6rem] uppercase tracking-[0.14em] text-[rgba(75,71,65,0.5)]">Active</p>
          </div>
          <div className="rounded-2xl border border-[rgba(122,112,94,0.2)] bg-[rgba(255,252,247,0.95)] p-4 text-center">
            <p className="text-2xl font-light text-[#c2a66d]">{(projects || []).filter(p => p.completed_at).length}</p>
            <p className="text-[0.6rem] uppercase tracking-[0.14em] text-[rgba(75,71,65,0.5)]">Completed</p>
          </div>
          <div className="rounded-2xl border border-[rgba(122,112,94,0.2)] bg-[rgba(255,252,247,0.95)] p-4 text-center">
            <p className="text-2xl font-light text-[#2b2b2b]">{(projects || []).length}</p>
            <p className="text-[0.6rem] uppercase tracking-[0.14em] text-[rgba(75,71,65,0.5)]">Total</p>
          </div>
          {statusChart.length > 0 && (
            <div className="rounded-2xl border border-[rgba(122,112,94,0.2)] bg-[rgba(255,252,247,0.95)] p-2">
              <div style={{ height: 60 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statusChart} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {statusChart.map((entry, i) => (
                        <Cell key={i} fill={['#6b7f5e', '#c2a66d', '#8b6f47', '#999'][i % 4]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>

        {/* Project cards */}
        {!filtered.length ? (
          <p className="text-[0.85rem] text-[rgba(75,71,65,0.4)] italic py-8 text-center">No projects found</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(project => {
              const creator = memberMap[project.created_by];
              const color = creator?.assignedColor || '#6b7f5e';
              const progress = project.start_date ? progressPercent(project.start_date, project.end_date) : 0;

              return (
                <div
                  key={project.id}
                  onClick={() => setDetailProject(project)}
                  className="rounded-2xl border bg-[rgba(255,252,247,0.95)] p-5 cursor-pointer hover:shadow-lg transition-all group"
                  style={{ borderColor: `${color}40`, borderLeftWidth: 4, borderLeftColor: color }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-[0.88rem] font-medium text-[#2b2b2b] group-hover:text-[#6b7f5e] transition-colors leading-tight">{project.title}</h3>
                    <span className={`shrink-0 ml-2 inline-flex rounded-full px-2 py-0.5 text-[0.55rem] uppercase tracking-wide font-semibold ${STATUS_PILL[project.archived ? 'archived' : project.completed_at ? 'completed' : project.status] || STATUS_PILL.active}`}>
                      {project.archived ? 'archived' : project.completed_at ? 'done' : project.status || 'open'}
                    </span>
                  </div>

                  {project.description && (
                    <p className="text-[0.75rem] text-[rgba(75,71,65,0.6)] mb-3 line-clamp-2 leading-relaxed">{project.description}</p>
                  )}

                  {/* Progress bar */}
                  {project.start_date && (
                    <div className="mb-3">
                      <div className="h-1 rounded-full bg-[rgba(122,112,94,0.1)] overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, backgroundColor: color }} />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {creator && (
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-full flex items-center justify-center text-[0.5rem] font-bold text-white" style={{ backgroundColor: color }}>
                            {(creator.name || creator.username || '?').charAt(0).toUpperCase()}
                          </div>
                          <span className="text-[0.65rem] text-[rgba(75,71,65,0.5)]">{creator.username || creator.name}</span>
                        </div>
                      )}
                    </div>
                    {project.end_date && (
                      <span className="text-[0.62rem] text-[rgba(75,71,65,0.4)]">Due {formatDate(project.end_date)}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      {projectModal && <ProjectModal project={projectModal.project} onClose={() => setProjectModal(null)} userId={userId} />}
      {detailProject && <ProjectDetail project={detailProject} onClose={() => setDetailProject(null)} onEdit={p => { setDetailProject(null); setProjectModal({ project: p }); }} userId={userId} />}
    </div>
  );
}
