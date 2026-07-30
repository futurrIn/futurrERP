import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, supabase } from '../../api/api';
import { Target, Phone, Building2, MoreVertical, Loader2, DollarSign } from 'lucide-react';
import { toast } from 'react-hot-toast';

const STAGES = ['New', 'Contacted', 'Proposal Sent', 'Converted', 'Lost'];

const SalesPipeline = ({ setSelectedLeadId, setActiveTab }: { setSelectedLeadId: any, setActiveTab: any }) => {
  const queryClient = useQueryClient();
  const [draggedLead, setDraggedLead] = useState<number | null>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: api.getProfile
  });

  const { data: allUsers } = useQuery({
    queryKey: ['users'],
    queryFn: api.getAllUsers,
    enabled: profile?.role === 'Admin'
  });

  const isAdmin = profile?.role === 'Admin';

  const { data: leads, isLoading } = useQuery({ 
    queryKey: ['leads', selectedEmployeeId], 
    queryFn: () => api.getLeads(selectedEmployeeId || undefined) 
  });

  const updateLeadStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number, status: string }) => {
      const { data, error } = await supabase
        .from('leads')
        .update({ status })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success('Lead stage updated!');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to update lead')
  });

  if (isLoading) {
    return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-slate-300" size={32} /></div>;
  }

  const handleDragStart = (e: React.DragEvent, leadId: number) => {
    setDraggedLead(leadId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    if (draggedLead) {
      updateLeadStatusMutation.mutate({ id: draggedLead, status: newStatus });
      setDraggedLead(null);
    }
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'New': return 'border-blue-200 bg-blue-50/50';
      case 'Contacted': return 'border-amber-200 bg-amber-50/50';
      case 'Proposal Sent': return 'border-purple-200 bg-purple-50/50';
      case 'Converted': return 'border-emerald-200 bg-emerald-50/50';
      case 'Lost': return 'border-rose-200 bg-rose-50/50';
      default: return 'border-slate-200 bg-slate-50/50';
    }
  };

  const getStageHeaderColor = (stage: string) => {
    switch (stage) {
      case 'New': return 'bg-blue-100 text-blue-700';
      case 'Contacted': return 'bg-amber-100 text-amber-700';
      case 'Proposal Sent': return 'bg-purple-100 text-purple-700';
      case 'Converted': return 'bg-emerald-100 text-emerald-700';
      case 'Lost': return 'bg-rose-100 text-rose-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 px-4 md:px-0">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Sales Pipeline</h2>
          <p className="text-slate-500 font-medium text-sm">Drag and drop leads to update their current stage.</p>
        </div>
        
        {isAdmin && allUsers && (
          <div className="flex items-center gap-3">
            <label className="text-sm font-bold text-slate-600">View Pipeline of:</label>
            <select
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
              className="bg-white border-2 border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
            >
              <option value="">All (Company View)</option>
              {allUsers.map((user: any) => (
                <option key={user.id} value={user.id}>
                  {user.fullName || user.email}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="flex gap-6 overflow-x-auto pb-4 snap-x">
        {STAGES.map(stage => {
          const stageLeads = leads?.filter(l => (l.status === stage) || (stage === 'New' && (!l.status || !STAGES.includes(l.status)))) || [];
          
          return (
            <div 
              key={stage}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, stage)}
              className={`flex-shrink-0 w-[85vw] sm:w-80 rounded-3xl border-2 border-dashed ${getStageColor(stage)} p-4 flex flex-col snap-center sm:snap-start transition-colors ${draggedLead ? 'hover:border-indigo-400 hover:bg-indigo-50/30' : ''}`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 ${getStageHeaderColor(stage)}`}>
                  {stage}
                </h3>
                <span className="text-xs font-bold text-slate-400 bg-white px-2 py-1 rounded-lg shadow-sm border border-slate-100">
                  {stageLeads.length}
                </span>
              </div>

              <div className="flex-1 space-y-3 min-h-[150px]">
                {stageLeads.map((lead: any) => (
                  <div 
                    key={lead.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, lead.id)}
                    className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm cursor-grab active:cursor-grabbing hover:border-indigo-300 hover:shadow-md transition-all group relative"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-bold text-slate-800 text-sm">{lead.name}</h4>
                      <button 
                        onClick={() => {
                          setSelectedLeadId(lead.id);
                          setActiveTab('lead-profile');
                        }}
                        className="text-slate-400 hover:text-indigo-600 transition-colors opacity-0 group-hover:opacity-100"
                        title="View Profile"
                      >
                        <Target size={16} />
                      </button>
                    </div>
                    {lead.company && (
                      <div className="text-xs font-medium text-slate-500 mb-2 flex items-center gap-1.5">
                        <Building2 size={12} className="text-slate-400" /> {lead.company}
                      </div>
                    )}
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                      <div className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                        <Phone size={10} /> {lead.phone || 'No phone'}
                      </div>
                      <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-600 font-bold rounded">
                        {lead.customer_type}
                      </span>
                    </div>
                  </div>
                ))}
                
                {stageLeads.length === 0 && (
                  <div className="h-full flex items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center">
                    <span className="text-xs font-bold text-slate-400">Drop leads here</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SalesPipeline;
