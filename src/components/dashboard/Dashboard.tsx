import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/api';
import { 
  LayoutDashboard, 
  Users, 
  TrendingUp, 
  History,
  Clock,
  ShoppingBag,
  TrendingDown,
  Activity,
  CreditCard,
  Wallet,
  IndianRupee,
  AlertCircle,
  FileWarning,
  Percent,
  Flame
} from 'lucide-react';
import { format, subDays, isAfter, isPast, differenceInMonths } from 'date-fns';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Dashboard = ({ onNavigateToHistory }: { onNavigateToHistory: () => void }) => {
  const { data: profile } = useQuery({ queryKey: ['profile'], queryFn: api.getProfile });
  const { data: payments = [] } = useQuery({ queryKey: ['payments'], queryFn: () => api.getPayments() });
  const { data: expenses = [] } = useQuery({ queryKey: ['expenses'], queryFn: api.getExpenses });
  const { data: sales = [] } = useQuery({ queryKey: ['sales'], queryFn: api.getSales });
  
  const { data: teamExpenses = [] } = useQuery({ 
    queryKey: ['team-expenses'], 
    queryFn: api.getTeamExpenses,
    enabled: ['Manager', 'Admin', 'Accountant'].includes(profile?.role || '')
  });

  const { data: allAdvances = [] } = useQuery({
    queryKey: ['all-advances'],
    queryFn: api.getAllAdvances,
    enabled: ['Admin', 'Accountant'].includes(profile?.role || '')
  });

  const { data: liabilities = [] } = useQuery({
    queryKey: ['liabilities'],
    queryFn: api.getLiabilities,
    enabled: ['Admin', 'Accountant'].includes(profile?.role || '')
  });

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: api.getSettings
  });

  const isFinanceRole = profile?.role === 'Admin' || profile?.role === 'Accountant';
  const isManager = profile?.role === 'Manager';

  const [timeframe, setTimeframe] = useState<'7d' | '1m' | '6m' | 'all'>('1m');
  const [activeChart, setActiveChart] = useState<'revenue' | 'expenses' | 'both'>('both');

  // Time filters
  const filterByTimeframe = (items: any[], dateField: string = 'date') => {
    if (timeframe === 'all') return items;
    const now = new Date();
    let cutoff = new Date();
    if (timeframe === '7d') cutoff = subDays(now, 7);
    if (timeframe === '1m') cutoff = subDays(now, 30);
    if (timeframe === '6m') cutoff = subDays(now, 180);
    return items.filter(item => isAfter(new Date(item[dateField] || item.createdAt || item.created_at), cutoff));
  };

  const filteredPayments = useMemo(() => filterByTimeframe(payments, 'created_at'), [payments, timeframe]);
  const filteredTeamExpenses = useMemo(() => filterByTimeframe(teamExpenses), [teamExpenses, timeframe]);
  
  // Finance Metrics Calculation
  const financeMetrics = useMemo(() => {
    if (!isFinanceRole) return null;

    // Top Row Metrics
    const totalIncome = filteredPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const totalExp = filteredTeamExpenses.filter(e => e.status === 'Approved').reduce((sum, e) => sum + (e.totalAmount || 0), 0);
    const netProfit = totalIncome - totalExp;
    
    // Employee Advances
    const empAdvances = allAdvances.reduce((sum, a) => sum + (a.remaining_amount || 0), 0);
    const pendingSettlements = allAdvances.filter(a => a.remaining_amount > 0 && a.status !== 'Cancelled').length;
    
    const cashAvailable = totalIncome - totalExp - empAdvances;

    // Pending Customer Payments
    const pendingSales = sales.filter((s:any) => s.status !== 'Paid');
    const totalSalesAmount = pendingSales.reduce((sum, s:any) => sum + (s.final_amount || 0), 0);
    const totalPaidAgainstPending = payments
      .filter((p:any) => pendingSales.some((s:any) => s.id === p.sale_id))
      .reduce((sum, p:any) => sum + (p.amount || 0), 0);
    const pendingCustomerPayments = totalSalesAmount - totalPaidAgainstPending;
    const overdueCustomerPayments = pendingSales.filter((s:any) => isPast(new Date(s.created_at))).length; // Simplification

    // Liabilities
    const totalLiabilities = liabilities.filter((l:any) => l.status === 'Pending').reduce((sum, l:any) => sum + l.amount, 0);
    const overdueLiabilities = liabilities.filter((l:any) => l.status === 'Pending' && isPast(new Date(l.due_date))).reduce((sum, l:any) => sum + l.amount, 0);

    // Burn Rate (Average monthly approved expenses)
    const approvedExpenses = teamExpenses.filter(e => e.status === 'Approved');
    const oldestExpDate = approvedExpenses.length > 0 ? new Date(Math.min(...approvedExpenses.map(e => new Date(e.createdAt).getTime()))) : new Date();
    let monthsDiff = differenceInMonths(new Date(), oldestExpDate) || 1;
    if (monthsDiff < 1) monthsDiff = 1;
    const totalAllTimeExp = approvedExpenses.reduce((sum, e) => sum + (e.totalAmount || 0), 0);
    
    const monthlyBurnRate = totalAllTimeExp / monthsDiff;
    const runwayMonths = monthlyBurnRate > 0 ? (cashAvailable / monthlyBurnRate) : 0;

    // Budget
    const monthlyBudget = settings?.monthlyBudget || 0;
    const currentMonthExpenses = teamExpenses
      .filter(e => e.status === 'Approved' && isAfter(new Date(e.createdAt), subDays(new Date(), 30)))
      .reduce((sum, e) => sum + (e.totalAmount || 0), 0);
    
    const budgetUsedPercent = monthlyBudget > 0 ? (currentMonthExpenses / monthlyBudget) * 100 : 0;

    return {
      top: [
        { label: 'Total Income', value: `₹${totalIncome.toLocaleString()}`, icon: TrendingUp, color: 'bg-emerald-500' },
        { label: 'Total Expenses', value: `₹${totalExp.toLocaleString()}`, icon: TrendingDown, color: 'bg-rose-500' },
        { label: 'Net Profit', value: `₹${netProfit.toLocaleString()}`, icon: Activity, color: 'bg-indigo-600' },
        { label: 'Cash Available', value: `₹${cashAvailable.toLocaleString()}`, icon: IndianRupee, color: 'bg-blue-500' },
      ],
      second: [
        { label: 'Pending Sales', value: `₹${pendingCustomerPayments.toLocaleString()}`, sub: `${pendingSales.length} projects`, icon: Clock, color: 'bg-amber-500' },
        { label: 'Liabilities', value: `₹${totalLiabilities.toLocaleString()}`, sub: `₹${overdueLiabilities.toLocaleString()} overdue`, icon: CreditCard, color: 'bg-rose-600' },
        { label: 'Monthly Burn Rate', value: `₹${Math.round(monthlyBurnRate).toLocaleString()}`, sub: `${runwayMonths.toFixed(1)} mo runway`, icon: Flame, color: 'bg-orange-500' },
        { label: 'Budget Used', value: `${budgetUsedPercent.toFixed(1)}%`, sub: `of ₹${monthlyBudget.toLocaleString()}`, icon: Percent, color: budgetUsedPercent > 80 ? 'bg-red-500' : 'bg-emerald-500' },
        { label: 'Emp. Advances', value: `₹${empAdvances.toLocaleString()}`, sub: `${pendingSettlements} pending`, icon: Wallet, color: 'bg-purple-500' },
      ],
      alerts: [
        ...(pendingCustomerPayments > 0 ? [{ type: 'warning', msg: `${pendingSales.length} pending customer payments totaling ₹${pendingCustomerPayments.toLocaleString()}` }] : []),
        ...(overdueLiabilities > 0 ? [{ type: 'error', msg: `₹${overdueLiabilities.toLocaleString()} in overdue liabilities require immediate attention.` }] : []),
        ...(teamExpenses.filter(e => e.status === 'Pending').length > 0 ? [{ type: 'info', msg: `${teamExpenses.filter(e => e.status === 'Pending').length} expense claims pending approval.` }] : []),
        ...(budgetUsedPercent > 80 ? [{ type: 'error', msg: `Budget alert: ${budgetUsedPercent.toFixed(1)}% of monthly budget utilized.` }] : []),
        ...(pendingSettlements > 0 ? [{ type: 'warning', msg: `${pendingSettlements} employee advances awaiting settlement.` }] : []),
      ]
    };
  }, [isFinanceRole, filteredPayments, filteredTeamExpenses, teamExpenses, allAdvances, sales, payments, liabilities, settings]);

  // Generate Chart Data
  const chartData = useMemo(() => {
    let grouped: { [key: string]: { name: string, revenue: number, expenses: number, sortKey: number } } = {};
    const isMonths = timeframe === '6m' || timeframe === 'all';
    const now = new Date();

    if (timeframe === '7d') {
      for (let i = 6; i >= 0; i--) {
        const d = subDays(now, i);
        const key = format(d, 'dd MMM');
        grouped[key] = { name: key, revenue: 0, expenses: 0, sortKey: d.getTime() };
      }
    } else if (timeframe === '1m') {
      for (let i = 29; i >= 0; i--) {
        const d = subDays(now, i);
        const key = format(d, 'dd MMM');
        grouped[key] = { name: key, revenue: 0, expenses: 0, sortKey: d.getTime() };
      }
    } else if (timeframe === '6m') {
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = format(d, 'MMM yyyy');
        grouped[key] = { name: key, revenue: 0, expenses: 0, sortKey: d.getTime() };
      }
    } else if (timeframe === 'all') {
      let oldest = new Date(now.getFullYear(), 0, 1); // Default to start of current year
      [...filteredPayments, ...filteredTeamExpenses.filter(e => e.status === 'Approved')].forEach(item => {
        const d = new Date(item.date || item.createdAt || item.created_at);
        if (d < oldest) oldest = d;
      });
      let current = new Date(oldest.getFullYear(), oldest.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 1);
      
      // Ensure at least 2 points for a line chart
      if (current.getTime() === end.getTime()) {
        current = new Date(oldest.getFullYear(), oldest.getMonth() - 1, 1);
      }
      
      while (current <= end) {
        const key = format(current, 'MMM yyyy');
        grouped[key] = { name: key, revenue: 0, expenses: 0, sortKey: current.getTime() };
        current = new Date(current.getFullYear(), current.getMonth() + 1, 1);
      }
    }

    const processItem = (item: any, type: 'revenue' | 'expenses') => {
      const d = new Date(item.date || item.createdAt || item.created_at);
      const key = format(d, isMonths ? 'MMM yyyy' : 'dd MMM');
      
      if (!grouped[key]) {
        grouped[key] = { 
          name: key,
          revenue: 0, 
          expenses: 0, 
          sortKey: isMonths ? new Date(`1 ${key}`).getTime() : d.getTime() 
        };
      }
      grouped[key][type] += (item.amount || item.totalAmount || 0);
    };

    filteredPayments.forEach(p => processItem(p, 'revenue'));
    filteredTeamExpenses.filter(e => e.status === 'Approved').forEach(e => processItem(e, 'expenses'));
    
    return Object.values(grouped).sort((a, b) => a.sortKey - b.sortKey).map(({ name, revenue, expenses }) => ({ name, revenue, expenses }));
  }, [filteredPayments, filteredTeamExpenses, timeframe]);

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 px-4 md:px-0 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">
            {isFinanceRole ? 'Advanced Finance Dashboard' : 'Dashboard'}
          </h2>
          <p className="text-slate-500 font-medium text-sm md:text-base">Real-time overview of financial health.</p>
        </div>
        
        {isFinanceRole && (
          <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm self-start">
            {[
              { id: '7d', label: '7D' },
              { id: '1m', label: '1M' },
              { id: '6m', label: '6M' },
              { id: 'all', label: 'ALL' }
            ].map(tf => (
              <button
                key={tf.id}
                onClick={() => setTimeframe(tf.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                  timeframe === tf.id 
                    ? 'bg-slate-900 text-white' 
                    : 'text-slate-400 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {isFinanceRole && financeMetrics ? (
        <>
          {/* Top Row: Key Income / Exp */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {financeMetrics.top.map((stat, i) => (
              <div key={i} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-lg transition-all group">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-2xl ${stat.color} text-white shadow-lg group-hover:scale-110 transition-transform`}>
                    <stat.icon size={20} />
                  </div>
                </div>
                <div>
                  <p className="text-slate-500 font-bold text-xs uppercase tracking-wider mb-1">{stat.label}</p>
                  <h4 className="text-2xl font-black text-slate-800 tracking-tight">{stat.value}</h4>
                </div>
              </div>
            ))}
          </div>

          {/* Second Row: Specific Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6">
            {financeMetrics.second.map((stat, i) => (
              <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-slate-300 transition-colors">
                <div className={`absolute -right-4 -top-4 opacity-5 ${stat.color.replace('bg-', 'text-')} group-hover:scale-110 transition-transform`}>
                  <stat.icon size={100} />
                </div>
                <div className="relative z-10">
                  <p className="text-slate-500 font-bold text-xs uppercase tracking-wider mb-2 flex items-center gap-2">
                    <stat.icon size={14} className={stat.color.replace('bg-', 'text-')} /> {stat.label}
                  </p>
                  <h4 className={`text-xl font-black ${stat.label === 'Budget Used' && parseFloat(stat.value) > 80 ? 'text-red-600' : 'text-slate-800'} tracking-tight`}>{stat.value}</h4>
                  <p className="text-slate-400 font-medium text-xs mt-1">{stat.sub}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
            <div className="lg:col-span-2 bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                <div>
                  <h3 className="text-xl font-black text-slate-800">Revenue vs Expenses</h3>
                  <div className="flex gap-4 mt-2">
                    <div className="flex items-center gap-1.5 text-sm font-bold text-emerald-600">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                      Total Income: ₹{filteredPayments.reduce((sum, p) => sum + (p.amount || 0), 0).toLocaleString()}
                    </div>
                    <div className="flex items-center gap-1.5 text-sm font-bold text-rose-600">
                      <div className="w-2.5 h-2.5 rounded-full bg-rose-500"></div>
                      Total Expenses: ₹{filteredTeamExpenses.filter(e => e.status === 'Approved').reduce((sum, e) => sum + (e.totalAmount || 0), 0).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 600}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 600}} tickFormatter={(value) => `₹${value}`} width={60} />
                    <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold'}} />
                    <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" />
                    <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#f43f5e" strokeWidth={4} fillOpacity={1} fill="url(#colorExp)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
                  <AlertCircle className="text-amber-500" /> Financial Alerts
                </h3>
                <div className="space-y-3">
                  {financeMetrics.alerts.length === 0 ? (
                    <p className="text-slate-500 text-sm italic p-4 bg-slate-50 rounded-xl text-center">All clear! No pending alerts.</p>
                  ) : (
                    financeMetrics.alerts.map((alert, i) => (
                      <div key={i} className={`p-4 rounded-xl border flex items-start gap-3 ${
                        alert.type === 'error' ? 'bg-red-50 border-red-100 text-red-700' :
                        alert.type === 'warning' ? 'bg-amber-50 border-amber-100 text-amber-700' :
                        'bg-blue-50 border-blue-100 text-blue-700'
                      }`}>
                        <FileWarning size={16} className="mt-0.5 shrink-0" />
                        <span className="text-sm font-bold">{alert.msg}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                <h3 className="text-lg font-black text-slate-800 mb-4">Recent Activity</h3>
                <div className="space-y-4">
                  {[...filteredPayments.map(p => ({...p, _type: 'payment'})), ...filteredTeamExpenses.map(e => ({...e, _type: 'expense'}))]
                    .sort((a,b) => new Date(b.created_at || b.createdAt).getTime() - new Date(a.created_at || a.createdAt).getTime())
                    .slice(0, 4)
                    .map((item, i) => (
                      <div key={i} className="flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${item._type === 'payment' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                            {item._type === 'payment' ? <CreditCard size={16} /> : <ShoppingBag size={16} />}
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-800 line-clamp-1">{item._type === 'payment' ? `Payment ${item.receipt_number}` : 'Expense Claim'}</p>
                            <p className="text-xs font-medium text-slate-400">{format(new Date(item.created_at || item.createdAt), 'dd MMM yyyy')}</p>
                          </div>
                        </div>
                        <div className={`font-black text-sm ${item._type === 'payment' ? 'text-emerald-600' : 'text-slate-800'}`}>
                          {item._type === 'payment' ? '+' : '-'}₹{(item.amount || item.totalAmount || 0).toLocaleString()}
                        </div>
                      </div>
                    ))
                  }
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center">
          <h3 className="text-xl font-bold text-slate-800 mb-2">Welcome to {settings?.companyName || 'Futurr ERP'}</h3>
          <p className="text-slate-500">Your role doesn't have access to the advanced financial dashboard.</p>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
