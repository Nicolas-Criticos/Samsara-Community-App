import { supabase } from '../supabase.js';

// ─── Members ─────────────────────────────────────────────────────────────────

export const fetchCurrentMember = (userId) =>
  supabase.from('members').select('id, name, username, role, color').eq('user_id', userId).maybeSingle();

export const updateMemberColor = (userId, color) =>
  supabase.from('members').update({ color }).eq('user_id', userId);

// ─── Livestock Monthly ────────────────────────────────────────────────────────

export const fetchLivestockMonthly = (year, month, animalType) =>
  supabase.from('vg_livestock_monthly')
    .select('*')
    .eq('year', year)
    .eq('month', month)
    .eq('animal_type', animalType);

export const fetchLivestockMonthlyRange = (animalType, months) => {
  // months = [{year, month}, ...]
  const conditions = months.map(m => `and(year.eq.${m.year},month.eq.${m.month})`).join(',');
  return supabase.from('vg_livestock_monthly')
    .select('*')
    .eq('animal_type', animalType)
    .or(conditions)
    .order('year').order('month');
};

export const upsertLivestockMonthly = (row) =>
  supabase.from('vg_livestock_monthly')
    .upsert(row, { onConflict: 'year,month,animal_type,category' })
    .select()
    .single();

// ─── Livestock Registry ───────────────────────────────────────────────────────

export const fetchLivestockRegistry = (animalType) =>
  supabase.from('vg_livestock_registry')
    .select('*')
    .eq('animal_type', animalType)
    .order('created_at', { ascending: false });

export const insertLivestockRegistry = (row) =>
  supabase.from('vg_livestock_registry').insert(row).select().single();

export const updateLivestockRegistry = (id, patch) =>
  supabase.from('vg_livestock_registry').update(patch).eq('id', id).select().single();

export const deleteLivestockRegistry = (id) =>
  supabase.from('vg_livestock_registry').delete().eq('id', id);

// ─── Products ─────────────────────────────────────────────────────────────────

export const fetchProducts = (category) => {
  let q = supabase.from('vg_products').select('*').eq('active', true);
  if (category) q = q.eq('category', category);
  return q.order('created_at');
};

export const fetchAllProducts = () =>
  supabase.from('vg_products').select('*').eq('active', true).order('name');

export const insertProduct = (row) =>
  supabase.from('vg_products').insert(row).select().single();

export const updateProduct = (id, patch) =>
  supabase.from('vg_products').update(patch).eq('id', id).select().single();

export const deleteProduct = (id) =>
  supabase.from('vg_products').update({ active: false }).eq('id', id);

// ─── Product Costs ────────────────────────────────────────────────────────────

export const fetchProductCosts = (productId) =>
  supabase.from('vg_product_costs').select('*').eq('product_id', productId);

export const fetchAllProductCosts = () =>
  supabase.from('vg_product_costs').select('*');

export const replaceProductCosts = async (productId, components) => {
  await supabase.from('vg_product_costs').delete().eq('product_id', productId);
  if (!components.length) return;
  return supabase.from('vg_product_costs').insert(
    components.map(c => ({ ...c, product_id: productId }))
  );
};

// ─── Sales ────────────────────────────────────────────────────────────────────

export const fetchSales = ({ category, year, month } = {}) => {
  let q = supabase.from('vg_sales')
    .select('*, vg_products(name, category, pricing_type)')
    .order('date', { ascending: false });
  if (year && month) {
    const from = `${year}-${String(month).padStart(2,'0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const to = `${year}-${String(month).padStart(2,'0')}-${String(lastDay).padStart(2,'0')}`;
    q = q.gte('date', from).lte('date', to);
  }
  return q;
};

export const fetchSalesForChart = (category) =>
  supabase.from('vg_sales')
    .select('date, units, sell_price_actual, delivery_cost, product_id, vg_products!inner(category)')
    .eq('vg_products.category', category)
    .order('date');

export const insertSale = (row) =>
  supabase.from('vg_sales').insert(row).select().single();

export const deleteSale = (id) =>
  supabase.from('vg_sales').delete().eq('id', id);

export const insertSaleOrder = (row) =>
  supabase.from("vg_sale_orders").insert(row).select().single();

export const insertSalesBulk = (rows) =>
  supabase.from("vg_sales").insert(rows).select();

export const fetchSaleOrders = ({ year, month } = {}) => {
  let q = supabase.from("vg_sale_orders")
    .select("*, vg_sales(*, vg_products(name, category, pricing_type))")
    .order("date", { ascending: false });
  if (year && month) {
    const from = `${year}-${String(month).padStart(2,"0")}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const to = `${year}-${String(month).padStart(2,"0")}-${String(lastDay).padStart(2,"0")}`;
    q = q.gte("date", from).lte("date", to);
  }
  return q;
};

// ─── Expenses ─────────────────────────────────────────────────────────────────

export const fetchExpenses = ({ category, year, month } = {}) => {
  let q = supabase.from('vg_expenses')
    .select('*')
    .order('date', { ascending: false });
  if (category) q = q.eq('category', category);
  if (year && month) {
    const from = `${year}-${String(month).padStart(2,'0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const to = `${year}-${String(month).padStart(2,'0')}-${String(lastDay).padStart(2,'0')}`;
    q = q.gte('date', from).lte('date', to);
  }
  return q;
};

export const insertExpense = (row) =>
  supabase.from('vg_expenses').insert(row).select().single();

export const deleteExpense = (id) =>
  supabase.from('vg_expenses').delete().eq('id', id);

// ─── Units ────────────────────────────────────────────────────────────────────

export const fetchUnits = () =>
  supabase.from('vg_units').select('*').eq('active', true).order('name');

export const insertUnit = (row) =>
  supabase.from('vg_units').insert(row).select().single();

export const updateUnit = (id, patch) =>
  supabase.from('vg_units').update(patch).eq('id', id).select().single();

// ─── Bookings ─────────────────────────────────────────────────────────────────

export const fetchBookings = ({ year, month } = {}) => {
  let q = supabase.from('vg_bookings')
    .select('*, vg_units(name)')
    .order('check_in', { ascending: false });
  if (year && month) {
    // Show bookings that START in this month
    const from = `${year}-${String(month).padStart(2,'0')}-01`;
    const nextM = month + 1 > 12 ? 1 : month + 1;
    const nextY = month + 1 > 12 ? year + 1 : year;
    const to = `${nextY}-${String(nextM).padStart(2,'0')}-01`;
    q = q.gte('check_in', from).lt('check_in', to);
  }
  return q;
};

export const fetchBookingsForYear = (year) =>
  supabase.from('vg_bookings')
    .select('*, vg_units(name)')
    .gte('check_in', `${year}-01-01`)
    .lte('check_in', `${year}-12-31`)
    .order('check_in');

export const insertBooking = async (row) => {
  const result = await supabase.from('vg_bookings').insert(row).select().single();
  if (result.data) {
    // Auto-sync: recalculate monthly total for the check_in month and upsert into history
    try {
      const checkIn = new Date(row.check_in);
      const calMonth = checkIn.getMonth() + 1; // 1-12
      const calYear = checkIn.getFullYear();
      // Determine financial year (Mar-Feb)
      const fyStart = calMonth >= 3 ? calYear : calYear - 1;
      const financialYear = `${fyStart}-${fyStart + 1}`;
      // Sum all bookings for this calendar month
      const from = `${calYear}-${String(calMonth).padStart(2,'0')}-01`;
      const nextM = calMonth + 1 > 12 ? 1 : calMonth + 1;
      const nextY = calMonth + 1 > 12 ? calYear + 1 : calYear;
      const to = `${nextY}-${String(nextM).padStart(2,'0')}-01`;
      const { data: monthBookings } = await supabase
        .from('vg_bookings')
        .select('total')
        .gte('check_in', from)
        .lt('check_in', to);
      const monthTotal = (monthBookings || []).reduce((t, b) => t + (b.total || 0), 0);
      await supabase.from('vg_accomm_sales_history')
        .upsert({ financial_year: financialYear, month: calMonth, revenue: monthTotal }, { onConflict: 'financial_year,month' });
    } catch (e) { console.warn('History sync failed:', e); }
  }
  return result;
};

export const updateBooking = (id, patch) =>
  supabase.from('vg_bookings').update(patch).eq('id', id).select().single();

export const deleteBooking = (id) =>
  supabase.from('vg_bookings').delete().eq('id', id);

// Sync a calendar month's booking total into vg_accomm_sales_history
export const syncAccommHistory = async (checkInDateStr) => {
  const checkIn = new Date(checkInDateStr);
  const calMonth = checkIn.getMonth() + 1;
  const calYear = checkIn.getFullYear();
  const fyStart = calMonth >= 3 ? calYear : calYear - 1;
  const financialYear = `${fyStart}-${fyStart + 1}`;
  const from = `${calYear}-${String(calMonth).padStart(2,'0')}-01`;
  const nextM = calMonth + 1 > 12 ? 1 : calMonth + 1;
  const nextY = calMonth + 1 > 12 ? calYear + 1 : calYear;
  const to = `${nextY}-${String(nextM).padStart(2,'0')}-01`;
  const { data: monthBookings } = await supabase
    .from('vg_bookings').select('total')
    .gte('check_in', from).lt('check_in', to);
  const monthTotal = (monthBookings || []).reduce((t, b) => t + (b.total || 0), 0);
  return supabase.from('vg_accomm_sales_history')
    .upsert({ financial_year: financialYear, month: calMonth, revenue: monthTotal }, { onConflict: 'financial_year,month' });
};

// ─── Unit Costs ───────────────────────────────────────────────────────────────

export const fetchUnitCosts = ({ unitId, year, month } = {}) => {
  let q = supabase.from('vg_unit_costs').select('*, vg_units(name)').order('date', { ascending: false });
  if (unitId) q = q.eq('unit_id', unitId);
  if (year && month) {
    const from = `${year}-${String(month).padStart(2,'0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const to = `${year}-${String(month).padStart(2,'0')}-${String(lastDay).padStart(2,'0')}`;
    q = q.gte('date', from).lte('date', to);
  }
  return q;
};

export const insertUnitCost = (row) =>
  supabase.from('vg_unit_costs').insert(row).select().single();

export const deleteUnitCost = (id) =>
  supabase.from('vg_unit_costs').delete().eq('id', id);

// ─── Staff ────────────────────────────────────────────────────────────────────

export const fetchStaff = () =>
  supabase.from('vg_staff').select('*').eq('active', true).order('name');

export const fetchAllStaff = () =>
  supabase.from('vg_staff').select('*').order('name');

export const insertStaff = (row) =>
  supabase.from('vg_staff').insert(row).select().single();

export const updateStaff = (id, patch) =>
  supabase.from('vg_staff').update(patch).eq('id', id).select().single();

// ─── Staff Logs ───────────────────────────────────────────────────────────────

export const fetchStaffLogs = (year, month) =>
  supabase.from('vg_staff_logs')
    .select('*, vg_staff(name, daily_rate)')
    .eq('year', year)
    .eq('month', month);

export const fetchStaffLogsForYear = (year) =>
  supabase.from('vg_staff_logs')
    .select('*, vg_staff(name, daily_rate)')
    .eq('year', year)
    .order('month');

export const upsertStaffLog = (row) =>
  supabase.from('vg_staff_logs')
    .upsert(row, { onConflict: 'staff_id,year,month' })
    .select()
    .single();
