import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import { Session } from '@supabase/supabase-js';
import Layout from './components/Layout';
import Dashboard from './components/dashboard/Dashboard';
import ReceiptGenerator from './components/receipt/ReceiptGenerator';
import ReceiptHistory from './components/receipt/ReceiptHistory';
import Settings from './components/settings/Settings';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ExpenseForm from './components/expenses/ExpenseForm';
import ExpenseHistory from './components/expenses/ExpenseHistory';
import TeamReview from './components/team/TeamReview';
import UserManagement from './components/admin/UserManagement';

import { 
  QueryClient, 
  QueryClientProvider, 
  useQuery 
} from '@tanstack/react-query';
import { api, supabase } from './api/api';

const queryClient = new QueryClient();

const AppContent: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [authView, setAuthView] = useState<'login' | 'register'>('login');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [editingReceipt, setEditingReceipt] = useState<any>(null);
  const [editingExpense, setEditingExpense] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        queryClient.invalidateQueries({ queryKey: ['profile'] });
        queryClient.invalidateQueries({ queryKey: ['settings'] });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    (window as any).setActiveTab = setActiveTab;
  }, []);
  
  const { data: profile, isLoading: isProfileLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: api.getProfile,
    enabled: !!session,
    staleTime: 1000 * 60 * 60,
  });

  const { data: settings, isLoading: isSettingsLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: api.getSettings,
    staleTime: 1000 * 60 * 60,
  });

  const handleEditReceipt = (receipt: any) => {
    setEditingReceipt(receipt);
    setActiveTab('generator');
  };

  const handleEditExpense = (expense: any) => {
    setEditingExpense(expense);
    setActiveTab('expense-generator');
  };

  const handleNewExpense = () => {
    setEditingExpense(null);
    setActiveTab('expense-generator');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard onNavigateToHistory={() => setActiveTab(profile?.role === 'Admin' || profile?.role === 'Accountant' ? 'receipt-history' : 'expense-history')} />;
      case 'receipt-generator':
        return (
          <ReceiptGenerator 
            editData={editingReceipt} 
            onComplete={() => {
              setEditingReceipt(null);
              setActiveTab('receipt-history');
            }} 
          />
        );
      case 'receipt-history':
        return <ReceiptHistory onEdit={handleEditReceipt} />;
      case 'expense-generator':
        return (
          <ExpenseForm 
            editData={editingExpense}
            onNew={handleNewExpense}
            onComplete={() => {
              setEditingExpense(null);
              setActiveTab('expense-history');
            }} 
          />
        );
      case 'expense-history':
        return <ExpenseHistory onEdit={handleEditExpense} />;
      case 'team':
        if (profile?.role === 'Employee') return <Dashboard onNavigateToHistory={() => setActiveTab('expense-history')} />;
        return <TeamReview />;
      case 'users':
        if (profile?.role !== 'Admin') return <Dashboard onNavigateToHistory={() => setActiveTab('expense-history')} />;
        return <UserManagement />;
      case 'settings':
        if (profile?.role !== 'Admin') return <Dashboard onNavigateToHistory={() => setActiveTab('expense-history')} />;
        return <Settings />;
      default:
        // Handle legacy states
        if (activeTab === 'generator') {
           const isEmployee = profile?.role === 'Employee' || profile?.role === 'Manager';
           return isEmployee ? <ExpenseForm editData={editingExpense} onComplete={() => setActiveTab('expense-history')} /> : <ReceiptGenerator editData={editingReceipt} onComplete={() => setActiveTab('receipt-history')} />;
        }
        if (activeTab === 'history') {
           const isEmployee = profile?.role === 'Employee' || profile?.role === 'Manager';
           return isEmployee ? <ExpenseHistory onEdit={handleEditExpense} /> : <ReceiptHistory onEdit={handleEditReceipt} />;
        }
        return <Dashboard onNavigateToHistory={() => setActiveTab('expense-history')} />;
    }
  };

  if (!session) {
    return authView === 'login' 
      ? <Login onRegister={() => setAuthView('register')} onLoginSuccess={() => setAuthView('login')} />
      : <Register onBack={() => setAuthView('login')} onComplete={() => setAuthView('login')} />;
  }

  if (isProfileLoading || isSettingsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-indigo-600" size={40} />
      </div>
    );
  }

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      <div key={activeTab} className="page-transition-enter page-transition-enter-active">
        {renderContent()}
      </div>
    </Layout>
  );
};

const App: React.FC = () => (
  <QueryClientProvider client={queryClient}>
    <AppContent />
    <Toaster position="top-right" toastOptions={{ 
      style: { borderRadius: '16px', background: '#333', color: '#fff' } 
    }} />
  </QueryClientProvider>
);

export default App;
