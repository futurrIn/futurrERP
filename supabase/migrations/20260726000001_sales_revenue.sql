-- =====================================================================================
-- FUTURR ERP - SALES & REVENUE MIGRATION
-- =====================================================================================

-- 1. Create customers table
CREATE TABLE IF NOT EXISTS customers (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "company" TEXT,
  "phone" TEXT,
  "email" TEXT,
  "gst" TEXT,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create sales table
CREATE TABLE IF NOT EXISTS sales (
  "id" BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "customer_id" UUID REFERENCES customers(id) ON DELETE CASCADE,
  "category" TEXT NOT NULL, -- Internship, Website, etc.
  "service_product" TEXT,
  "project_name" TEXT,
  "assigned_to" UUID REFERENCES profiles(id),
  "description" TEXT,
  "amount" FLOAT8 DEFAULT 0,
  "discount" FLOAT8 DEFAULT 0,
  "tax" FLOAT8 DEFAULT 0,
  "final_amount" FLOAT8 DEFAULT 0,
  "status" TEXT DEFAULT 'Pending', -- Pending, Partially Paid, Paid
  "dynamic_fields" JSONB DEFAULT '{}'::jsonb,
  "created_by" UUID REFERENCES auth.users(id),
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create payments table
CREATE TABLE IF NOT EXISTS payments (
  "id" BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "sale_id" BIGINT NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  "amount" FLOAT8 NOT NULL,
  "payment_method" TEXT, -- UPI, Cash, Bank Transfer, Razorpay, Card, Other
  "status" TEXT DEFAULT 'Completed', -- Pending, Completed, Failed
  "transaction_id" TEXT,
  "receipt_number" TEXT UNIQUE,
  "created_by" UUID REFERENCES auth.users(id),
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Enable Row Level Security
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for customers
-- Admins and Accountants can manage all customers
CREATE POLICY "Admin/Accountant manage customers" ON customers FOR ALL USING (
  get_my_role() IN ('Admin', 'Accountant')
);
-- Managers and Employees can view customers
CREATE POLICY "Others view customers" ON customers FOR SELECT USING (
  get_my_role() IN ('Manager', 'Employee')
);

-- 6. RLS Policies for sales
-- Admins can manage all sales
CREATE POLICY "Admin manage sales" ON sales FOR ALL USING (
  get_my_role() = 'Admin'
);
-- Accountants can manage all sales
CREATE POLICY "Accountant manage sales" ON sales FOR ALL USING (
  get_my_role() = 'Accountant'
);
-- Managers can view all team sales and create sales
CREATE POLICY "Manager view/create sales" ON sales FOR SELECT USING (
  get_my_role() = 'Manager'
);
CREATE POLICY "Manager create sales" ON sales FOR INSERT WITH CHECK (
  get_my_role() = 'Manager'
);
-- Employees can view assigned sales
CREATE POLICY "Employee view assigned sales" ON sales FOR SELECT USING (
  assigned_to = auth.uid() OR created_by = auth.uid()
);

-- 7. RLS Policies for payments
-- Admins and Accountants can manage all payments
CREATE POLICY "Admin/Accountant manage payments" ON payments FOR ALL USING (
  get_my_role() IN ('Admin', 'Accountant')
);
-- Managers can view payments
CREATE POLICY "Manager view payments" ON payments FOR SELECT USING (
  get_my_role() = 'Manager'
);
-- Employees can view payments for assigned sales
CREATE POLICY "Employee view assigned payments" ON payments FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM sales 
    WHERE sales.id = payments.sale_id 
    AND (sales.assigned_to = auth.uid() OR sales.created_by = auth.uid())
  )
);
