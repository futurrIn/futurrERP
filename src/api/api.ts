import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Anon Key is missing. Check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const api = {
  // --- Auth ---
  signIn: async ({ email, password }: any) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  signUp: async ({ email, password, fullName, phone, role, department, jobPosition }: any) => {
    const { data: authData, error: authError } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        data: { fullName, phone, role, department, jobPosition }
      }
    });
    
    if (authError) throw authError;
    return authData;
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  getProfile: async () => {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      await supabase.auth.signOut();
      return null;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();
    
    if (error) throw error;
    
    if (!data) {
      // The database was wiped, but the auth session remains in local storage.
      // Force sign out so the user can register again.
      await supabase.auth.signOut();
      window.location.reload();
      return null;
    }
    
    return data;
  },

  // --- Settings ---
  getSettings: async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('id', 1)
        .single();
      
      if (error) throw error;
      return data;
    } catch (err) {
      return {
        id: 1,
        companyName: 'Futurr',
        primaryColor: '#4f46e5',
        secondaryColor: '#9333ea',
        monthlyBudget: 500000,
        categories: ['Internship', 'Online Course', 'Workshop', 'Certification', 'Training Program'],
        departments: ['Finance', 'Sales', 'Academics', 'HR', 'Technical'],
        crm_lead_sources: ['Website', 'Referral', 'Cold Call', 'Social Media', 'Other'],
        crm_services: ['Consulting', 'Software Development', 'Marketing', 'Support'],
        crm_pipeline_stages: ['New', 'Contacted', 'Proposal Sent', 'Converted', 'Lost'],
        finance_payment_methods: ['Cash', 'Bank Transfer', 'Credit Card', 'UPI'],
        default_tax_rate: 0
      };
    }
  },

  updateSettings: async (settings: any) => {
    const { id, ...updates } = settings;
    const { data, error } = await supabase
      .from('settings')
      .upsert({ id: 1, ...updates })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // --- User Management (Admins Only) ---
  getAllUsers: async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('role', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  updateUserStatus: async (userId: string, is_active: boolean) => {
    const { data, error } = await supabase
      .from('profiles')
      .update({ is_active })
      .eq('id', userId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  updateUserRoleAndDept: async (userId: string, role: string, department: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .update({ role, department })
      .eq('id', userId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // --- Receipts (Admins) ---
  getReceipts: async () => {
    const { data: receipts, error } = await supabase
      .from('receipts')
      .select('*')
      .order('createdAt', { ascending: false });
    
    if (error) throw error;
    
    const { data: profiles, error: profError } = await supabase
      .from('profiles')
      .select('id, fullName, role');
      
    if (!profError && profiles) {
      return receipts.map(r => {
        const creator = profiles.find(p => p.id === r.createdBy);
        return { 
          ...r, 
          creatorName: creator?.fullName || 'Unknown', 
          creatorRole: creator?.role || 'Unknown' 
        };
      });
    }

    return receipts || [];
  },

  createReceipt: async (receipt: any) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { id, ...data } = receipt;
    const { data: newReceipt, error } = await supabase
      .from('receipts')
      .insert([{ ...data, createdBy: user?.id }])
      .select()
      .single();
    
    if (error) throw error;
    return newReceipt;
  },

  // --- Expenses (Employees) ---
  getExpenses: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('createdBy', user?.id)
      .order('date', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  createExpense: async (expense: any) => {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('fullName, email, jobPosition, department')
      .eq('id', user?.id)
      .single();

    const payload = { 
      ...expense, 
      createdBy: user?.id,
      employeeName: profile?.fullName,
      employeeEmail: profile?.email,
      employeeJobPosition: profile?.jobPosition,
      employeeDepartment: profile?.department
    };

    const { data, error } = await supabase
      .from('expenses')
      .insert([payload])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  updateExpense: async (id: number, expense: any) => {
    const { id: _, ...data } = expense;
    const { data: updatedExpense, error } = await supabase
      .from('expenses')
      .update(data)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return updatedExpense;
  },

  getTeamExpenses: async () => {
    const { data: expenses, error: expError } = await supabase
      .from('expenses')
      .select('*')
      .order('createdAt', { ascending: false });
    
    if (expError) throw expError;

    const { data: profiles, error: profError } = await supabase
      .from('profiles')
      .select('id, fullName, department, role');
      
    if (profError) throw profError;

    const enrichedExpenses = expenses.map(exp => {
      const profile = profiles.find(p => p.id === exp.createdBy);
      return {
        ...exp,
        employee: profile || null
      };
    });

    return enrichedExpenses;
  },

  updateExpenseStatus: async (id: number, status: string) => {
    const { data, error } = await supabase
      .from('expenses')
      .update({ status })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;

    if (status === 'Approved' && data.advance_id) {
       await api.updateAdvanceRemaining(data.advance_id, data.totalAmount, id);
    }

    return data;
  },

  uploadBill: async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `bills/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('expense-attachments')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('expense-attachments')
      .getPublicUrl(filePath);

    return publicUrl;
  },

  updateReceipt: async (id: number, receipt: any) => {
    const { id: _, ...data } = receipt;
    const { data: updatedReceipt, error } = await supabase
      .from('receipts')
      .update(data)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return updatedReceipt;
  },

  deleteReceipt: async (id: number) => {
    const { error } = await supabase
      .from('receipts')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return { success: true };
  },

  // --- Employee Advances ---
  getAllAdvances: async () => {
    const { data: advances, error } = await supabase
      .from('employee_advances')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    // fetch profiles to attach employee details
    const { data: profiles } = await supabase.from('profiles').select('id, fullName, department');
    if (profiles) {
      return advances.map(adv => ({
        ...adv,
        employee: profiles.find(p => p.id === adv.employee_id) || null
      }));
    }
    return advances || [];
  },

  getMyAdvances: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('employee_advances')
      .select('*')
      .eq('employee_id', user?.id)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  createAdvance: async (advance: any) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('employee_advances')
      .insert([{ ...advance, created_by: user?.id }])
      .select()
      .single();
    
    if (error) throw error;

    await supabase.from('advance_transactions').insert([{
      advance_id: data.id,
      type: 'Transfer',
      amount: data.amount,
      remarks: 'Initial Transfer',
      created_by: user?.id
    }]);

    return data;
  },

  updateAdvanceRemaining: async (id: number, amountToSubtract: number, expenseId?: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data: current, error: getErr } = await supabase
      .from('employee_advances')
      .select('remaining_amount, amount')
      .eq('id', id)
      .single();
    if (getErr) throw getErr;

    const newRemaining = Math.max(0, current.remaining_amount - amountToSubtract);
    const newStatus = newRemaining === 0 ? 'Settled' : (newRemaining < current.amount ? 'Partially Settled' : 'Transferred');

    const { data, error } = await supabase
      .from('employee_advances')
      .update({ remaining_amount: newRemaining, status: newStatus })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;

    await supabase.from('advance_transactions').insert([{
      advance_id: id,
      type: 'Expense',
      amount: amountToSubtract,
      reference_id: expenseId?.toString(),
      remarks: 'Expense Approved',
      created_by: user?.id
    }]);

    return data;
  },

  recordAdvanceReturn: async (id: number, amountReturned: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data: current, error: getErr } = await supabase
      .from('employee_advances')
      .select('remaining_amount')
      .eq('id', id)
      .single();
    if (getErr) throw getErr;

    const newRemaining = Math.max(0, current.remaining_amount - amountReturned);
    const newStatus = newRemaining === 0 ? 'Settled' : 'Partially Settled';

    const { data, error } = await supabase
      .from('employee_advances')
      .update({ remaining_amount: newRemaining, status: newStatus })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;

    await supabase.from('advance_transactions').insert([{
      advance_id: id,
      type: 'Return',
      amount: amountReturned,
      remarks: 'Amount Returned',
      created_by: user?.id
    }]);

    return data;
  },

  closeAdvance: async (id: number) => {
    const { data, error } = await supabase
      .from('employee_advances')
      .update({ status: 'Settled', remaining_amount: 0 })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  deleteAdvance: async (id: number) => {
    // Delete associated transactions first to maintain referential integrity if foreign keys aren't cascaded
    await supabase.from('advance_transactions').delete().eq('advance_id', id);
    const { error } = await supabase.from('employee_advances').delete().eq('id', id);
    if (error) throw error;
    return { success: true };
  },

  // --- Customers ---
  getCustomers: async () => {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  createCustomer: async (customer: any) => {
    const { data, error } = await supabase
      .from('customers')
      .insert([customer])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  updateCustomer: async (id: number, customer: any) => {
    const { id: _, ...data } = customer;
    const { data: updated, error } = await supabase
      .from('customers')
      .update(data)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return updated;
  },

  // --- Sales ---
  getSales: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('sales')
      .select('*, customers(*)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  createSale: async (sale: any) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('sales')
      .insert([{ ...sale, created_by: user?.id }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  updateSale: async (id: number, sale: any) => {
    const { id: _, customers, created_at, created_by, ...data } = sale;
    const { data: updated, error } = await supabase
      .from('sales')
      .update(data)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return updated;
  },

  // --- Payments ---
  getPayments: async (saleId?: number) => {
    let query = supabase.from('payments').select('*').order('created_at', { ascending: false });
    if (saleId) {
      query = query.eq('sale_id', saleId);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  createPayment: async (payment: any) => {
    const { data: { user } } = await supabase.auth.getUser();
    
    // Create receipt number
    const receiptNum = `REC-${Date.now().toString().slice(-6)}`;

    const { data, error } = await supabase
      .from('payments')
      .insert([{ ...payment, created_by: user?.id, receipt_number: receiptNum }])
      .select()
      .single();
    
    if (error) throw error;

    // Update sale status logic
    const { data: sale } = await supabase.from('sales').select('final_amount').eq('id', payment.sale_id).single();
    if (sale) {
      const { data: allPayments } = await supabase.from('payments').select('amount').eq('sale_id', payment.sale_id);
      const totalPaid = (allPayments || []).reduce((sum, p) => sum + (p.amount || 0), 0);
      const status = totalPaid >= sale.final_amount ? 'Paid' : 'Partially Paid';
      await supabase.from('sales').update({ status }).eq('id', payment.sale_id);
    }

    return data;
  },

  updatePayment: async (id: number, payment: any) => {
    const { id: _, ...data } = payment;
    const { data: updatedPayment, error } = await supabase
      .from('payments')
      .update(data)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;

    const { data: sale } = await supabase.from('sales').select('final_amount').eq('id', updatedPayment.sale_id).single();
    if (sale) {
      const { data: allPayments } = await supabase.from('payments').select('amount').eq('sale_id', updatedPayment.sale_id);
      const totalPaid = (allPayments || []).reduce((sum, p) => sum + (p.amount || 0), 0);
      const status = totalPaid >= sale.final_amount ? 'Paid' : 'Partially Paid';
      await supabase.from('sales').update({ status }).eq('id', updatedPayment.sale_id);
    }

    return updatedPayment;
  },

  // --- Liabilities ---
  getLiabilities: async () => {
    const { data, error } = await supabase
      .from('liabilities')
      .select('*')
      .order('due_date', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  createLiability: async (liability: any) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('liabilities')
      .insert([{ ...liability, created_by: user?.id }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  updateLiability: async (id: number, liability: any) => {
    const { id: _, created_at, created_by, ...data } = liability;
    const { data: updated, error } = await supabase
      .from('liabilities')
      .update(data)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return updated;
  },

  deleteLiability: async (id: number) => {
    const { error } = await supabase
      .from('liabilities')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  // --- Sales CRM ---
  getLeads: async () => {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },
  
  getLead: async (id: number) => {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  createLead: async (lead: any) => {
    const { data: session } = await supabase.auth.getSession();
    const userId = session?.session?.user?.id;
    const { data, error } = await supabase
      .from('leads')
      .insert([{ ...lead, created_by: userId }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  updateLead: async (id: number, lead: any) => {
    const { id: _, created_at, created_by, ...data } = lead;
    const { data: updated, error } = await supabase
      .from('leads')
      .update(data)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return updated;
  },

  deleteLead: async (id: number) => {
    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  getSalesActivities: async (leadId?: number) => {
    let query = supabase.from('sales_activities').select('*, leads(*)').order('created_at', { ascending: false });
    if (leadId) {
      query = query.eq('lead_id', leadId);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  createSalesActivity: async (activity: any) => {
    const { data: session } = await supabase.auth.getSession();
    const userId = session?.session?.user?.id;
    const { data, error } = await supabase
      .from('sales_activities')
      .insert([{ ...activity, created_by: userId }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  getSalesFollowups: async (leadId?: number) => {
    let query = supabase.from('sales_followups').select('*, leads(*)').order('date', { ascending: true });
    if (leadId) {
      query = query.eq('lead_id', leadId);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  createSalesFollowup: async (followup: any) => {
    const { data: session } = await supabase.auth.getSession();
    const userId = session?.session?.user?.id;
    const { data, error } = await supabase
      .from('sales_followups')
      .insert([{ ...followup, created_by: userId }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  updateSalesFollowup: async (id: number, followup: any) => {
    const { id: _, created_at, created_by, leads, ...data } = followup;
    const { data: updated, error } = await supabase
      .from('sales_followups')
      .update(data)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return updated;
  }
};
