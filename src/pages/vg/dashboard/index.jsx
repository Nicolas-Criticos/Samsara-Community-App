import { useState, useRef, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase.js';
import { useIsAdmin, useCurrentMember } from '../hooks/useCurrentMember.js';
import { useAuthSession } from '../../../hooks/useAuthSession.js';
import { formatCurrency, currentYearMonth, formatDate } from '../../../lib/vg/helpers.js';
import { MONTH_NAMES, MEMBER_COLORS } from '../../../lib/vg/constants.js';

const COLORS = ['#6b7f5e','#c2a66d','#8b6f47','#5a7a5a','#4a6b8b','#7a5a8b','#8b4a4a','#4a8b7a'];
function memberColor(member, allMembers) {
  if (member?.color) return member.color;
  const idx = (allMembers||[]).findIndex(m => m.id === member?.id);
  return COLORS[(idx >= 0 ? idx : 0) % COLORS.length];
}

// ─── Chat Drawer ─────────────────────────────────────────────────────────

function ChatDrawer({ recipient, currentUserId, onClose }) {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const qc = useQueryClient();
  const bottomRef = useRef(null);

  const { data: messages } = useQuery({
    queryKey: ['vg', 'messages', currentUserId, recipient.user_id],
    queryFn: async () => {
      const { data } = await supabase.from('vg_messages')
        .select('*')
        .or(`and(sender_id.eq.${currentUserId},recipient_id.eq.${recipient.user_id}),and(sender_id.eq.${recipient.user_id},recipient_id.eq.${currentUserId})`)
        .order('created_at', { ascending: true });
      return data || [];
    },
    refetchInterval: 5000,
  });

  // Mark unread as read
  useEffect(() => {
    if (!messages?.length) return;
    const unread = messages.filter(m => m.recipient_id === currentUserId && !m.read).map(m => m.id);
    if (unread.length) {
      supabase.from('vg_messages').update({ read: true }).in('id', unread).then(() => {
        qc.invalidateQueries({ queryKey: ['vg', 'messages'] });
      });
    }
  }, [messages]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  async function send(e) {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    try {
      await supabase.from('vg_messages').insert({ sender_id: currentUserId, recipient_id: recipient.user_id, content: text.trim() });
      qc.invalidateQueries({ queryKey: ['vg', 'messages', currentUserId, recipient.user_id] });
      setText('');
    } finally { setSending(false); }
  }

  const rColor = memberColor(recipient, [recipient]);
  const initial = (recipient.name || recipient.username || '?').charAt(0).toUpperCase();

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end p-4 sm:p-6 pointer-events-none">
      <div className="pointer-events-auto w-full max-w-sm bg-[rgba(255,252,247,0.99)] rounded-2xl border border-[rgba(122,112,94,0.2)] shadow-2xl flex flex-col overflow-hidden" style={{ height: 'min(520px, 80vh)' }}>
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[rgba(122,112,94,0.12)] bg-[rgba(248,244,236,0.9)]">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-[0.65rem] font-bold text-white shrink-0" style={{ backgroundColor: rColor }}>{initial}</div>
          <div className="flex-1 min-w-0">
            <p className="text-[0.82rem] font-medium text-[#2b2b2b] truncate">{recipient.name || recipient.username}</p>
            <p className="text-[0.58rem] uppercase tracking-[0.1em] text-[rgba(75,71,65,0.45)]">{recipient.role || 'Member'}</p>
          </div>
          <button onClick={onClose} className="bg-transparent p-0 text-xl text-[rgba(75,71,65,0.35)] shadow-none rounded-none hover:scale-100">×</button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          {(messages || []).length === 0 && (
            <p className="text-center text-[0.75rem] text-[rgba(75,71,65,0.35)] italic mt-8">Start a conversation…</p>
          )}
          {(messages || []).map(msg => {
            const isMine = msg.sender_id === currentUserId;
            return (
              <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-3.5 py-2 ${isMine ? 'rounded-br-sm bg-[rgba(107,127,94,0.15)]' : 'rounded-bl-sm bg-[rgba(122,112,94,0.08)]'}`}>
                  <p className="text-[0.82rem] text-[#2b2b2b] leading-relaxed">{msg.content}</p>
                  <p className="text-[0.55rem] text-[rgba(75,71,65,0.35)] mt-0.5 text-right">
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <form onSubmit={send} className="flex items-center gap-2 px-4 py-3 border-t border-[rgba(122,112,94,0.12)]">
          <input
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Message…"
            className="flex-1 bg-[rgba(122,112,94,0.06)] rounded-full px-4 py-2 text-[0.82rem] outline-none border border-[rgba(122,112,94,0.15)] focus:border-[rgba(107,127,94,0.35)] placeholder:text-[rgba(75,71,65,0.3)]"
          />
          <button type="submit" disabled={sending || !text.trim()} className="w-9 h-9 rounded-full flex items-center justify-center bg-[rgba(107,127,94,0.85)] text-white shadow-none hover:scale-100 shrink-0 disabled:opacity-40">
            <span className="text-sm">↑</span>
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Member Card ─────────────────────────────────────────────────────────

function MemberCard({ member, allMembers, currentUserId, unreadCount, onClick, isAdmin, currentMemberId, onRoleToggle }) {
  const color = memberColor(member, allMembers);
  const initial = (member.name || member.username || '?').charAt(0).toUpperCase();
  const isSelf = member.user_id === currentUserId;
  const [toggling, setToggling] = useState(false);
  const [toast, setToast] = useState('');

  async function handleRoleToggle(e) {
    e.stopPropagation();
    setToggling(true);
    await onRoleToggle(member);
    const newRole = member.role === 'Admin' ? 'Member' : 'Admin';
    setToast(`${member.name || member.username} is now ${newRole}`);
    setToggling(false);
    setTimeout(() => setToast(''), 3000);
  }

  return (
    <div
      onClick={() => !isSelf && onClick(member)}
      className={`rounded-2xl border border-[rgba(122,112,94,0.18)] bg-[rgba(255,252,247,0.95)] p-4 flex items-center gap-3 transition-all ${!isSelf ? 'cursor-pointer hover:shadow-md hover:border-[rgba(122,112,94,0.35)]' : ''}`}
    >
      <div className="relative shrink-0">
        <div className="w-10 h-10 rounded-full flex items-center justify-center text-[0.8rem] font-bold text-white" style={{ backgroundColor: color }}>{initial}</div>
        {unreadCount > 0 && (
          <div className="absolute -top-1 -right-1 w-4.5 h-4.5 min-w-[18px] bg-[#8b4a4a] rounded-full flex items-center justify-center text-[0.5rem] text-white font-bold">{unreadCount}</div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-[0.82rem] font-medium text-[#2b2b2b] truncate">{member.name || member.username}</p>
          {member.role === 'Admin' && (
            <span className="rounded-full px-1.5 py-0.5 text-[0.52rem] uppercase tracking-[0.1em] bg-[rgba(194,166,109,0.15)] text-[#c2a66d] border border-[rgba(194,166,109,0.3)]">Admin</span>
          )}
        </div>
        <p className="text-[0.62rem] text-[rgba(75,71,65,0.45)] uppercase tracking-[0.1em]">{isSelf ? 'You' : (member.username || '')}</p>
        {toast && (
          <p className="text-[0.62rem] text-[#6b7f5e] mt-1 font-medium">{toast}</p>
        )}
        {isAdmin && member.id !== currentMemberId && (
          <button
            onClick={handleRoleToggle}
            disabled={toggling}
            className="mt-1.5 rounded-full px-3 py-0.5 text-[0.58rem] uppercase tracking-[0.1em] bg-transparent border border-[rgba(122,112,94,0.25)] text-[rgba(75,71,65,0.5)] shadow-none hover:scale-100 hover:bg-[rgba(122,112,94,0.08)] disabled:opacity-40"
          >
            {toggling ? '…' : (member.role === 'Admin' ? 'Remove Admin' : 'Make Admin')}
          </button>
        )}
      </div>
      {!isSelf && (
        <div className="text-[rgba(75,71,65,0.3)] text-sm">💬</div>
      )}
    </div>
  );
}

// ─── Stat Card ─────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, color = '#6b7f5e' }) {
  return (
    <div className="rounded-2xl border border-[rgba(122,112,94,0.2)] bg-[rgba(255,252,247,0.95)] p-5 backdrop-blur-sm">
      <p className="text-[0.62rem] uppercase tracking-[0.16em] text-[rgba(75,71,65,0.55)] mb-2">{label}</p>
      <p className="text-2xl font-light" style={{ color }}>{value}</p>
      {sub && <p className="text-[0.7rem] text-[rgba(75,71,65,0.5)] mt-1">{sub}</p>}
    </div>
  );
}

// ─── Main Dashboard ──────────────────────────────────────────────────────

export default function VgDashboard() {
  const isAdmin = useIsAdmin();
  const { data: session } = useAuthSession();
  const { data: currentMember } = useCurrentMember();
  const currentUserId = session?.user?.id;
  const { year, month } = currentYearMonth();
  const [chatWith, setChatWith] = useState(null);
  const qc = useQueryClient();

  const { data: members } = useQuery({
    queryKey: ['vg', 'members'],
    queryFn: () => supabase.from('members').select('id, user_id, name, username, role, color').neq('archived', true).order('name').then(r => r.data || []),
  });

  // Unread message counts per sender
  const { data: unreadMessages } = useQuery({
    queryKey: ['vg', 'messages', 'unread', currentUserId],
    queryFn: async () => {
      if (!currentUserId) return {};
      const { data } = await supabase.from('vg_messages').select('sender_id').eq('recipient_id', currentUserId).eq('read', false);
      const counts = {};
      (data || []).forEach(m => { counts[m.sender_id] = (counts[m.sender_id] || 0) + 1; });
      return counts;
    },
    enabled: !!currentUserId,
    refetchInterval: 10000,
  });

  const { data: sales } = useQuery({
    queryKey: ['vg', 'sales', year, month],
    queryFn: () => { const nm = month + 1 > 12 ? 1 : month + 1; const ny = month + 1 > 12 ? year + 1 : year; return supabase.from('vg_sales').select('*, vg_products(name,category)').gte('date', `${year}-${String(month).padStart(2,'0')}-01`).lt('date', `${ny}-${String(nm).padStart(2,'0')}-01`).then(r => r.data || []); },
  });

  const { data: expenses } = useQuery({
    queryKey: ['vg', 'expenses', year, month],
    queryFn: () => { const nm = month + 1 > 12 ? 1 : month + 1; const ny = month + 1 > 12 ? year + 1 : year; return supabase.from('vg_expenses').select('*').gte('date', `${year}-${String(month).padStart(2,'0')}-01`).lt('date', `${ny}-${String(nm).padStart(2,'0')}-01`).then(r => r.data || []); },
    enabled: isAdmin,
  });

  const { data: bookings } = useQuery({
    queryKey: ['vg', 'bookings', year, month],
    queryFn: () => { const nm = month + 1 > 12 ? 1 : month + 1; const ny = month + 1 > 12 ? year + 1 : year; return supabase.from('vg_bookings').select('*, vg_units(name)').gte('check_in', `${year}-${String(month).padStart(2,'0')}-01`).lt('check_in', `${ny}-${String(nm).padStart(2,'0')}-01`).then(r => r.data || []); },
  });

  const { data: staffLogs } = useQuery({
    queryKey: ['vg', 'staffLogs', year, month],
    queryFn: () => supabase.from('vg_staff_logs').select('*, vg_staff(name, daily_rate)').eq('year', year).eq('month', month).then(r => r.data || []),
    enabled: isAdmin,
  });

  const { data: livestock } = useQuery({
    queryKey: ['vg', 'livestock', 'dashboard', year, month],
    queryFn: () => supabase.from('vg_livestock_monthly').select('*').eq('year', year).eq('month', month).then(r => r.data || []),
  });

  const { data: projects } = useQuery({
    queryKey: ['vg', 'projects', 'active'],
    queryFn: () => supabase.from('projects').select('id, title, status, start_date, end_date').eq('realm', 'vrischgewagt').is('archived', false).is('completed_at', null).order('created_at', { ascending: false }).limit(5).then(r => r.data || []),
  });

  const totalSalesRevenue = (sales||[]).reduce((s,r) => s + r.sell_price_actual * r.units, 0);
  const totalBookingRevenue = (bookings||[]).reduce((s,r) => s + (r.total||0), 0);
  const totalRevenue = totalSalesRevenue + totalBookingRevenue;
  const totalExpenses = (expenses||[]).reduce((s,r) => s + r.amount, 0);
  const totalStaffCost = (staffLogs||[]).reduce((s,r) => {
    if (r.total_cash_paid != null && r.total_cash_paid > 0) return s + (r.total_cash_paid || 0) + (r.staff_expenses || 0);
    return s + ((r.days_worked || 0) * (r.vg_staff?.daily_rate||0)) + (r.bonus||0) - (r.advance||0);
  }, 0);
  const totalCosts = totalExpenses + totalStaffCost;
  const netProfit = totalRevenue - totalCosts;
  const totalSheep = (livestock||[]).filter(r => r.animal_type === 'sheep').reduce((s,r) => s + (r.closing_count||0), 0);
  const totalCattle = (livestock||[]).filter(r => r.animal_type === 'cattle').reduce((s,r) => s + (r.closing_count||0), 0);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b border-[rgba(122,112,94,0.12)] bg-[rgba(255,252,247,0.8)] backdrop-blur-sm px-6 py-5">
        <p className="text-[0.6rem] uppercase tracking-[0.2em] text-[rgba(75,71,65,0.45)] mb-1">VrischGewagt</p>
        <h1 className="text-xl font-light text-[#2b2b2b] tracking-wide">Dashboard</h1>
        <p className="text-[0.72rem] text-[rgba(75,71,65,0.5)] mt-0.5">{MONTH_NAMES[month-1]} {year}</p>
      </div>

      <div className="p-6 max-w-5xl space-y-8">
        {/* Financial stats — admin only */}
        {isAdmin && (
          <section>
            <p className="text-[0.6rem] uppercase tracking-[0.2em] text-[rgba(75,71,65,0.4)] mb-4">This Month</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard label="Total Revenue" value={formatCurrency(totalRevenue)} color="#6b7f5e" />
              <StatCard label="Total Costs" value={formatCurrency(totalCosts)} color="#c2a66d" />
              <StatCard label="Net Profit" value={formatCurrency(netProfit)} color={netProfit >= 0 ? '#6b7f5e' : '#8b4a4a'} sub={netProfit >= 0 ? 'Positive' : 'Negative'} />
            </div>
          </section>
        )}

        {/* Livestock + bookings quick stats */}
        <section>
          <p className="text-[0.6rem] uppercase tracking-[0.2em] text-[rgba(75,71,65,0.4)] mb-4">Overview</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard label="Sheep" value={totalSheep || '—'} color="#8b6f47" />
            <StatCard label="Cattle" value={totalCattle || '—'} color="#5a7a5a" />
            <StatCard label="Bookings" value={(bookings||[]).length} sub="this month" color="#4a6b8b" />
            <StatCard label="Sales" value={(sales||[]).length} sub="this month" color="#6b7f5e" />
          </div>
        </section>

        {/* Active Projects */}
        {(projects||[]).length > 0 && (
          <section>
            <p className="text-[0.6rem] uppercase tracking-[0.2em] text-[rgba(75,71,65,0.4)] mb-4">Active Projects</p>
            <div className="rounded-2xl border border-[rgba(122,112,94,0.2)] bg-[rgba(255,252,247,0.95)] overflow-hidden">
              {(projects||[]).map((p, i, arr) => {
                const prog = p.start_date ? Math.min(100, Math.round(((new Date() - new Date(p.start_date)) / (new Date(p.end_date || Date.now()) - new Date(p.start_date))) * 100)) : 0;
                return (
                  <div key={p.id} className={`flex items-center gap-4 px-5 py-3.5 ${i < arr.length-1 ? 'border-b border-[rgba(122,112,94,0.08)]' : ''}`}>
                    <div className="flex-1 min-w-0">
                      <p className="text-[0.82rem] font-medium text-[#2b2b2b] truncate">{p.title}</p>
                      {p.end_date && <p className="text-[0.65rem] text-[rgba(75,71,65,0.45)]">Due {formatDate(p.end_date)}</p>}
                    </div>
                    {p.start_date && (
                      <div className="w-20 shrink-0">
                        <div className="h-1 rounded-full bg-[rgba(122,112,94,0.12)] overflow-hidden">
                          <div className="h-full rounded-full bg-[#6b7f5e]" style={{ width: `${Math.max(0, prog)}%` }} />
                        </div>
                        <p className="text-[0.55rem] text-[rgba(75,71,65,0.35)] text-right mt-0.5">{Math.max(0, prog)}%</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Team / Members */}
        <section>
          <p className="text-[0.6rem] uppercase tracking-[0.2em] text-[rgba(75,71,65,0.4)] mb-4">Team</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {(members||[]).map(m => (
              <MemberCard
                key={m.id}
                member={m}
                allMembers={members}
                currentUserId={currentUserId}
                unreadCount={(unreadMessages||{})[m.user_id] || 0}
                onClick={setChatWith}
                isAdmin={isAdmin}
                currentMemberId={currentMember?.id}
                onRoleToggle={async (mem) => { await supabase.from('members').update({ role: mem.role === 'Admin' ? 'Member' : 'Admin' }).eq('id', mem.id); qc.invalidateQueries({ queryKey: ['vg', 'members'] }); }}
              />
            ))}
          </div>
          <p className="text-[0.62rem] text-[rgba(75,71,65,0.35)] mt-2 italic">Click a member to send a message</p>
        </section>

        {/* Recent bookings */}
        {(bookings||[]).length > 0 && (
          <section>
            <p className="text-[0.6rem] uppercase tracking-[0.2em] text-[rgba(75,71,65,0.4)] mb-4">Recent Bookings</p>
            <div className="rounded-2xl border border-[rgba(122,112,94,0.2)] bg-[rgba(255,252,247,0.95)] overflow-hidden">
              {(bookings||[]).slice(0,5).map((b,i,arr) => (
                <div key={b.id} className={`flex items-center justify-between px-5 py-3.5 ${i < arr.length-1 ? 'border-b border-[rgba(122,112,94,0.08)]' : ''}`}>
                  <div>
                    <p className="text-[0.82rem] font-medium text-[#2b2b2b]">{b.guest_name}</p>
                    <p className="text-[0.68rem] text-[rgba(75,71,65,0.5)]">{b.vg_units?.name} · {formatDate(b.check_in)} → {formatDate(b.check_out)}</p>
                  </div>
                  {isAdmin && <p className="text-[0.82rem] font-light text-[#6b7f5e]">{formatCurrency(b.total)}</p>}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Chat drawer */}
      {chatWith && (
        <ChatDrawer
          recipient={chatWith}
          currentUserId={currentUserId}
          onClose={() => setChatWith(null)}
        />
      )}
    </div>
  );
}
