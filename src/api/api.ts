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
        data: { fullName, phone }
      }
    });
    
    if (authError) throw authError;
    if (!authData.user) throw new Error('Signup failed');

    const { error: profileError } = await supabase
      .from('profiles')
      .insert([{
        id: authData.user.id,
        email,
        fullName,
        phone,
        role,
        department,
        jobPosition
      }]);
    
    if (profileError) throw profileError;
    return authData;
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  getProfile: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

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
        categories: ['Internship', 'Online Course', 'Workshop', 'Certification', 'Training Program'],
        departments: ['Finance', 'Sales', 'Academics', 'HR', 'Technical']
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
  }
};
