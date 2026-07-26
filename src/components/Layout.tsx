import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  PlusCircle, 
  History, 
  Settings as SettingsIcon, 
  Receipt,
  LogOut,
  Moon,
  Sun,
  Menu,
  X,
  FilePlus,
  Users,
  Wallet,
  CreditCard,
  Target,
  Activity,
  PhoneCall,
  Calendar,
  Briefcase,
  FileText,
  PiggyBank
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

import { useQuery } from '@tanstack/react-query';
import { api } from '../api/api';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: api.getProfile
  });

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: api.getSettings
  });

  let menuItems: any[] = [];

  if (profile?.role === 'Admin') {
    menuItems = [
      { id: 'dashboard', label: 'Company Overview', icon: LayoutDashboard },
      
      { id: 'sales-history', label: 'Sales History', icon: History, group: 'Accounts' },
      { id: 'customers', label: 'Customers', icon: Users, group: 'Accounts' },
      { id: 'payments', label: 'Payments & Receipts', icon: Receipt, group: 'Accounts' },
      { id: 'liabilities', label: 'Liabilities', icon: CreditCard, group: 'Accounts' },
      { id: 'capital', label: 'Capital & Lenders', icon: PiggyBank, group: 'Accounts' },
      { id: 'reports', label: 'Reports', icon: FilePlus, group: 'Accounts' },

      { id: 'sales-dashboard', label: 'Sales Dashboard', icon: Target, group: 'Sales' },
      { id: 'sales-leads', label: 'Lead Manager', icon: Users, group: 'Sales' },
      { id: 'sales-pipeline', label: 'Pipeline', icon: Briefcase, group: 'Sales' },
      { id: 'sales-followups', label: 'Follow-ups', icon: PhoneCall, group: 'Sales' },
      { id: 'sales-quotations', label: 'Quotations', icon: FileText, group: 'Sales' },

      { id: 'users', label: 'User Management', icon: Users, group: 'HR' },
      { id: 'employee-advances', label: 'Employee Advances', icon: Wallet, group: 'HR' },
      { id: 'team', label: 'Team Expenses', icon: Users, group: 'HR' },
      
      { id: 'settings', label: 'Admin Settings', icon: SettingsIcon, group: 'System' }
    ];
  } else if (profile?.role === 'Accountant') {
    menuItems = [
      { id: 'dashboard', label: 'Finance Dashboard', icon: LayoutDashboard },
      { id: 'new-sale', label: 'New Sale', icon: PlusCircle },
      { id: 'sales-history', label: 'Sales History', icon: History },
      { id: 'customers', label: 'Customers', icon: Users },
      { id: 'payments', label: 'Payments & Receipts', icon: Receipt },
      { id: 'liabilities', label: 'Liabilities', icon: CreditCard },
      { id: 'capital', label: 'Capital & Lenders', icon: PiggyBank },
      { id: 'reports', label: 'Reports', icon: FilePlus },
      { id: 'employee-advances', label: 'Employee Advances', icon: Wallet },
      { id: 'expense-generator', label: 'My Expense', icon: FilePlus },
      { id: 'expense-history', label: 'My Expense History', icon: History },
      { id: 'team', label: 'Company Expenses', icon: Users }
    ];
  } else if (profile?.role === 'Sales Manager' || profile?.role === 'Sales Executive' || profile?.department?.toLowerCase() === 'sales') {
    menuItems = [
      { id: 'sales-dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'sales-activities', label: 'Sales Activities', icon: Activity },
      { id: 'sales-leads', label: 'Leads', icon: Target },
      { id: 'sales-pipeline', label: 'Pipeline', icon: Briefcase },
      { id: 'sales-followups', label: 'Follow-ups', icon: PhoneCall },
      { id: 'sales-quotations', label: 'Quotations', icon: FileText },
      { id: 'customers', label: 'Customers', icon: Users },
      { id: 'expense-generator', label: 'Submit Expense', icon: FilePlus },
      { id: 'expense-history', label: 'My Expense History', icon: History }
    ];
  } else if (profile?.role === 'Manager') {
    menuItems = [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'expense-generator', label: 'Submit Expense', icon: FilePlus },
      { id: 'expense-history', label: 'My History', icon: History },
      { id: 'my-advances', label: 'My Advances', icon: Wallet },
      { id: 'team', label: 'Team Expenses', icon: Users }
    ];
  } else {
    menuItems = [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'expense-generator', label: 'Submit Expense', icon: FilePlus },
      { id: 'expense-history', label: 'History', icon: History },
      { id: 'my-advances', label: 'My Advances', icon: Wallet }
    ];
  }

  if (!settings || !profile) return null;

  const brandColor = settings.primaryColor || '#4f46e5';

  const handleSignOut = async () => {
    await api.signOut();
  };

  return (
    <div className="min-h-screen flex bg-slate-50 transition-colors duration-300">
      <style>{`
        :root {
          --primary-color: ${settings.primaryColor || '#4f46e5'};
          --secondary-color: ${settings.secondaryColor || '#9333ea'};
        }
      `}</style>
      
      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transition-transform duration-300 lg:translate-x-0",
        !isMobileMenuOpen && "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg"
              style={{ background: `linear-gradient(135deg, var(--primary-color), var(--secondary-color))` }}
            >
              <Receipt size={24} />
            </div>
            <div>
              <h1 className="font-bold text-xl tracking-tight text-slate-800 line-clamp-1">{settings.companyName}</h1>
              <p className="text-xs text-slate-500 font-medium">{profile.department || 'Receipt Builder'}</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 space-y-2 mt-4 pb-20 overflow-y-auto">
            {menuItems.map((item, index) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id || (activeTab === 'customer-profile' && item.id === 'customers');
              const prevItem = index > 0 ? menuItems[index - 1] : null;
              const showGroupHeader = item.group && (!prevItem || prevItem.group !== item.group);

              return (
                <React.Fragment key={item.id}>
                  {showGroupHeader && (
                    <div className="pt-4 pb-2 pl-2">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.group}</span>
                    </div>
                  )}
                  <button
                    onClick={() => {
                    setActiveTab(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group",
                    isActive 
                      ? "bg-slate-50 text-slate-900" 
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  )}
                  style={isActive ? { color: brandColor, backgroundColor: `${brandColor}10` } : {}}
                >
                  <Icon size={20} className={cn(
                    "transition-colors",
                    isActive ? "" : "text-slate-400 group-hover:text-slate-600"
                  )} style={isActive ? { color: brandColor } : {}} />
                  {item.label}
                  {isActive && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full" style={{ backgroundColor: brandColor }} />
                  )}
                  </button>
                </React.Fragment>
              );
            })}
          </nav>

          {/* Bottom Actions */}
          <div className="p-4 border-t border-slate-100 space-y-2">
            <button 
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-all"
            >
              <LogOut size={20} />
              Sign Out
            </button>
            <div className="px-4 py-3 rounded-xl bg-slate-50 text-xs text-slate-500 font-medium text-center italic">
              Logged in as {profile.role}
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              className="lg:hidden text-slate-600"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <h2 className="text-lg font-semibold text-slate-800 capitalize">
              {activeTab.replace('-', ' ')}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end text-right">
              <span className="text-sm font-bold text-slate-900">{profile.fullName}</span>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded-md mt-1">{profile.role} • {profile.department}</span>
            </div>
            <div 
              className="w-10 h-10 rounded-full border-2 border-white shadow-sm flex items-center justify-center overflow-hidden p-1.5 ring-1 ring-slate-200"
              style={{ backgroundColor: `white` }}
            >
               <img src={settings.logo || "/logo.svg"} alt="Profile Logo" className="w-full h-full object-contain" />
            </div>
          </div>
        </header>

        {/* Page Body */}
        <div className="p-6 max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
};

export default Layout;
