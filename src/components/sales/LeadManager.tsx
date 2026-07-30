import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/api';
import { Target, Search, MoreVertical, Phone, Mail, Building2, Calendar, Filter, Loader2, ArrowRight, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';

const LeadManager = ({ setActiveTab, setSelectedLeadId }: { setActiveTab: any, setSelectedLeadId: any }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const queryClient = useQueryClient();

  const { data: leads, isLoading } = useQuery({ queryKey: ['leads'], queryFn: () => api.getLeads() });

  const deleteLeadMutation = useMutation({
    mutationFn: (id: number) => api.deleteLead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success('Lead deleted successfully');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to delete lead')
  });

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this lead? This will also delete all associated activities and follow-ups. This action cannot be undone.')) {
      deleteLeadMutation.mutate(id);
    }
  };

  const filteredLeads = leads?.filter(lead => {
    const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          lead.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          lead.phone?.includes(searchTerm);
    const matchesStatus = statusFilter === 'All' || lead.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'New': return 'bg-blue-100 text-blue-700';
      case 'Converted': return 'bg-emerald-100 text-emerald-700';
      case 'Lost': return 'bg-rose-100 text-rose-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-slate-300" size={32} /></div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 px-4 md:px-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Lead Management</h2>
          <p className="text-slate-500 font-medium text-sm">View and manage all potential customers and their pipelines.</p>
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
            placeholder="Search leads by name, company, or phone..."
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
            <option value="New">New</option>
            <option value="Converted">Converted</option>
            <option value="Lost">Lost</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500 font-bold">
                <th className="p-4 pl-6">Lead / Company</th>
                <th className="p-4">Contact</th>
                <th className="p-4">Customer Type</th>
                <th className="p-4">Services</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right pr-6">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLeads?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500 font-medium">
                    No leads found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredLeads?.map((lead: any) => (
                  <tr key={lead.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 font-black flex items-center justify-center text-lg">
                          {lead.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{lead.name}</p>
                          <p className="text-xs font-medium text-slate-500 flex items-center gap-1 mt-0.5">
                            {lead.company ? <><Building2 size={12}/> {lead.company}</> : 'No Company'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-slate-600 flex items-center gap-1.5"><Phone size={14} className="text-slate-400"/> {lead.phone}</p>
                        {lead.email && <p className="text-xs font-medium text-slate-500 flex items-center gap-1.5"><Mail size={12} className="text-slate-400"/> {lead.email}</p>}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold">{lead.customer_type}</span>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {lead.interested_services?.slice(0, 2).map((s: string) => (
                          <span key={s} className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[10px] font-bold">{s}</span>
                        ))}
                        {lead.interested_services?.length > 2 && (
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[10px] font-bold">+{lead.interested_services.length - 2}</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${getStatusColor(lead.status)}`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => {
                            setSelectedLeadId(lead.id);
                            setActiveTab('lead-profile');
                          }}
                          className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:border-indigo-200 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                        >
                          View Profile
                        </button>
                        <button
                          onClick={() => handleDelete(lead.id)}
                          disabled={deleteLeadMutation.isPending}
                          className="p-2 bg-white border border-slate-200 text-rose-500 rounded-xl hover:bg-rose-50 hover:border-rose-200 transition-all"
                          title="Delete Lead"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LeadManager;
