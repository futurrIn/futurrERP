-- =====================================================================================
-- FUTURR ERP - EMPLOYEE ADVANCES MIGRATION
-- =====================================================================================

-- 1. Create employee_advances table
CREATE TABLE IF NOT EXISTS employee_advances (
  "id" BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "employee_id" UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  "amount" FLOAT8 NOT NULL,
  "remaining_amount" FLOAT8 NOT NULL,
  "purpose" TEXT NOT NULL,
  "project_id" TEXT,
  "payment_method" TEXT,
  "transaction_id" TEXT,
  "transfer_date" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "notes" TEXT,
  "status" TEXT DEFAULT 'Transferred', -- Transferred, Partially Settled, Settled, Cancelled
  "created_by" UUID REFERENCES auth.users(id),
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create advance_transactions table (ledger)
CREATE TABLE IF NOT EXISTS advance_transactions (
  "id" BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "advance_id" BIGINT NOT NULL REFERENCES employee_advances(id) ON DELETE CASCADE,
  "type" TEXT NOT NULL, -- Transfer, Expense, Return
  "amount" FLOAT8 NOT NULL,
  "reference_id" TEXT, -- could be expense id or return txn id
  "remarks" TEXT,
  "created_by" UUID REFERENCES auth.users(id),
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Modify expenses table to include advance linking
ALTER TABLE expenses 
ADD COLUMN IF NOT EXISTS "advance_id" BIGINT REFERENCES employee_advances(id);

-- 4. Enable Row Level Security
ALTER TABLE employee_advances ENABLE ROW LEVEL SECURITY;
ALTER TABLE advance_transactions ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for employee_advances

-- Admins and Accountants can do anything
CREATE POLICY "Admin/Accountant manage advances" ON employee_advances FOR ALL USING (
  get_my_role() IN ('Admin', 'Accountant')
);

-- Employees can only view their own advances
CREATE POLICY "Employee view own advances" ON employee_advances FOR SELECT USING (
  auth.uid() = employee_id OR get_my_role() IN ('Admin', 'Accountant')
);

-- 6. RLS Policies for advance_transactions

-- Admins and Accountants can manage transactions
CREATE POLICY "Admin/Accountant manage advance txns" ON advance_transactions FOR ALL USING (
  get_my_role() IN ('Admin', 'Accountant')
);

-- Employees can view transactions linked to their own advances
CREATE POLICY "Employee view own advance txns" ON advance_transactions FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM employee_advances 
    WHERE employee_advances.id = advance_transactions.advance_id 
    AND employee_advances.employee_id = auth.uid()
  ) OR get_my_role() IN ('Admin', 'Accountant')
);
