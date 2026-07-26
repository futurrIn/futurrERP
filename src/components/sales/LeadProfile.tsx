import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/api';
import { Target, Phone, Mail, Building2, MapPin, Calendar, Activity, ArrowLeft, Loader2, FileText, CheckCircle2, Edit2, X, Save } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';

const CUSTOMER_TYPES = ['Student', 'Business', 'Company', 'Individual', 'College', 'Institution', 'Vendor', 'Supplier'];
const SERVICES = ['Internship', 'Website Development', 'Software Development', 'Hardware Project', 'Product Sales', 'Monthly Service', 'Consulting', 'Other'];

const LeadProfile = ({ leadId, setActiveTab }: { leadId: number, setActiveTab: any }) => {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const { data: lead, isLoading: leadLoading } = useQuery({ 
    queryKey: ['lead', leadId], 
    queryFn: () => api.getLead(leadId) 
  });

  const { data: activities, isLoading: activitiesLoading } = useQuery({ 
    queryKey: ['sales_activities', leadId], 
    queryFn: () => api.getSalesActivities(leadId) 
  });

  const updateLeadMutation = useMutation({
    mutationFn: (data: any) => api.updateLead(leadId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead', leadId] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      setIsEditing(false);
      toast.success('Lead updated successfully');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to update lead')
  });

  if (leadLoading || activitiesLoading) {
    return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-slate-300" size={32} /></div>;
  }

  if (!lead) {
    return <div className="text-center p-12 text-slate-500 font-bold">Lead not found.</div>;
  }

  const handleEditClick = () => {
    setEditForm({
      name: lead.name,
      phone: lead.phone,
      customer_type: lead.customer_type,
      city: lead.city,
      interested_services: lead.interested_services || []
    });
    setIsEditing(true);
  };

  const handleSave = () => {
    updateLeadMutation.mutate(editForm);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 px-4 md:px-0">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => setActiveTab('sales-leads')}
          className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Lead Profile</h2>
          <p className="text-slate-500 font-medium text-sm">Detailed view and activity timeline.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* LEFT COLUMN: Lead Details */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative">
            {!isEditing ? (
              <button onClick={handleEditClick} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
                <Edit2 size={18} />
              </button>
            ) : (
              <div className="absolute top-4 right-4 flex gap-2">
                <button onClick={() => setIsEditing(false)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all">
                  <X size={18} />
                </button>
                <button onClick={handleSave} disabled={updateLeadMutation.isPending} className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-all">
                  {updateLeadMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                </button>
              </div>
            )}

            {!isEditing ? (
              <>
                <div className="flex flex-col items-center text-center pb-6 border-b border-slate-100 mt-4">
                  <div className="w-20 h-20 rounded-2xl bg-indigo-50 text-indigo-600 font-black text-3xl flex items-center justify-center mb-4">
                    {lead.name?.charAt(0) || '?'}
                  </div>
                  <h3 className="text-xl font-black text-slate-800">{lead.name || 'Unknown Lead'}</h3>
                  <p className="text-sm font-bold text-slate-500">{lead.customer_type}</p>
                  <div className="mt-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                      lead.status === 'Converted' ? 'bg-emerald-100 text-emerald-700' :
                      lead.status === 'Lost' ? 'bg-rose-100 text-rose-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {lead.status}
                    </span>
                  </div>
                </div>

            <div className="pt-6 space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <Phone size={16} className="text-slate-400" />
                <span className="font-bold text-slate-700">{lead.phone}</span>
              </div>
              {lead.email && (
                <div className="flex items-center gap-3 text-sm">
                  <Mail size={16} className="text-slate-400" />
                  <span className="font-bold text-slate-700">{lead.email}</span>
                </div>
              )}
              {lead.company && (
                <div className="flex items-center gap-3 text-sm">
                  <Building2 size={16} className="text-slate-400" />
                  <span className="font-bold text-slate-700">{lead.company}</span>
                </div>
              )}
              {lead.city && (
                <div className="flex items-center gap-3 text-sm">
                  <MapPin size={16} className="text-slate-400" />
                  <span className="font-bold text-slate-700">{lead.city}</span>
                </div>
              )}
            </div>
            </>
            ) : (
              <div className="space-y-4 mt-8">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Name</label>
                  <input value={editForm.name || ''} onChange={e => setEditForm({...editForm, name: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 font-medium text-sm" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Phone</label>
                  <input value={editForm.phone || ''} onChange={e => setEditForm({...editForm, phone: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 font-medium text-sm" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Customer Type</label>
                  <select value={editForm.customer_type || ''} onChange={e => setEditForm({...editForm, customer_type: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 font-medium text-sm appearance-none">
                    {CUSTOMER_TYPES.map(ct => <option key={ct} value={ct}>{ct}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">City</label>
                  <input value={editForm.city || ''} onChange={e => setEditForm({...editForm, city: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 font-medium text-sm" />
                </div>
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-4">Interested In</h4>
            {!isEditing ? (
              <div className="flex flex-wrap gap-2">
                {lead.interested_services?.map((s: string) => (
                  <span key={s} className="px-3 py-1.5 bg-slate-50 border border-slate-100 text-slate-600 rounded-xl text-xs font-bold">
                    {s}
                  </span>
                ))}
                {(!lead.interested_services || lead.interested_services.length === 0) && (
                  <span className="text-slate-400 text-sm italic">No services specified</span>
                )}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {SERVICES.map(srv => {
                  const isSelected = editForm.interested_services.includes(srv);
                  return (
                    <button
                      key={srv}
                      onClick={() => {
                        const newServices = isSelected 
                          ? editForm.interested_services.filter((s: string) => s !== srv)
                          : [...editForm.interested_services, srv];
                        setEditForm({...editForm, interested_services: newServices});
                      }}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                    >
                      {srv}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Timeline */}
        <div className="md:col-span-2">
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm h-full">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <Activity className="text-indigo-500" /> Sales Activity Timeline
              </h3>
              <button 
                onClick={() => setActiveTab('sales-activities')}
                className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold hover:bg-indigo-100 transition-all"
              >
                + New Outreach
              </button>
            </div>

            <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
              {activities?.map((activity: any, index: number) => {
                const date = new Date(activity.date);
                const isPositive = activity.outcome === 'Interested' || activity.outcome === 'Very Interested' || activity.outcome === 'Converted to Customer';
                const isNegative = activity.outcome === 'No Response' || activity.outcome === 'Not Interested';
                const isNeutral = !isPositive && !isNegative;

                return (
                  <div key={activity.id} className={`relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active`}>
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-white shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm ${
                      isPositive ? 'bg-emerald-500' : isNegative ? 'bg-rose-500' : 'bg-indigo-500'
                    }`}>
                      {activity.outcome === 'Converted to Customer' ? <CheckCircle2 size={16} className="text-white" /> : <Activity size={16} className="text-white" />}
                    </div>
                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-2xl border border-slate-100 bg-slate-50 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-black text-slate-400 flex items-center gap-1">
                          <Calendar size={12} /> {format(date, 'MMM dd')}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-md font-black uppercase tracking-wider ${
                          isPositive ? 'bg-emerald-100 text-emerald-700' : isNegative ? 'bg-rose-100 text-rose-700' : 'bg-indigo-100 text-indigo-700'
                        }`}>
                          {activity.outcome}
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-800 text-sm mb-1">{activity.outreach_type}</h4>
                      <p className="text-xs font-medium text-slate-600 mb-3">{activity.notes}</p>
                      
                      {activity.attachments && activity.attachments.length > 0 && activity.attachments[0] && (
                        <div className="pt-3 border-t border-slate-200/60 flex items-center gap-2">
                          <FileText size={14} className="text-indigo-400" />
                          <a href={activity.attachments[0]} target="_blank" rel="noreferrer" className="text-xs font-bold text-indigo-600 hover:underline truncate">
                            View Attachment
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              
              {activities?.length === 0 && (
                <div className="text-center py-12 text-slate-400 font-medium">
                  No outreach activities recorded yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeadProfile;
