-- =====================================================================================
-- FUTURR ERP - LIABILITIES MIGRATION
-- =====================================================================================

-- 1. Create liabilities table
CREATE TABLE IF NOT EXISTS liabilities (
  "id" BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "title" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "amount" FLOAT8 DEFAULT 0,
  "due_date" DATE NOT NULL,
  "status" TEXT DEFAULT 'Pending', -- Pending, Paid
  "notes" TEXT,
  "created_by" UUID REFERENCES auth.users(id),
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable Row Level Security
ALTER TABLE liabilities ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies for liabilities
-- Admins and Accountants can manage all liabilities
CREATE POLICY "Admin/Accountant manage liabilities" ON liabilities FOR ALL USING (
  get_my_role() IN ('Admin', 'Accountant')
);
-- Managers can view liabilities
CREATE POLICY "Manager view liabilities" ON liabilities FOR SELECT USING (
  get_my_role() = 'Manager'
);
