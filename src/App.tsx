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
import AdvanceManager from './components/advances/AdvanceManager';
import AdvanceForm from './components/advances/AdvanceForm';
import MyAdvances from './components/advances/MyAdvances';
import NewSale from './components/sales/NewSale';
import SalesHistory from './components/sales/SalesHistory';
import CustomerManager from './components/sales/CustomerManager';
import CustomerProfile from './components/sales/CustomerProfile';
import PaymentManager from './components/sales/PaymentManager';
import LiabilityManager from './components/liabilities/LiabilityManager';
import InvestorManager from './components/capital/InvestorManager';
import InvestorProfile from './components/capital/InvestorProfile';
import NewInvestmentForm from './components/capital/NewInvestmentForm';
import ReportsView from './components/reports/ReportsView';
import SalesDashboard from './components/sales/SalesDashboard';
import SalesActivityForm from './components/sales/SalesActivityForm';
import LeadManager from './components/sales/LeadManager';
import LeadProfile from './components/sales/LeadProfile';
import FollowUps from './components/sales/FollowUps';
import SalesPipeline from './components/sales/SalesPipeline';

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
  const [selectedSaleId, setSelectedSaleId] = useState<number | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null);
  const [selectedInvestorId, setSelectedInvestorId] = useState<string | null>(null);

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
        if (profile?.role === 'Sales Manager' || profile?.role === 'Sales Executive' || profile?.department?.toLowerCase() === 'sales') {
          return <SalesDashboard setActiveTab={setActiveTab} />;
        }
        return <Dashboard onNavigateToHistory={() => setActiveTab(profile?.role === 'Admin' || profile?.role === 'Accountant' ? 'sales-history' : 'expense-history')} />;
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
      case 'new-sale':
        return <NewSale onComplete={() => setActiveTab('sales-history')} />;
      case 'sales-history':
        return <SalesHistory onNavigateToPayments={(saleId) => {
          setSelectedSaleId(saleId);
          setActiveTab('payments');
        }} />;
      case 'customers':
        return <CustomerManager onCustomerSelect={(id) => {
          setSelectedCustomerId(id);
          setActiveTab('customer-profile');
        }} />;
      case 'customer-profile':
        if (!selectedCustomerId) return <CustomerManager />;
        return <CustomerProfile customerId={selectedCustomerId} onBack={() => setActiveTab('customers')} />;
      case 'payments':
        return <PaymentManager defaultSaleId={selectedSaleId} />;
      case 'liabilities':
        return <LiabilityManager />;
      case 'capital':
        return <InvestorManager onInvestorSelect={(id) => {
          setSelectedInvestorId(id);
          setActiveTab('investor-profile');
        }} onNewInvestment={() => setActiveTab('new-investment')} />;
      case 'investor-profile':
        if (!selectedInvestorId) return <InvestorManager onNewInvestment={() => setActiveTab('new-investment')} />;
        return <InvestorProfile investorId={selectedInvestorId} onBack={() => setActiveTab('capital')} />;
      case 'new-investment':
        return <NewInvestmentForm onBack={() => setActiveTab('capital')} />;
      case 'reports':
        return <ReportsView />;
      case 'sales-dashboard':
        return <SalesDashboard setActiveTab={setActiveTab} />;
      case 'sales-activities':
        return <SalesActivityForm />;
      case 'sales-leads':
        return <LeadManager setActiveTab={setActiveTab} setSelectedLeadId={setSelectedLeadId} />;
      case 'sales-pipeline':
        return <SalesPipeline setActiveTab={setActiveTab} setSelectedLeadId={setSelectedLeadId} />;
      case 'lead-profile':
        if (!selectedLeadId) return <LeadManager setActiveTab={setActiveTab} setSelectedLeadId={setSelectedLeadId} />;
        return <LeadProfile leadId={selectedLeadId} setActiveTab={setActiveTab} />;
      case 'sales-followups':
        return <FollowUps setActiveTab={setActiveTab} setSelectedLeadId={setSelectedLeadId} />;
      case 'sales-meetings':
      case 'sales-quotations':
        return (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <h2 className="text-2xl font-black text-slate-800 mb-2">Coming Soon</h2>
              <p className="text-slate-500 font-medium">This module is under development.</p>
            </div>
          </div>
        );
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
      case 'employee-advances':
        if (profile?.role !== 'Admin' && profile?.role !== 'Accountant') return <Dashboard onNavigateToHistory={() => setActiveTab('expense-history')} />;
        return <AdvanceManager onNewAdvance={() => setActiveTab('new-advance')} />;
      case 'new-advance':
        if (profile?.role !== 'Admin' && profile?.role !== 'Accountant') return <Dashboard onNavigateToHistory={() => setActiveTab('expense-history')} />;
        return <AdvanceForm onBack={() => setActiveTab('employee-advances')} />;
      case 'my-advances':
        return <MyAdvances />;
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
