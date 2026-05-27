import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import {
  fetchProducts, fetchAllProductCosts, insertProduct, updateProduct, replaceProductCosts,
  fetchSales, fetchExpenses, insertSale, insertExpense, deleteSale, deleteExpense
} from '../../../lib/vg/api.js';
import { PRODUCE_CATEGORIES, MONTH_SHORT } from '../../../lib/vg/constants.js';
import { formatCurrency, formatDate, currentYearMonth, prevMonth, nextMonth, sumProductCogs, calcMarginPct, last12Months, capitalize } from '../../../lib/vg/helpers.js';
import { useIsAdmin } from '../hooks/useCurrentMember.js';
import { useAuthSession } from '../../../hooks/useAuthSession.js';

// ─── Product Modal ─────────────────────────────────────────────────────────

function ProductModal({ product, costs, category, onClose, onSaved }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: product?.name || '',
    unit: product?.unit || 'each',
    default_sell_price: product?.default_sell_price || '',
    rawMaterial: costs?.find(c => c.name === 'Raw Material')?.amount || '',
    packaging: costs?.find(c => c.name === 'Packaging')?.amount || '',
    labour: costs?.find(c => c.name === 'Labour')?.amount || '',
    other: costs?.find(c => !['Raw Material','Packaging','Labour'].includes(c.name))?.amount || '',
    otherLabel: costs?.find(c => !['Raw Material','Packaging','Labour'].includes(c.name))?.name || '',
  });
  const [saving, setSaving] = useState(false);

  const sellPrice = Number(form.default_sell_price) || 0;
  const cogs = (Number(form.rawMaterial)||0) + (Number(form.packaging)||0) + (Number(form.labour)||0) + (Number(form.other)||0);
  const margin = sellPrice - cogs;
  const marginPct = sellPrice > 0 ? Math.round((margin / sellPrice) * 100) : 0;

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      let productId;
      if (product) {
        const { data } = await updateProduct(product.id, { name: form.name, unit: form.unit, default_sell_price: sellPrice, category });
        productId = data.id;
      } else {
        const { data } = await insertProduct({ name: form.name, unit: form.unit, default_sell_price: sellPrice, category, active: true });
        productId = data.id;
      }
      const components = [
        { name: 'Raw Material', amount: Number(form.rawMaterial)||0 },
        { name: 'Packaging', amount: Number(form.packaging)||0 },
        { name: 'Labour', amount: Number(form.labour)||0 },
        { name: form.otherLabel || 'Other', amount: Number(form.other)||0 },
      ].filter(c => c.amount > 0);
      await replaceProductCosts(productId, components);
      qc.invalidateQueries({ queryKey: ['vg', 'products', category] });
      qc.invalidateQueries({ queryKey: ['vg', 'productCosts'] });
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  const inp = (label, key, type = 'number', colSpan = '') => (
    <div className={colSpan}>
      <label className="block text-[0.62rem] uppercase tracking-[0.14em] text-[rgba(75,71,65,0.55)] mb-1">{label}</label>
      <input type={type} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        className="w-full bg-transparent border-0 border-b border-[rgba(122,112,94,0.3)] px-0 py-2 text-[0.85rem] outline-none" />
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(44,42,37,0.4)] backdrop-blur-sm p-4 overflow-y-auto" onClick={e => e.target === e.currentTarget && onClose()}>
      <form onSubmit={handleSave} className="bg-[rgba(255,252,247,0.98)] rounded-2xl border border-[rgba(122,112,94,0.2)] p-8 w-full max-w-md shadow-xl my-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-light">{product ? 'Edit Product' : 'New Product'}</h2>
          <button type="button" onClick={onClose} className="bg-transparent p-0 text-2xl text-[rgba(75,71,65,0.4)] shadow-none rounded-none hover:scale-100">×</button>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-5">
          {inp('Product Name', 'name', 'text')}
          {inp('Unit', 'unit', 'text')}
          {inp('Sell Price (R)', 'default_sell_price')}
        </div>
        <p className="text-[0.65rem] uppercase tracking-[0.16em] text-[rgba(75,71,65,0.45)] mb-3 pt-3 border-t border-[rgba(122,112,94,0.1)]">Cost per unit</p>
        <div className="grid grid-cols-2 gap-4 mb-3">
          {inp('Raw Material', 'rawMaterial')}
          {inp('Packaging', 'packaging')}
          {inp('Labour', 'labour')}
          {inp('Other Cost', 'other')}
        </div>
        <div className="mb-5">{inp('Other Label', 'otherLabel', 'text')}</div>
        <div className="rounded-xl bg-[rgba(107,127,94,0.08)] px-4 py-3 mb-6 flex items-center justify-between">
          <div>
            <p className="text-[0.62rem] uppercase tracking-[0.12em] text-[rgba(75,71,65,0.5)]">COGS: {formatCurrency(cogs)} · Margin</p>
          </div>
          <p className={`text-xl font-light ${marginPct >= 0 ? 'text-[#6b7f5e]' : 'text-[#8b4a4a]'}`}>{marginPct}%</p>
        </div>
        <button type="submit" disabled={saving} className="w-full rounded-full py-3 text-[0.7rem] uppercase tracking-[0.14em] bg-[rgba(107,127,94,0.85)] text-white">
          {saving ? 'Saving…' : 'Save Product'}
        </button>
      </form>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────

export default function VgProduce() {
  const { data: session } = useAuthSession();
  const isAdmin = useIsAdmin();
  const qc = useQueryClient();
  const now = currentYearMonth();
  const [year, setYear] = useState(now.year);
  const [month, setMonth] = useState(now.month);
  const [activeCategory, setActiveCategory] = useState('olive_oil');
  const [productModal, setProductModal] = useState(null); // null | { product?, costs? }
  const [saleForm, setSaleForm] = useState({ date: new Date().toISOString().slice(0,10), product_id: '', units: 1, sell_price_actual: '', delivery_cost: 0, channel: 'direct', notes: '' });
  const [expenseForm, setExpenseForm] = useState({ date: new Date().toISOString().slice(0,10), description: '', amount: '', notes: '' });
  const [saleSaving, setSaleSaving] = useState(false);
  const [expSaving, setExpSaving] = useState(false);

  const { data: products } = useQuery({
    queryKey: ['vg', 'products', activeCategory],
    queryFn: () => fetchProducts(activeCategory).then(r => r.data || []),
  });

  const { data: allCosts } = useQuery({
    queryKey: ['vg', 'productCosts'],
    queryFn: () => fetchAllProductCosts().then(r => r.data || []),
  });

  const { data: sales } = useQuery({
    queryKey: ['vg', 'sales', activeCategory, year, month],
    queryFn: () => fetchSales({ year, month }).then(r => (r.data || []).filter(s => s.vg_products?.category === activeCategory)),
  });

  const { data: expenses } = useQuery({
    queryKey: ['vg', 'expenses', activeCategory, year, month],
    queryFn: () => fetchExpenses({ category: activeCategory, year, month }).then(r => r.data || []),
    enabled: isAdmin,
  });

  // Chart data — last 12 months
  const months12 = last12Months();
  const { data: chartData } = useQuery({
    queryKey: ['vg', 'produce', 'chart', activeCategory],
    queryFn: async () => {
      const results = await Promise.all(
        months12.map(async m => {
          const [s, e] = await Promise.all([
            fetchSales({ year: m.year, month: m.month }).then(r => r.data || []),
            fetchExpenses({ category: activeCategory, year: m.year, month: m.month }).then(r => r.data || []),
          ]);
          const revenue = s.filter(x => x.vg_products?.category === activeCategory).reduce((t, x) => t + x.sell_price_actual * x.units, 0);
          const costs = e.reduce((t, x) => t + x.amount, 0);
          return { name: `${MONTH_SHORT[m.month-1]}`, revenue, costs, profit: revenue - costs };
        })
      );
      return results;
    },
    enabled: isAdmin,
  });

  function costsForProduct(productId) {
    return (allCosts || []).filter(c => c.product_id === productId);
  }

  const totalRevenue = (sales || []).reduce((t, s) => t + s.sell_price_actual * s.units, 0);
  const totalExpenseCost = (expenses || []).reduce((t, e) => t + e.amount, 0);
  const grossProfit = totalRevenue - totalExpenseCost;

  async function logSale(e) {
    e.preventDefault();
    setSaleSaving(true);
    try {
      await insertSale({ ...saleForm, units: Number(saleForm.units), sell_price_actual: Number(saleForm.sell_price_actual), delivery_cost: Number(saleForm.delivery_cost), created_by: session?.user?.id });
      qc.invalidateQueries({ queryKey: ['vg', 'sales'] });
      setSaleForm(f => ({ ...f, units: 1, sell_price_actual: '', notes: '' }));
    } finally { setSaleSaving(false); }
  }

  async function logExpense(e) {
    e.preventDefault();
    setExpSaving(true);
    try {
      await insertExpense({ ...expenseForm, amount: Number(expenseForm.amount), category: activeCategory, created_by: session?.user?.id });
      qc.invalidateQueries({ queryKey: ['vg', 'expenses'] });
      setExpenseForm(f => ({ ...f, description: '', amount: '', notes: '' }));
    } finally { setExpSaving(false); }
  }

  const selectedProduct = (products || []).find(p => p.id === saleForm.product_id);
  const saleCogs = selectedProduct ? sumProductCogs(costsForProduct(selectedProduct.id)) * Number(saleForm.units || 1) : 0;
  const saleRevenue = Number(saleForm.sell_price_actual || 0) * Number(saleForm.units || 1);
  const saleGrossProfit = saleRevenue - saleCogs;

  function onPrev() { const p = prevMonth(year, month); setYear(p.year); setMonth(p.month); }
  function onNext() { const n = nextMonth(year, month); setYear(n.year); setMonth(n.month); }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b border-[rgba(122,112,94,0.12)] bg-[rgba(255,252,247,0.8)] backdrop-blur-sm px-6 py-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[0.6rem] uppercase tracking-[0.2em] text-[rgba(75,71,65,0.45)] mb-1">VrischGewagt</p>
            <h1 className="text-xl font-light text-[#2b2b2b] tracking-wide">Produce</h1>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={onPrev} className="rounded-lg px-3 py-1.5 text-sm bg-transparent text-[rgba(75,71,65,0.6)] hover:bg-[rgba(122,112,94,0.1)] shadow-none hover:scale-100">←</button>
            <span className="text-[0.78rem] font-medium text-[#2b2b2b] w-24 text-center">{MONTH_SHORT[month-1]} {year}</span>
            <button onClick={onNext} className="rounded-lg px-3 py-1.5 text-sm bg-transparent text-[rgba(75,71,65,0.6)] hover:bg-[rgba(122,112,94,0.1)] shadow-none hover:scale-100">→</button>
          </div>
        </div>
        {/* Category tabs */}
        <div className="flex gap-2 flex-wrap">
          {PRODUCE_CATEGORIES.map(cat => (
            <button key={cat.key} onClick={() => setActiveCategory(cat.key)}
              className={`rounded-full px-4 py-1.5 text-[0.68rem] uppercase tracking-[0.12em] transition-all shadow-none hover:scale-100 ${
                activeCategory === cat.key ? 'bg-[rgba(122,112,94,0.18)] text-[rgba(43,43,43,0.9)]' : 'bg-transparent text-[rgba(75,71,65,0.5)] hover:bg-[rgba(122,112,94,0.08)]'
              }`}>{cat.icon} {cat.label}</button>
          ))}
        </div>
      </div>

      <div className="p-6 max-w-5xl space-y-8">
        {/* Admin financial summary */}
        {isAdmin && (
          <section>
            <p className="text-[0.6rem] uppercase tracking-[0.2em] text-[rgba(75,71,65,0.45)] mb-4">{MONTH_SHORT[month-1]} {year} — Summary</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-2xl border border-[rgba(122,112,94,0.2)] bg-[rgba(255,252,247,0.95)] p-5">
                <p className="text-[0.62rem] uppercase tracking-[0.14em] text-[rgba(75,71,65,0.5)] mb-1">Revenue</p>
                <p className="text-2xl font-light text-[#6b7f5e]">{formatCurrency(totalRevenue)}</p>
              </div>
              <div className="rounded-2xl border border-[rgba(122,112,94,0.2)] bg-[rgba(255,252,247,0.95)] p-5">
                <p className="text-[0.62rem] uppercase tracking-[0.14em] text-[rgba(75,71,65,0.5)] mb-1">Expenses</p>
                <p className="text-2xl font-light text-[#c2a66d]">{formatCurrency(totalExpenseCost)}</p>
              </div>
              <div className="rounded-2xl border border-[rgba(122,112,94,0.2)] bg-[rgba(255,252,247,0.95)] p-5">
                <p className="text-[0.62rem] uppercase tracking-[0.14em] text-[rgba(75,71,65,0.5)] mb-1">Gross Profit</p>
                <p className={`text-2xl font-light ${grossProfit >= 0 ? 'text-[#6b7f5e]' : 'text-[#8b4a4a]'}`}>{formatCurrency(grossProfit)}</p>
              </div>
            </div>
          </section>
        )}

        {/* Products */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <p className="text-[0.6rem] uppercase tracking-[0.2em] text-[rgba(75,71,65,0.45)]">Products</p>
            <button onClick={() => setProductModal({ product: null, costs: [] })} className="rounded-full px-4 py-1.5 text-[0.62rem] uppercase tracking-[0.1em] bg-[rgba(107,127,94,0.85)] text-white shadow-none hover:scale-100">+ Add Product</button>
          </div>
          {!(products || []).length ? (
            <p className="text-[0.8rem] text-[rgba(75,71,65,0.4)] italic">No products yet — add one above</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {(products || []).map(p => {
                const pc = costsForProduct(p.id);
                const cogs = sumProductCogs(pc);
                const margin = calcMarginPct(p.default_sell_price, cogs);
                return (
                  <div key={p.id} className="rounded-2xl border border-[rgba(122,112,94,0.2)] bg-[rgba(255,252,247,0.95)] p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-[0.85rem] font-medium text-[#2b2b2b]">{p.name}</h3>
                        <p className="text-[0.68rem] text-[rgba(75,71,65,0.5)] uppercase tracking-[0.1em]">{p.unit}</p>
                      </div>
                      {isAdmin && (
                        <button onClick={() => setProductModal({ product: p, costs: pc })} className="rounded-full px-3 py-1 text-[0.6rem] uppercase tracking-[0.1em] bg-transparent border border-[rgba(122,112,94,0.3)] text-[rgba(75,71,65,0.6)] shadow-none hover:scale-100 hover:bg-[rgba(122,112,94,0.1)]">Edit</button>
                      )}
                    </div>
                    {isAdmin && (
                      <>
                        <div className="space-y-1 mb-3">
                          <div className="flex justify-between text-[0.75rem]"><span className="text-[rgba(75,71,65,0.5)]">Sell Price</span><span className="font-medium">{formatCurrency(p.default_sell_price)}</span></div>
                          <div className="flex justify-between text-[0.75rem]"><span className="text-[rgba(75,71,65,0.5)]">COGS</span><span>{formatCurrency(cogs)}</span></div>
                          {pc.map(c => (
                            <div key={c.id} className="flex justify-between text-[0.7rem] pl-2"><span className="text-[rgba(75,71,65,0.4)]">· {c.name}</span><span className="text-[rgba(75,71,65,0.5)]">{formatCurrency(c.amount)}</span></div>
                          ))}
                        </div>
                        <div className="rounded-lg bg-[rgba(107,127,94,0.08)] px-3 py-2 flex justify-between items-center">
                          <span className="text-[0.62rem] uppercase tracking-[0.1em] text-[rgba(75,71,65,0.5)]">Margin</span>
                          <span className={`text-lg font-light ${margin >= 0 ? 'text-[#6b7f5e]' : 'text-[#8b4a4a]'}`}>{margin}%</span>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Log a Sale */}
        <section className="rounded-2xl border border-[rgba(122,112,94,0.2)] bg-[rgba(255,252,247,0.95)] p-6">
          <p className="text-[0.65rem] uppercase tracking-[0.18em] text-[rgba(75,71,65,0.5)] mb-5">Log a Sale</p>
          <form onSubmit={logSale}>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-5 mb-5">
              <div>
                <label className="block text-[0.62rem] uppercase tracking-[0.14em] text-[rgba(75,71,65,0.55)] mb-1">Date</label>
                <input type="date" value={saleForm.date} onChange={e => setSaleForm(f => ({ ...f, date: e.target.value }))}
                  className="w-full bg-transparent border-0 border-b border-[rgba(122,112,94,0.3)] px-0 py-2 text-[0.85rem] outline-none" />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-[0.62rem] uppercase tracking-[0.14em] text-[rgba(75,71,65,0.55)] mb-1">Product</label>
                <select value={saleForm.product_id} onChange={e => { const p = (products||[]).find(x => x.id === e.target.value); setSaleForm(f => ({ ...f, product_id: e.target.value, sell_price_actual: p?.default_sell_price || '' })); }}
                  className="w-full bg-transparent border-0 border-b border-[rgba(122,112,94,0.3)] px-0 py-2 text-[0.85rem] outline-none">
                  <option value="">Select product</option>
                  {(products||[]).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[0.62rem] uppercase tracking-[0.14em] text-[rgba(75,71,65,0.55)] mb-1">Units</label>
                <input type="number" min="0.01" step="0.01" value={saleForm.units} onChange={e => setSaleForm(f => ({ ...f, units: e.target.value }))}
                  className="w-full bg-transparent border-0 border-b border-[rgba(122,112,94,0.3)] px-0 py-2 text-[0.85rem] outline-none" />
              </div>
              <div>
                <label className="block text-[0.62rem] uppercase tracking-[0.14em] text-[rgba(75,71,65,0.55)] mb-1">Sell Price (R)</label>
                <input type="number" min="0" step="0.01" value={saleForm.sell_price_actual} onChange={e => setSaleForm(f => ({ ...f, sell_price_actual: e.target.value }))}
                  className="w-full bg-transparent border-0 border-b border-[rgba(122,112,94,0.3)] px-0 py-2 text-[0.85rem] outline-none" />
              </div>
              <div>
                <label className="block text-[0.62rem] uppercase tracking-[0.14em] text-[rgba(75,71,65,0.55)] mb-1">Delivery Cost (R)</label>
                <input type="number" min="0" step="0.01" value={saleForm.delivery_cost} onChange={e => setSaleForm(f => ({ ...f, delivery_cost: e.target.value }))}
                  className="w-full bg-transparent border-0 border-b border-[rgba(122,112,94,0.3)] px-0 py-2 text-[0.85rem] outline-none" />
              </div>
              <div>
                <label className="block text-[0.62rem] uppercase tracking-[0.14em] text-[rgba(75,71,65,0.55)] mb-1">Channel</label>
                <select value={saleForm.channel} onChange={e => setSaleForm(f => ({ ...f, channel: e.target.value }))}
                  className="w-full bg-transparent border-0 border-b border-[rgba(122,112,94,0.3)] px-0 py-2 text-[0.85rem] outline-none">
                  {['direct','market','wholesale','online'].map(c => <option key={c} value={c}>{capitalize(c)}</option>)}
                </select>
              </div>
            </div>
            {isAdmin && saleForm.product_id && (
              <div className="rounded-xl bg-[rgba(107,127,94,0.08)] px-4 py-3 mb-4 flex gap-6 flex-wrap">
                <div><p className="text-[0.6rem] uppercase tracking-[0.1em] text-[rgba(75,71,65,0.45)]">Revenue</p><p className="text-lg font-light text-[#6b7f5e]">{formatCurrency(saleRevenue)}</p></div>
                <div><p className="text-[0.6rem] uppercase tracking-[0.1em] text-[rgba(75,71,65,0.45)]">COGS</p><p className="text-lg font-light text-[#c2a66d]">{formatCurrency(saleCogs)}</p></div>
                <div><p className="text-[0.6rem] uppercase tracking-[0.1em] text-[rgba(75,71,65,0.45)]">Gross Profit</p><p className={`text-lg font-light ${saleGrossProfit >= 0 ? 'text-[#6b7f5e]' : 'text-[#8b4a4a]'}`}>{formatCurrency(saleGrossProfit)}</p></div>
              </div>
            )}
            <button type="submit" disabled={saleSaving || !saleForm.product_id} className="rounded-full px-6 py-2.5 text-[0.68rem] uppercase tracking-[0.12em] bg-[rgba(107,127,94,0.85)] text-white">
              {saleSaving ? 'Logging…' : 'Log Sale'}
            </button>
          </form>

          {/* Recent sales list */}
          {(sales || []).length > 0 && (
            <div className="mt-6 pt-5 border-t border-[rgba(122,112,94,0.12)]">
              <p className="text-[0.6rem] uppercase tracking-[0.14em] text-[rgba(75,71,65,0.45)] mb-3">Recent Sales</p>
              <div className="space-y-2">
                {(sales || []).slice(0, 6).map(s => (
                  <div key={s.id} className="flex items-center justify-between py-2 border-b border-[rgba(122,112,94,0.08)]">
                    <div>
                      <p className="text-[0.82rem] text-[#2b2b2b]">{s.vg_products?.name} · {s.units} units</p>
                      <p className="text-[0.68rem] text-[rgba(75,71,65,0.5)]">{formatDate(s.date)} · {capitalize(s.channel || '')}</p>
                    </div>
                    {isAdmin && <p className="text-[0.82rem] font-light text-[#6b7f5e]">{formatCurrency(s.sell_price_actual * s.units)}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Log an Expense */}
        <section className="rounded-2xl border border-[rgba(122,112,94,0.2)] bg-[rgba(255,252,247,0.95)] p-6">
          <p className="text-[0.65rem] uppercase tracking-[0.18em] text-[rgba(75,71,65,0.5)] mb-5">Log an Expense</p>
          <form onSubmit={logExpense}>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-5 mb-5">
              <div>
                <label className="block text-[0.62rem] uppercase tracking-[0.14em] text-[rgba(75,71,65,0.55)] mb-1">Date</label>
                <input type="date" value={expenseForm.date} onChange={e => setExpenseForm(f => ({ ...f, date: e.target.value }))}
                  className="w-full bg-transparent border-0 border-b border-[rgba(122,112,94,0.3)] px-0 py-2 text-[0.85rem] outline-none" />
              </div>
              <div className="col-span-2">
                <label className="block text-[0.62rem] uppercase tracking-[0.14em] text-[rgba(75,71,65,0.55)] mb-1">Description</label>
                <input type="text" value={expenseForm.description} onChange={e => setExpenseForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full bg-transparent border-0 border-b border-[rgba(122,112,94,0.3)] px-0 py-2 text-[0.85rem] outline-none" />
              </div>
              <div>
                <label className="block text-[0.62rem] uppercase tracking-[0.14em] text-[rgba(75,71,65,0.55)] mb-1">Amount (R)</label>
                <input type="number" min="0" step="0.01" value={expenseForm.amount} onChange={e => setExpenseForm(f => ({ ...f, amount: e.target.value }))}
                  className="w-full bg-transparent border-0 border-b border-[rgba(122,112,94,0.3)] px-0 py-2 text-[0.85rem] outline-none" required />
              </div>
            </div>
            <button type="submit" disabled={expSaving} className="rounded-full px-6 py-2.5 text-[0.68rem] uppercase tracking-[0.12em] bg-[rgba(107,127,94,0.85)] text-white">
              {expSaving ? 'Logging…' : 'Log Expense'}
            </button>
          </form>
          {isAdmin && (expenses || []).length > 0 && (
            <div className="mt-5 pt-4 border-t border-[rgba(122,112,94,0.1)]">
              {(expenses || []).slice(0, 5).map(e => (
                <div key={e.id} className="flex justify-between py-2 border-b border-[rgba(122,112,94,0.08)] text-[0.82rem]">
                  <div><p className="text-[#2b2b2b]">{e.description}</p><p className="text-[0.68rem] text-[rgba(75,71,65,0.5)]">{formatDate(e.date)}</p></div>
                  <p className="text-[#c2a66d]">{formatCurrency(e.amount)}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Area chart */}
        {isAdmin && chartData && (
          <section>
            <p className="text-[0.6rem] uppercase tracking-[0.2em] text-[rgba(75,71,65,0.45)] mb-4">12-Month Performance</p>
            <div className="rounded-2xl border border-[rgba(122,112,94,0.2)] bg-[rgba(255,252,247,0.95)] p-5">
              <div style={{ height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <defs>
                      <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6b7f5e" stopOpacity={0.2}/><stop offset="95%" stopColor="#6b7f5e" stopOpacity={0}/></linearGradient>
                      <linearGradient id="profGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#2b2b2b" stopOpacity={0.15}/><stop offset="95%" stopColor="#2b2b2b" stopOpacity={0}/></linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(122,112,94,0.12)" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'rgba(75,71,65,0.5)' }} />
                    <YAxis tick={{ fontSize: 10, fill: 'rgba(75,71,65,0.5)' }} tickFormatter={v => `R${(v/1000).toFixed(0)}k`} />
                    <Tooltip contentStyle={{ background: 'rgba(255,252,247,0.97)', border: '1px solid rgba(122,112,94,0.2)', borderRadius: 12, fontSize: 12 }} formatter={v => formatCurrency(v)} />
                    <Area type="monotone" dataKey="revenue" stroke="#6b7f5e" strokeWidth={2} fill="url(#revGrad)" name="Revenue" />
                    <Area type="monotone" dataKey="costs" stroke="#c2a66d" strokeWidth={2} fill="none" name="Costs" />
                    <Area type="monotone" dataKey="profit" stroke="#2b2b2b" strokeWidth={2} fill="url(#profGrad)" name="Profit" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>
        )}
      </div>

      {/* Product modal */}
      {productModal && (
        <ProductModal
          product={productModal.product}
          costs={productModal.costs || []}
          category={activeCategory}
          onClose={() => setProductModal(null)}
          onSaved={() => setProductModal(null)}
        />
      )}
    </div>
  );
}
