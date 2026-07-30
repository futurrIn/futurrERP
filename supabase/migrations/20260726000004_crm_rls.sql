-- =====================================================================================
-- FUTURR ERP - CRM RLS POLICIES MIGRATION
-- =====================================================================================

-- 1. Enable RLS on CRM tables (assuming they exist)
ALTER TABLE IF EXISTS leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS sales_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS sales_followups ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies if any (to avoid conflicts)
DROP POLICY IF EXISTS "Admin/Manager manage all leads" ON leads;
DROP POLICY IF EXISTS "Employees manage own leads" ON leads;
DROP POLICY IF EXISTS "Admin/Manager manage all sales_activities" ON sales_activities;
DROP POLICY IF EXISTS "Employees manage own sales_activities" ON sales_activities;
DROP POLICY IF EXISTS "Admin/Manager manage all sales_followups" ON sales_followups;
DROP POLICY IF EXISTS "Employees manage own sales_followups" ON sales_followups;

-- 3. RLS Policies for leads
-- Admins and Managers can manage all leads
CREATE POLICY "Admin/Manager manage all leads" ON leads FOR ALL USING (
  get_my_role() IN ('Admin', 'Manager')
);

-- Employees can manage their own leads
CREATE POLICY "Employees manage own leads" ON leads FOR ALL USING (
  created_by = auth.uid() OR assigned_to = auth.uid()
) WITH CHECK (
  created_by = auth.uid() OR assigned_to = auth.uid()
);

-- 4. RLS Policies for sales_activities
CREATE POLICY "Admin/Manager manage all sales_activities" ON sales_activities FOR ALL USING (
  get_my_role() IN ('Admin', 'Manager')
);

CREATE POLICY "Employees manage own sales_activities" ON sales_activities FOR ALL USING (
  created_by = auth.uid()
) WITH CHECK (
  created_by = auth.uid()
);

-- 5. RLS Policies for sales_followups
CREATE POLICY "Admin/Manager manage all sales_followups" ON sales_followups FOR ALL USING (
  get_my_role() IN ('Admin', 'Manager')
);

CREATE POLICY "Employees manage own sales_followups" ON sales_followups FOR ALL USING (
  created_by = auth.uid()
) WITH CHECK (
  created_by = auth.uid()
);
