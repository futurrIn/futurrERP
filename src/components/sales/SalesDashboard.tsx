import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/api';
import { Activity, Target, PhoneCall, Calendar, Percent, Users, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import { format, isToday, isThisWeek, parseISO } from 'date-fns';

const SalesDashboard = ({ setActiveTab }: { setActiveTab: any }) => {
  const { data: profile } = useQuery({ queryKey: ['profile'], queryFn: api.getProfile });
  const { data: leads, isLoading: leadsLoading } = useQuery({ queryKey: ['leads'], queryFn: api.getLeads });
  const { data: activities, isLoading: actsLoading } = useQuery({ queryKey: ['sales_activities'], queryFn: () => api.getSalesActivities() });
  const { data: followups, isLoading: followsLoading } = useQuery({ queryKey: ['sales_followups'], queryFn: () => api.getSalesFollowups() });

  const metrics = useMemo(() => {
    if (!leads || !activities || !followups) return null;

    const todayActivities = activities.filter((a: any) => isToday(new Date(a.date)));
    
    // Follow-ups
    const pendingFollowups = followups.filter((f: any) => f.status === 'Pending');
    const todayFollowups = pendingFollowups.filter((f: any) => isToday(new Date(f.date)));
    const meetingsThisWeek = pendingFollowups.filter((f: any) => f.method === 'Online Meeting' || f.method === 'Offline Visit' || f.method === 'Demo').filter((f: any) => isThisWeek(new Date(f.date)));

    // Conversion
    const totalLeads = leads.length;
    const convertedLeads = leads.filter((l: any) => l.status === 'Converted').length;
    const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;

    return {
      todayActs: todayActivities.length,
      todayFollows: todayFollowups.length,
      pendingFollows: pendingFollowups.length,
      meetings: meetingsThisWeek.length,
      conversion: conversionRate,
      recentOutreach: activities.slice(0, 5)
    };
  }, [leads, activities, followups]);

  if (leadsLoading || actsLoading || followsLoading) {
    return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-slate-300" size={32} /></div>;
  }

  if (!metrics) return null;

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 px-4 md:px-0 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">Sales Dashboard</h2>
          <p className="text-slate-500 font-medium text-sm md:text-base">Overview of your CRM pipeline and daily outreach.</p>
        </div>
        <button 
          onClick={() => setActiveTab('sales-activities')}
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-sm self-start"
        >
          <Activity size={18} /> Log Activity
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 md:gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-50 rounded-full transition-transform group-hover:scale-150 duration-500 ease-out"></div>
          <div className="relative">
            <p className="text-slate-500 font-bold text-xs uppercase tracking-wider mb-2 flex items-center gap-2">
              <Activity size={14} className="text-blue-500" /> Today's Outreach
            </p>
            <h4 className="text-3xl font-black text-slate-800 tracking-tight">{metrics.todayActs}</h4>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-amber-50 rounded-full transition-transform group-hover:scale-150 duration-500 ease-out"></div>
          <div className="relative">
            <p className="text-slate-500 font-bold text-xs uppercase tracking-wider mb-2 flex items-center gap-2">
              <PhoneCall size={14} className="text-amber-500" /> Today's Follow-ups
            </p>
            <h4 className="text-3xl font-black text-slate-800 tracking-tight">{metrics.todayFollows}</h4>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-rose-50 rounded-full transition-transform group-hover:scale-150 duration-500 ease-out"></div>
          <div className="relative">
            <p className="text-slate-500 font-bold text-xs uppercase tracking-wider mb-2 flex items-center gap-2">
              <Target size={14} className="text-rose-500" /> Pending Follow-ups
            </p>
            <h4 className="text-3xl font-black text-slate-800 tracking-tight">{metrics.pendingFollows}</h4>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-purple-50 rounded-full transition-transform group-hover:scale-150 duration-500 ease-out"></div>
          <div className="relative">
            <p className="text-slate-500 font-bold text-xs uppercase tracking-wider mb-2 flex items-center gap-2">
              <Calendar size={14} className="text-purple-500" /> Meetings This Week
            </p>
            <h4 className="text-3xl font-black text-slate-800 tracking-tight">{metrics.meetings}</h4>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group col-span-2 md:col-span-1">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-50 rounded-full transition-transform group-hover:scale-150 duration-500 ease-out"></div>
          <div className="relative">
            <p className="text-slate-500 font-bold text-xs uppercase tracking-wider mb-2 flex items-center gap-2">
              <Percent size={14} className="text-emerald-500" /> Conversion Rate
            </p>
            <h4 className="text-3xl font-black text-slate-800 tracking-tight">{metrics.conversion.toFixed(1)}%</h4>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm h-[400px] overflow-hidden flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-black text-slate-800">Recent Outreach</h3>
            <button onClick={() => setActiveTab('sales-activities')} className="text-sm font-bold text-indigo-600 hover:text-indigo-700">View All</button>
          </div>
          <div className="flex-1 overflow-y-auto pr-2 space-y-4">
            {metrics.recentOutreach.map((act: any) => (
              <div key={act.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                  <Activity size={18} />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-bold text-slate-800 text-sm">{act.leads?.name || 'Unknown Lead'}</h4>
                    <span className="text-xs font-bold text-slate-400">{format(new Date(act.date), 'MMM dd')}</span>
                  </div>
                  <p className="text-xs font-bold text-slate-500 mb-2">{act.outreach_type}</p>
                  <span className={`text-[10px] px-2 py-0.5 rounded-md font-black uppercase tracking-wider ${
                    ['Interested', 'Very Interested', 'Converted to Customer'].includes(act.outcome) ? 'bg-emerald-100 text-emerald-700' : 
                    ['No Response', 'Not Interested'].includes(act.outcome) ? 'bg-rose-100 text-rose-700' : 'bg-indigo-100 text-indigo-700'
                  }`}>
                    {act.outcome}
                  </span>
                </div>
              </div>
            ))}
            {metrics.recentOutreach.length === 0 && (
              <div className="text-center py-12 text-slate-400 font-medium">No recent activities.</div>
            )}
          </div>
        </div>

        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm h-[400px] overflow-hidden flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-black text-slate-800">Upcoming Follow-ups</h3>
            <button onClick={() => setActiveTab('sales-followups')} className="text-sm font-bold text-indigo-600 hover:text-indigo-700">View All</button>
          </div>
          <div className="flex-1 overflow-y-auto pr-2 space-y-4">
            {followups?.filter((f: any) => f.status === 'Pending').slice(0, 5).map((f: any) => (
              <div key={f.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-4 border-l-4 border-l-amber-500">
                <div className="flex-1">
                  <h4 className="font-bold text-slate-800 text-sm mb-1">{f.leads?.name || 'Unknown Lead'}</h4>
                  <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-slate-500 mb-2">
                    <span className="flex items-center gap-1 text-slate-700"><Calendar size={12}/> {format(new Date(f.date), 'MMM dd')} at {f.time}</span>
                    <span className="flex items-center gap-1"><PhoneCall size={12}/> {f.method}</span>
                  </div>
                </div>
                <button className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-emerald-600 hover:bg-emerald-50 hover:border-emerald-200 transition-all shrink-0">
                  <CheckCircle2 size={16} />
                </button>
              </div>
            ))}
            {followups?.filter((f: any) => f.status === 'Pending').length === 0 && (
              <div className="text-center py-12 text-slate-400 font-medium">No pending follow-ups.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesDashboard;
