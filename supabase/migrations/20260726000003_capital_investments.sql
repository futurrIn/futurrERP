-- =====================================================================================
-- FUTURR ERP - CAPITAL & BORROWINGS MIGRATION
-- =====================================================================================

-- 1. Create investors table
CREATE TABLE IF NOT EXISTS investors (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "type" TEXT NOT NULL, -- Investor, Lender, Borrower
  "company" TEXT,
  "phone" TEXT,
  "email" TEXT,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create capital_transactions table
CREATE TABLE IF NOT EXISTS capital_transactions (
  "id" BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "investor_id" UUID REFERENCES investors(id) ON DELETE CASCADE,
  "type" TEXT NOT NULL, -- Equity, Loan, etc.
  "amount" FLOAT8 NOT NULL,
  "payment_method" TEXT,
  "transaction_id" TEXT,
  "receipt_number" TEXT UNIQUE,
  "notes" TEXT,
  "created_by" UUID REFERENCES auth.users(id),
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Enable Row Level Security
ALTER TABLE investors ENABLE ROW LEVEL SECURITY;
ALTER TABLE capital_transactions ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for investors
-- Admins and Accountants can manage all investors
CREATE POLICY "Admin/Accountant manage investors" ON investors FOR ALL USING (
  get_my_role() IN ('Admin', 'Accountant')
);
-- Managers can view investors
CREATE POLICY "Others view investors" ON investors FOR SELECT USING (
  get_my_role() IN ('Manager', 'Employee')
);

-- 5. RLS Policies for capital_transactions
-- Admins and Accountants can manage all capital transactions
CREATE POLICY "Admin/Accountant manage capital_transactions" ON capital_transactions FOR ALL USING (
  get_my_role() IN ('Admin', 'Accountant')
);
-- Managers can view capital transactions
CREATE POLICY "Manager view capital_transactions" ON capital_transactions FOR SELECT USING (
  get_my_role() = 'Manager'
);
