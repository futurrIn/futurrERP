import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/api';
import { PhoneCall, Calendar, Clock, CheckCircle2, Search, Filter, Loader2, ArrowRight } from 'lucide-react';
import { format, isBefore, startOfToday } from 'date-fns';
import { toast } from 'react-hot-toast';

const FollowUps = ({ setActiveTab, setSelectedLeadId }: { setActiveTab: any, setSelectedLeadId: any }) => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Pending');

  const { data: followups, isLoading } = useQuery({ queryKey: ['sales_followups'], queryFn: () => api.getSalesFollowups() });

  const completeMutation = useMutation({
    mutationFn: (id: number) => api.updateSalesFollowup(id, { status: 'Completed' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales_followups'] });
      toast.success('Follow-up marked as completed!');
    }
  });

  const filteredFollowups = followups?.filter((f: any) => {
    const matchesSearch = f.leads?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          f.leads?.company?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || f.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'bg-rose-100 text-rose-700 border-rose-200';
      case 'Medium': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Low': return 'bg-slate-100 text-slate-700 border-slate-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-slate-300" size={32} /></div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 px-4 md:px-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Follow-ups</h2>
          <p className="text-slate-500 font-medium text-sm">Manage your scheduled calls, meetings, and emails.</p>
        </div>
        <button 
          onClick={() => setActiveTab('sales-activities')}
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-sm"
        >
          New Outreach <ArrowRight size={18} />
        </button>
      </div>

      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text"
            placeholder="Search by lead name or company..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-medium text-sm focus:border-indigo-500 transition-all"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="pl-12 pr-10 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-sm text-slate-700 appearance-none focus:border-indigo-500 transition-all cursor-pointer"
          >
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredFollowups?.map((f: any) => {
          const isOverdue = f.status === 'Pending' && isBefore(new Date(f.date), startOfToday());

          return (
            <div key={f.id} className={`bg-white p-6 rounded-3xl border shadow-sm flex flex-col sm:flex-row sm:items-start gap-4 transition-all ${isOverdue ? 'border-rose-200 bg-rose-50/30' : 'border-slate-200 hover:border-indigo-200'}`}>
              <div className="flex-1">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-black text-slate-800">{f.leads?.name || 'Unknown'}</h3>
                    <p className="text-sm font-medium text-slate-500">{f.leads?.company || 'No Company'}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border ${getPriorityColor(f.priority)}`}>
                    {f.priority} Priority
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                    <Calendar size={14} className="text-slate-400" />
                    <span className={isOverdue ? 'text-rose-600' : ''}>{format(new Date(f.date), 'MMM dd, yyyy')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                    <Clock size={14} className="text-slate-400" />
                    {f.time}
                  </div>
                  <div className="col-span-2 flex items-center gap-2 text-sm font-bold text-indigo-600">
                    <PhoneCall size={14} />
                    {f.method}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => {
                      setSelectedLeadId(f.lead_id);
                      setActiveTab('lead-profile');
                    }}
                    className="text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors"
                  >
                    View Lead Profile
                  </button>
                </div>
              </div>

              {f.status === 'Pending' ? (
                <button 
                  onClick={() => completeMutation.mutate(f.id)}
                  className="w-full sm:w-auto px-6 py-3 bg-emerald-50 text-emerald-600 font-bold rounded-xl hover:bg-emerald-100 transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle2 size={18} /> Mark Done
                </button>
              ) : (
                <div className="w-full sm:w-auto px-6 py-3 bg-slate-50 text-slate-400 font-bold rounded-xl flex items-center justify-center gap-2 border border-slate-100">
                  <CheckCircle2 size={18} /> Completed
                </div>
              )}
            </div>
          );
        })}

        {filteredFollowups?.length === 0 && (
          <div className="col-span-1 lg:col-span-2 text-center p-12 bg-white rounded-3xl border border-slate-200 text-slate-500 font-medium">
            No follow-ups found.
          </div>
        )}
      </div>
    </div>
  );
};

export default FollowUps;
