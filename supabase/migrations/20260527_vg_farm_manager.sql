-- ============================================================
-- VrischGewagt Farm Manager — Database Migration
-- Run this in the Supabase SQL Editor for project: toxgvaqctxbqhqitmxkm
-- ============================================================

-- 1. Add color column to members for project colour-coding
ALTER TABLE members ADD COLUMN IF NOT EXISTS color text;

-- ============================================================
-- 2. ANIMAL MANAGEMENT
-- ============================================================

-- Monthly livestock summary per animal type/category
CREATE TABLE IF NOT EXISTS vg_livestock_monthly (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  year int NOT NULL,
  month int NOT NULL CHECK (month BETWEEN 1 AND 12),
  animal_type text NOT NULL,        -- 'sheep', 'cattle'
  category text NOT NULL,           -- 'ram', 'ewe', 'lamb', 'bull', 'cow', 'calf'
  opening_count int NOT NULL DEFAULT 0,
  births int NOT NULL DEFAULT 0,
  deaths int NOT NULL DEFAULT 0,
  slaughtered int NOT NULL DEFAULT 0,
  sold int NOT NULL DEFAULT 0,
  purchased int NOT NULL DEFAULT 0,
  closing_count int GENERATED ALWAYS AS (opening_count + births + purchased - deaths - slaughtered - sold) STORED,
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(year, month, animal_type, category)
);

-- Individual animal registry
CREATE TABLE IF NOT EXISTS vg_livestock_registry (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  animal_type text NOT NULL,        -- 'sheep', 'cattle'
  category text NOT NULL,           -- 'ram', 'ewe', 'bull', 'cow'
  tag_id text,                       -- ear tag / ID number
  name text,
  birth_date date,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'sold', 'deceased', 'slaughtered')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 3. PRODUCE / PRODUCTS
-- ============================================================

-- Farm product catalogue
CREATE TABLE IF NOT EXISTS vg_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,               -- 'Extra Virgin 5L', 'Table Olives 1kg'
  category text NOT NULL,           -- 'olive_oil', 'olives', 'meat', 'other'
  unit text NOT NULL DEFAULT 'each',
  default_sell_price numeric NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Cost components per product (COGS breakdown)
CREATE TABLE IF NOT EXISTS vg_product_costs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES vg_products(id) ON DELETE CASCADE,
  name text NOT NULL,               -- 'Raw Material', 'Packaging', 'Labour'
  amount numeric NOT NULL DEFAULT 0,
  cost_type text NOT NULL DEFAULT 'fixed',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Sales log
CREATE TABLE IF NOT EXISTS vg_sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  product_id uuid NOT NULL REFERENCES vg_products(id),
  units numeric NOT NULL DEFAULT 1,
  sell_price_actual numeric NOT NULL,
  delivery_cost numeric NOT NULL DEFAULT 0,
  channel text,                      -- 'direct', 'market', 'wholesale'
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- General expenses (farm-wide, categorised)
CREATE TABLE IF NOT EXISTS vg_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  category text NOT NULL,           -- 'olive_oil', 'olives', 'meat', 'accommodation', 'staff', 'general'
  description text,
  amount numeric NOT NULL DEFAULT 0,
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 4. ACCOMMODATION
-- ============================================================

-- Units (cottages, suites)
CREATE TABLE IF NOT EXISTS vg_units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  default_rate numeric NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Bookings
CREATE TABLE IF NOT EXISTS vg_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid NOT NULL REFERENCES vg_units(id),
  guest_name text NOT NULL,
  check_in date NOT NULL,
  check_out date NOT NULL,
  nights int GENERATED ALWAYS AS (check_out - check_in) STORED,
  rate_per_night numeric NOT NULL,
  total numeric GENERATED ALWAYS AS ((check_out - check_in) * rate_per_night) STORED,
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Accommodation maintenance costs
CREATE TABLE IF NOT EXISTS vg_unit_costs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid NOT NULL REFERENCES vg_units(id),
  date date NOT NULL,
  description text,
  amount numeric NOT NULL DEFAULT 0,
  category text NOT NULL DEFAULT 'maintenance',
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 5. STAFF
-- ============================================================

-- Staff members
CREATE TABLE IF NOT EXISTS vg_staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  role text,                         -- 'housekeeper', 'farm hand', 'gardener'
  daily_rate numeric NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Monthly work logs per staff
CREATE TABLE IF NOT EXISTS vg_staff_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid NOT NULL REFERENCES vg_staff(id),
  year int NOT NULL,
  month int NOT NULL CHECK (month BETWEEN 1 AND 12),
  days_worked numeric NOT NULL DEFAULT 0,
  bonus numeric NOT NULL DEFAULT 0,
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(staff_id, year, month)
);

-- ============================================================
-- 6. RLS Policies — allow authenticated users full access
-- ============================================================

-- Enable RLS on all new tables
ALTER TABLE vg_livestock_monthly ENABLE ROW LEVEL SECURITY;
ALTER TABLE vg_livestock_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE vg_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE vg_product_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE vg_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE vg_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE vg_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE vg_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE vg_unit_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE vg_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE vg_staff_logs ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read everything
CREATE POLICY "Authenticated read" ON vg_livestock_monthly FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read" ON vg_livestock_registry FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read" ON vg_products FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read" ON vg_product_costs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read" ON vg_sales FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read" ON vg_expenses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read" ON vg_units FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read" ON vg_bookings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read" ON vg_unit_costs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read" ON vg_staff FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read" ON vg_staff_logs FOR SELECT TO authenticated USING (true);

-- All authenticated users can insert
CREATE POLICY "Authenticated insert" ON vg_livestock_monthly FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated insert" ON vg_livestock_registry FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated insert" ON vg_products FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated insert" ON vg_product_costs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated insert" ON vg_sales FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated insert" ON vg_expenses FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated insert" ON vg_units FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated insert" ON vg_bookings FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated insert" ON vg_unit_costs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated insert" ON vg_staff FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated insert" ON vg_staff_logs FOR INSERT TO authenticated WITH CHECK (true);

-- All authenticated users can update
CREATE POLICY "Authenticated update" ON vg_livestock_monthly FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated update" ON vg_livestock_registry FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated update" ON vg_products FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated update" ON vg_product_costs FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated update" ON vg_sales FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated update" ON vg_expenses FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated update" ON vg_units FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated update" ON vg_bookings FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated update" ON vg_unit_costs FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated update" ON vg_staff FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated update" ON vg_staff_logs FOR UPDATE TO authenticated USING (true);

-- All authenticated users can delete
CREATE POLICY "Authenticated delete" ON vg_livestock_monthly FOR DELETE TO authenticated USING (true);
CREATE POLICY "Authenticated delete" ON vg_livestock_registry FOR DELETE TO authenticated USING (true);
CREATE POLICY "Authenticated delete" ON vg_products FOR DELETE TO authenticated USING (true);
CREATE POLICY "Authenticated delete" ON vg_product_costs FOR DELETE TO authenticated USING (true);
CREATE POLICY "Authenticated delete" ON vg_sales FOR DELETE TO authenticated USING (true);
CREATE POLICY "Authenticated delete" ON vg_expenses FOR DELETE TO authenticated USING (true);
CREATE POLICY "Authenticated delete" ON vg_units FOR DELETE TO authenticated USING (true);
CREATE POLICY "Authenticated delete" ON vg_bookings FOR DELETE TO authenticated USING (true);
CREATE POLICY "Authenticated delete" ON vg_unit_costs FOR DELETE TO authenticated USING (true);
CREATE POLICY "Authenticated delete" ON vg_staff FOR DELETE TO authenticated USING (true);
CREATE POLICY "Authenticated delete" ON vg_staff_logs FOR DELETE TO authenticated USING (true);

-- Service role bypasses RLS, so Chris (agent) can always write via service key
