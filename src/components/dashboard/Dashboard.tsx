import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/api';
import { 
  LayoutDashboard, 
  Users, 
  TrendingUp, 
  Calendar,
  History,
  Clock,
  Car,
  ShoppingBag,
  TrendingDown,
  Activity,
  CreditCard
} from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth, isAfter } from 'date-fns';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Dashboard = ({ onNavigateToHistory }: { onNavigateToHistory: () => void }) => {
  const { data: profile } = useQuery({ queryKey: ['profile'], queryFn: api.getProfile });
  const { data: receipts = [] } = useQuery({ queryKey: ['receipts'], queryFn: api.getReceipts });
  const { data: expenses = [] } = useQuery({ queryKey: ['expenses'], queryFn: api.getExpenses });
  
  // For Manager, Admin, Accountant
  const { data: teamExpenses = [] } = useQuery({ 
    queryKey: ['team-expenses'], 
    queryFn: api.getTeamExpenses,
    enabled: ['Manager', 'Admin', 'Accountant'].includes(profile?.role)
  });

  const isFinanceRole = profile?.role === 'Admin' || profile?.role === 'Accountant';
  const isManager = profile?.role === 'Manager';
  const isEmployee = profile?.role === 'Employee';

  const [timeframe, setTimeframe] = useState<'7d' | '1m' | '6m' | 'all'>('7d');
  const [activeChart, setActiveChart] = useState<'revenue' | 'expenses' | 'both'>('revenue');

  // Filter data by timeframe
  const filterByTimeframe = (items: any[], dateField: string = 'date') => {
    if (timeframe === 'all') return items;
    
    const now = new Date();
    let cutoff = new Date();
    
    if (timeframe === '7d') cutoff = subDays(now, 7);
    if (timeframe === '1m') cutoff = subDays(now, 30);
    if (timeframe === '6m') cutoff = subDays(now, 180);

    return items.filter(item => isAfter(new Date(item[dateField] || item.createdAt), cutoff));
  };

  // Safe Date parsing helper for rendering without crashes
  const formatDateSafe = (dateStr: any) => {
    try {
      if (!dateStr) return 'N/A';
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return 'N/A';
      return format(d, 'MMM d');
    } catch (err) {
      return 'N/A';
    }
  };

  // Extract exact team expenses the manager is authorized to review (no self-claims or other managers)
  const managerTeamExpenses = useMemo(() => {
    if (!isManager) return [];
    return teamExpenses.filter((exp: any) => {
      const empDept = exp.employeeDepartment || exp.employee?.department || 'General';
      const isEmpManager = exp.employeeRole === 'Manager' || exp.employee?.role === 'Manager';
      return empDept === profile?.department && !isEmpManager && exp.createdBy !== profile?.id;
    });
  }, [teamExpenses, profile, isManager]);

  const filteredReceipts = useMemo(() => filterByTimeframe(receipts), [receipts, timeframe]);
  const filteredTeamExpenses = useMemo(() => filterByTimeframe(teamExpenses), [teamExpenses, timeframe]);
  const filteredManagerTeamExpenses = useMemo(() => filterByTimeframe(managerTeamExpenses), [managerTeamExpenses, timeframe]);
  
  // Calculate Stats
  const stats = useMemo(() => {
    if (isFinanceRole) {
      const totalRev = filteredReceipts.reduce((sum, r) => sum + (r.amount || 0), 0);
      const totalExp = filteredTeamExpenses.reduce((sum, e) => sum + (e.totalAmount || 0), 0);
      const pendingExp = teamExpenses.filter(e => e.status === 'Pending').length;
      
      return [
        { label: 'Total Revenue', value: `₹${totalRev.toLocaleString()}`, icon: TrendingUp, trend: 'Inflow', color: 'bg-emerald-500' },
        { label: 'Total Claims', value: `₹${totalExp.toLocaleString()}`, icon: TrendingDown, trend: 'Outflow', color: 'bg-red-500' },
        { label: 'Pending Approvals', value: pendingExp.toString(), icon: Clock, trend: 'Action Needed', color: 'bg-amber-500' },
        { label: 'Receipts Issued', value: filteredReceipts.length.toString(), icon: History, trend: 'Volume', color: 'bg-indigo-600' }
      ];
    } else if (isManager) {
      const pendingExp = managerTeamExpenses.filter(e => e.status === 'Pending').length;
      const teamTotalExp = filteredManagerTeamExpenses.filter(e => e.status === 'Approved').reduce((sum, e) => sum + (e.totalAmount || 0), 0);
      const myTotalExp = expenses.reduce((sum, e) => sum + (e.totalAmount || 0), 0);
      return [
        { label: 'Team Pending', value: pendingExp.toString(), icon: Users, trend: 'Review', color: 'bg-amber-500' },
        { label: 'Team Approved Spend', value: `₹${teamTotalExp.toLocaleString()}`, icon: TrendingDown, trend: 'Outflow', color: 'bg-red-500' },
        { label: 'My Claims', value: `₹${myTotalExp.toLocaleString()}`, icon: TrendingUp, trend: 'Total', color: 'bg-indigo-600' },
        { label: 'My Submissions', value: expenses.length.toString(), icon: LayoutDashboard, trend: 'Volume', color: 'bg-emerald-500' }
      ];
    } else {
      const total = expenses.reduce((sum, exp) => sum + (exp.totalAmount || 0), 0);
      const pending = expenses.filter(e => e.status === 'Pending').length;
      return [
        { label: 'Total Claims', value: `₹${total.toLocaleString()}`, icon: TrendingUp, trend: 'Overall', color: 'bg-indigo-600' },
        { label: 'Pending Approval', value: pending.toString(), icon: Clock, trend: 'Active', color: 'bg-amber-500' },
        { label: 'Active Submissions', value: expenses.length.toString(), icon: LayoutDashboard, trend: 'Volume', color: 'bg-emerald-500' },
      ];
    }
  }, [isFinanceRole, isManager, filteredReceipts, filteredTeamExpenses, filteredManagerTeamExpenses, teamExpenses, managerTeamExpenses, expenses]);

  // Generate Chart Data
  const chartData = useMemo(() => {
    let grouped: { [key: string]: { revenue: number, expenses: number, team: number, personal: number } } = {};
    const keysInOrder: string[] = [];

    // Determine buckets (days vs months)
    if (timeframe === 'all' || timeframe === '6m') {
      // Group by month
      const processItem = (item: any, type: 'revenue' | 'expenses' | 'team' | 'personal') => {
        const d = new Date(item.date || item.createdAt);
        const key = format(d, 'MMM yyyy');
        if (!grouped[key]) {
          grouped[key] = { revenue: 0, expenses: 0, team: 0, personal: 0 };
          if (!keysInOrder.includes(key)) keysInOrder.push(key);
        }
        grouped[key][type] += (item.amount || item.totalAmount || 0);
      };

      if (isFinanceRole) {
        if (activeChart === 'revenue' || activeChart === 'both') filteredReceipts.forEach(r => processItem(r, 'revenue'));
        if (activeChart === 'expenses' || activeChart === 'both') filteredTeamExpenses.forEach(e => processItem(e, 'expenses'));
      } else if (isManager) {
        filteredManagerTeamExpenses.forEach(e => processItem(e, 'team'));
        expenses.forEach(e => processItem(e, 'personal'));
      } else {
        expenses.forEach(e => processItem(e, 'expenses'));
      }
      
      keysInOrder.sort((a, b) => new Date(`1 ${a}`).getTime() - new Date(`1 ${b}`).getTime());
      return keysInOrder.map(name => ({ name, ...grouped[name] }));
    } else {
      // Group by day for 7d and 1m
      const numDays = timeframe === '7d' ? 7 : 30;
      const days = Array.from({ length: numDays }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return format(d, 'yyyy-MM-dd');
      }).reverse();

      return days.map(dateStr => {
        const dateObj = new Date(dateStr);
        let revTotal = 0;
        let expTotal = 0;
        let teamTotal = 0;
        let personalTotal = 0;

        if (isFinanceRole) {
          if (activeChart === 'revenue' || activeChart === 'both') {
            revTotal = filteredReceipts
              .filter(r => format(new Date(r.date || r.createdAt), 'yyyy-MM-dd') === dateStr)
              .reduce((sum, r) => sum + (r.amount || 0), 0);
          }
          if (activeChart === 'expenses' || activeChart === 'both') {
            expTotal = filteredTeamExpenses
              .filter(e => format(new Date(e.date || e.createdAt), 'yyyy-MM-dd') === dateStr)
              .reduce((sum, e) => sum + (e.totalAmount || 0), 0);
          }
        } else if (isManager) {
          teamTotal = filteredManagerTeamExpenses
            .filter(e => format(new Date(e.date || e.createdAt), 'yyyy-MM-dd') === dateStr)
            .reduce((sum, e) => sum + (e.totalAmount || 0), 0);
          personalTotal = expenses
            .filter(e => format(new Date(e.date || e.createdAt), 'yyyy-MM-dd') === dateStr)
            .reduce((sum, e) => sum + (e.totalAmount || 0), 0);
        } else {
          expTotal = expenses
            .filter(e => format(new Date(e.date || e.createdAt), 'yyyy-MM-dd') === dateStr)
            .reduce((sum, e) => sum + (e.totalAmount || 0), 0);
        }

        return {
          name: format(dateObj, 'dd MMM'),
          revenue: revTotal,
          expenses: expTotal,
          team: teamTotal,
          personal: personalTotal
        };
      });
    }
  }, [isFinanceRole, isManager, activeChart, filteredReceipts, filteredTeamExpenses, filteredManagerTeamExpenses, expenses, timeframe]);

  const recentItems = useMemo(() => {
    let data = [];
    if (isFinanceRole) {
      if (activeChart === 'revenue') data = receipts;
      else if (activeChart === 'expenses') data = teamExpenses;
      else data = [...receipts, ...teamExpenses];
    } else if (isManager) {
      data = managerTeamExpenses;
    } else {
      data = expenses;
    }
    return [...data].sort((a, b) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime()).slice(0, 5);
  }, [isFinanceRole, isManager, activeChart, receipts, teamExpenses, managerTeamExpenses, expenses]);

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 px-4 md:px-0 pb-20">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">
            {isFinanceRole ? 'Finance Dashboard' : 'Dashboard'}
          </h2>
          <p className="text-slate-500 font-medium text-sm md:text-base">Welcome back, {profile?.fullName || 'User'}</p>
        </div>
        
        {(isFinanceRole || isManager) && (
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 md:p-8 rounded-[2rem] md:rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all group">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <div className={`p-3 md:p-4 rounded-2xl ${stat.color} text-white shadow-lg group-hover:scale-110 transition-transform`}>
                <stat.icon size={20} className="md:w-6 md:h-6" />
              </div>
              <div className="flex items-center gap-1 text-slate-500 font-bold text-xs bg-slate-50 px-2 py-1 rounded-lg">
                {stat.trend}
              </div>
            </div>
            <div>
              <p className="text-slate-500 font-bold text-xs uppercase tracking-wider mb-1">{stat.label}</p>
              <h4 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">{stat.value}</h4>
            </div>
          </div>
        ))}
      </div>

      {/* Charts & Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        <div className="lg:col-span-2 bg-white p-6 md:p-8 rounded-[2rem] md:rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 md:mb-8">
            <h3 className="text-lg md:text-xl font-black text-slate-800">
              {isFinanceRole ? (activeChart === 'revenue' ? 'Revenue Analytics' : activeChart === 'expenses' ? 'Expense Analytics' : 'Financial Overview') : 'Expense Trends'}
            </h3>
            
            {isFinanceRole && (
              <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-2xl border border-slate-100 self-start">
                <button
                  onClick={() => setActiveChart('revenue')}
                  className={`px-4 py-2 rounded-xl text-xs font-black tracking-wider transition-all ${
                    activeChart === 'revenue' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  REVENUE
                </button>
                <button
                  onClick={() => setActiveChart('expenses')}
                  className={`px-4 py-2 rounded-xl text-xs font-black tracking-wider transition-all ${
                    activeChart === 'expenses' ? 'bg-white text-red-500 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  EXPENSES
                </button>
                <button
                  onClick={() => setActiveChart('both')}
                  className={`px-4 py-2 rounded-xl text-xs font-black tracking-wider transition-all ${
                    activeChart === 'both' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  BOTH
                </button>
              </div>
            )}
          </div>
          <div className="h-[250px] md:h-[300px]">
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
                  <linearGradient id="colorTeam" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorPers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ec4899" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 600}}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 600}}
                  tickFormatter={(value) => `₹${value}`}
                  width={60}
                />
                <Tooltip 
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold'}}
                  formatter={(value: any, name: any) => [`₹${value.toLocaleString()}`, name ? String(name).charAt(0).toUpperCase() + String(name).slice(1) : 'Amount']}
                />
                
                {isManager ? (
                  <>
                    <Area type="monotone" dataKey="team" name="Team Expenses" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorTeam)" />
                    <Area type="monotone" dataKey="personal" name="My Expenses" stroke="#ec4899" strokeWidth={4} fillOpacity={1} fill="url(#colorPers)" />
                  </>
                ) : isFinanceRole ? (
                  <>
                    {(activeChart === 'revenue' || activeChart === 'both') && (
                      <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" />
                    )}
                    {(activeChart === 'expenses' || activeChart === 'both') && (
                      <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#f43f5e" strokeWidth={4} fillOpacity={1} fill="url(#colorExp)" />
                    )}
                  </>
                ) : (
                  <Area type="monotone" dataKey="expenses" name="My Expenses" stroke="#4f46e5" strokeWidth={4} fillOpacity={1} fill="url(#colorExp)" />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 md:p-8 rounded-[2rem] md:rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6 md:mb-8">
            <h3 className="text-lg md:text-xl font-black text-slate-800">Recent Activity</h3>
            <Activity className="text-slate-300" size={20} />
          </div>
          <div className="space-y-4 md:space-y-6">
            {recentItems.length === 0 ? (
              <p className="text-center text-slate-400 py-8 font-bold text-sm">No recent activity found.</p>
            ) : (
              recentItems.map((item: any) => (
                <div key={item.id} className="flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                      item.amount ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'
                    }`}>
                      {item.amount ? <CreditCard size={16} /> : <ShoppingBag size={16} />}
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-800 line-clamp-1 max-w-[120px]">
                        {item.studentName || item.employeeName || item.type || 'Expense'}
                      </p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        {formatDateSafe(item.date || item.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-slate-800">₹{(item.amount || item.totalAmount || 0).toLocaleString()}</p>
                    <p className={`text-[9px] font-black uppercase tracking-widest ${
                      item.status === 'Approved' ? 'text-emerald-500' : 
                      item.status === 'Rejected' ? 'text-red-500' : 'text-amber-500'
                    }`}>
                      {item.paymentMethod || item.status || 'Processed'}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
          <button 
            onClick={onNavigateToHistory}
            className="w-full mt-6 md:mt-8 py-3 md:py-4 bg-slate-50 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-all active:scale-95 border border-slate-100"
          >
            View Full Log
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
