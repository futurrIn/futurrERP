-- =====================================================================================
-- FUTURR RECEIPT BUILDER - CONSOLIDATED INITIAL SCHEMA
-- Version: 1.0 (Squashed Migration)
-- Description: This single migration creates the tables, functions, and RLS policies
-- required for the complete production application.
-- =====================================================================================

-- SAFETY: Do NOT drop tables in production. This schema uses IF NOT EXISTS
-- so it is safe to run against a live database without data loss.
-- DROP TABLE IF EXISTS expenses CASCADE;
-- DROP TABLE IF EXISTS receipts CASCADE;
-- DROP TABLE IF EXISTS settings CASCADE;
-- DROP TABLE IF EXISTS profiles CASCADE;

-- -------------------------------------------------------------------------------------
-- 2. TABLES DEFINITION
-- -------------------------------------------------------------------------------------

-- A. Profiles Table (Linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS profiles (
  "id" UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  "email" TEXT,
  "fullName" TEXT,
  "phone" TEXT,
  "role" TEXT NOT NULL, -- 'Admin', 'Manager', 'Accountant', 'Employee'
  "department" TEXT,
  "jobPosition" TEXT,
  "is_active" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- B. Settings Table (Global Company Config)
CREATE TABLE IF NOT EXISTS settings (
  "id" BIGINT PRIMARY KEY DEFAULT 1,
  "companyName" TEXT DEFAULT 'Futurr',
  "companyAddress" TEXT DEFAULT '',
  "supportEmail" TEXT DEFAULT 'support@futurr.in',
  "websiteUrl" TEXT DEFAULT 'https://futurr.in',
  "gst" TEXT DEFAULT '',
  "password" TEXT DEFAULT 'admin123',
  "primaryColor" TEXT DEFAULT '#4f46e5',
  "secondaryColor" TEXT DEFAULT '#9333ea',
  "logo" TEXT DEFAULT '',
  "signature" TEXT DEFAULT '',
  "categories" TEXT[] DEFAULT ARRAY['Internship', 'Online Course', 'Workshop', 'Certification', 'Training Program'],
  "departments" JSONB DEFAULT '["Finance", "Sales", "Academics", "HR", "Technical"]'::jsonb,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- C. Receipts Table (Revenue Tracking)
CREATE TABLE IF NOT EXISTS receipts (
  "id" BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "receiptNumber" TEXT NOT NULL UNIQUE,
  "studentName" TEXT NOT NULL,
  "email" TEXT,
  "phone" TEXT,
  "college" TEXT,
  "courseName" TEXT NOT NULL,
  "category" TEXT,
  "amount" FLOAT8 NOT NULL,
  "paymentMethod" TEXT,
  "transactionId" TEXT,
  "duration" TEXT,
  "batchName" TEXT,
  "includeSignature" BOOLEAN DEFAULT true,
  "createdBy" UUID REFERENCES auth.users,
  "date" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- D. Expenses Table (Reimbursements and Claims)
CREATE TABLE IF NOT EXISTS expenses (
  "id" BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "date" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "trips" JSONB DEFAULT '[]'::jsonb, 
  "foodType" TEXT[], 
  "foodAmount" FLOAT8 DEFAULT 0,
  "accommodationAmount" FLOAT8 DEFAULT 0,
  "accommodationDays" INTEGER DEFAULT 0,
  "purchaseVendor" TEXT,
  "purchaseItem" TEXT,
  "purchaseAmount" FLOAT8 DEFAULT 0,
  "purchases" JSONB DEFAULT '[]'::jsonb,
  "totalAmount" FLOAT8 DEFAULT 0,
  "billUrl" TEXT,
  "status" TEXT DEFAULT 'Pending', 
  "employeeName" TEXT,
  "employeeEmail" TEXT,
  "employeeJobPosition" TEXT,
  "employeeDepartment" TEXT,
  "createdBy" UUID REFERENCES auth.users,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- -------------------------------------------------------------------------------------
-- 3. HELPER FUNCTIONS (To prevent infinite RLS recursion)
-- -------------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_my_department()
RETURNS TEXT AS $$
  SELECT department FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- -------------------------------------------------------------------------------------
-- 4. INITIALIZE DATA
-- -------------------------------------------------------------------------------------
INSERT INTO settings ("id") VALUES (1) ON CONFLICT ("id") DO NOTHING;

-- -------------------------------------------------------------------------------------
-- 5. ENABLE ROW LEVEL SECURITY
-- -------------------------------------------------------------------------------------
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- -------------------------------------------------------------------------------------
-- 6. RLS POLICIES
-- -------------------------------------------------------------------------------------

-- A. Profiles Policies
CREATE POLICY "Self access" ON profiles FOR ALL USING (auth.uid() = id);

CREATE POLICY "Allow public insert on signup" ON profiles FOR INSERT WITH CHECK (true);

CREATE POLICY "Admin view all profiles" ON profiles FOR SELECT USING (
  get_my_role() = 'Admin'
);

CREATE POLICY "Accountant view all profiles" ON profiles FOR SELECT USING (
  get_my_role() = 'Accountant'
);

CREATE POLICY "Manager view team profiles" ON profiles FOR SELECT USING (
  get_my_role() = 'Manager' AND 
  department = get_my_department()
);

CREATE POLICY "Admin update profiles" ON profiles FOR UPDATE USING (
  get_my_role() = 'Admin'
);

-- B. Settings Policies
CREATE POLICY "Public read settings" ON settings FOR SELECT USING (true);

CREATE POLICY "Admin manage settings" ON settings FOR ALL USING (
  get_my_role() = 'Admin'
);

-- C. Receipts Policies
CREATE POLICY "Receipt access" ON receipts FOR ALL USING (
  auth.uid() = "createdBy" OR 
  get_my_role() IN ('Admin', 'Manager', 'Accountant')
) WITH CHECK (
  auth.uid() = "createdBy" OR 
  get_my_role() IN ('Admin', 'Manager', 'Accountant')
);

-- D. Expenses Policies
CREATE POLICY "Manage expenses" ON expenses FOR ALL USING (
  auth.uid() = "createdBy" OR 
  get_my_role() IN ('Admin', 'Accountant') OR
  (
    get_my_role() = 'Manager' AND 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = expenses."createdBy" 
      AND profiles.department = get_my_department()
    )
  )
) WITH CHECK (
  auth.uid() = "createdBy" OR 
  get_my_role() IN ('Admin', 'Accountant') OR
  (
    get_my_role() = 'Manager' AND 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = expenses."createdBy" 
      AND profiles.department = get_my_department()
    )
  )
);

-- -------------------------------------------------------------------------------------
-- 7. SIGNUP DATABASE TRIGGER (Auto-create profiles server-side)
-- -------------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, "fullName", phone, role, department, "jobPosition")
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'fullName', ''),
    COALESCE(new.raw_user_meta_data->>'phone', ''),
    COALESCE(new.raw_user_meta_data->>'role', 'Employee'),
    new.raw_user_meta_data->>'department',
    new.raw_user_meta_data->>'jobPosition'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
