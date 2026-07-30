import React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, supabase } from '../../api/api';
import { Activity, Target, CheckCircle2, Calendar, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';

const OUTREACH_TYPES = ['Cold Call', 'Phone Follow-up', 'WhatsApp', 'Email', 'Instagram DM', 'LinkedIn', 'Facebook', 'Offline Visit', 'College Visit', 'Client Meeting', 'Event / Expo', 'Referral', 'Walk-in', 'Other'];
const OUTCOMES = ['No Response', 'Interested', 'Very Interested', 'Follow-up Required', 'Meeting Scheduled', 'Proposal Requested', 'Not Interested', 'Converted to Customer'];
const CUSTOMER_TYPES = ['Student', 'Business', 'Company', 'Individual', 'College', 'Institution', 'Vendor', 'Supplier'];
const SERVICES = ['Internship', 'Website Development', 'Software Development', 'Hardware Project', 'Product Sales', 'Monthly Service', 'Consulting', 'Other'];
const FOLLOWUP_METHODS = ['Phone Call', 'WhatsApp', 'Email', 'Offline Visit', 'Online Meeting', 'Demo', 'Proposal Discussion'];

const SalesActivityForm = () => {
  const queryClient = useQueryClient();
  const { register, handleSubmit, watch, reset, control, formState: { errors } } = useForm<any>({
    defaultValues: {
      date: format(new Date(), 'yyyy-MM-dd'),
      priority: 'Medium',
      interested_services: [],
      contacts: [{ name: '', phone: '' }]
    }
  });

  const { fields: contactFields, append: appendContact, remove: removeContact } = useFieldArray({
    control,
    name: "contacts"
  });

  const outcome = watch('outcome');
  const servicesWatch = watch('interested_services') || [];

  const createActivityMutation = useMutation({
    mutationFn: async (data: any) => {
      const primaryPhone = data.contacts?.[0]?.phone || '';
      
      // 1. Check if Lead exists by Phone
      let existingLeads = [];
      if (primaryPhone) {
        const { data: leads } = await supabase
          .from('leads')
          .select('*')
          .eq('phone', primaryPhone);
        existingLeads = leads || [];
      }

      let leadId;
      
      if (existingLeads && existingLeads.length > 0) {
        leadId = existingLeads[0].id;
        // Update existing lead
        await api.updateLead(leadId, {
          name: data.lead_name,
          customer_type: data.customer_type,
          city: data.city,
          status: data.outcome === 'Converted to Customer' ? 'Converted' : existingLeads[0].status,
          interested_services: data.interested_services.length > 0 ? data.interested_services : existingLeads[0].interested_services,
          contacts: data.contacts
        });
      } else {
        // Create new lead
        const newLead = await api.createLead({
          name: data.lead_name,
          phone: primaryPhone,
          customer_type: data.customer_type,
          city: data.city,
          interested_services: data.interested_services,
          contacts: data.contacts,
          status: data.outcome === 'Converted to Customer' ? 'Converted' : 'New'
        });
        leadId = newLead.id;
      }

      // 2. Create Activity
      const activity = await api.createSalesActivity({
        lead_id: leadId,
        outreach_type: data.outreach_type,
        date: data.date,
        time: format(new Date(), 'HH:mm'), // auto-fill time
        notes: data.notes,
        outcome: data.outcome
      });

      // 3. Create Follow-up if required
      if (data.outcome === 'Follow-up Required' || data.outcome === 'Meeting Scheduled' || data.outcome === 'Proposal Requested') {
        await api.createSalesFollowup({
          lead_id: leadId,
          activity_id: activity.id,
          date: data.followup_date,
          time: data.followup_time,
          method: data.followup_method,
          priority: data.priority,
          reminder: data.reminder || false,
          status: 'Pending'
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['sales_activities'] });
      queryClient.invalidateQueries({ queryKey: ['sales_followups'] });
      toast.success('Form submitted successfully!');
      reset();
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to submit form');
    }
  });

  const onSubmit = (data: any) => {
    createActivityMutation.mutate(data);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 px-4 md:px-0">
      <div>
        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Sales Form</h2>
        <p className="text-slate-500 font-medium text-sm">Fill out the details of your interaction.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-8">
        
        {/* SECTION 1: Customer Details */}
        <div className="space-y-4">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
            <Target size={16} className="text-indigo-500" /> Customer Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Name *</label>
              <input {...register('lead_name', { required: true })} placeholder="e.g. John Doe or Company" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-indigo-500 transition-all font-medium" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Customer Type *</label>
              <select {...register('customer_type', { required: true })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-indigo-500 transition-all font-medium appearance-none">
                <option value="">Select type</option>
                {CUSTOMER_TYPES.map(ct => <option key={ct} value={ct}>{ct}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">City</label>
              <input {...register('city')} placeholder="City" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-indigo-500 transition-all font-medium" />
            </div>
          </div>

          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Additional Contacts (Optional)</label>
              <button type="button" onClick={() => appendContact({ name: '', phone: '' })} className="text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-all flex items-center gap-1">
                + Add Contact
              </button>
            </div>
            <div className="space-y-3">
              {contactFields.map((field, index) => (
                <div key={field.id} className="flex flex-col sm:flex-row sm:items-center gap-3 w-full">
                  <input {...register(`contacts.${index}.name`)} placeholder="Contact Person" className="w-full sm:flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 transition-all font-medium text-sm" />
                  <input {...register(`contacts.${index}.phone`)} placeholder="Phone Number" className="w-full sm:flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 transition-all font-medium text-sm" />
                  {contactFields.length > 1 && (
                    <button type="button" onClick={() => removeContact(index)} className="self-end sm:self-auto p-2.5 text-rose-500 hover:bg-rose-50 rounded-xl transition-all border border-transparent hover:border-rose-100">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 space-y-2">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Interested Services</label>
            <div className="flex flex-wrap gap-2">
              {SERVICES.map(srv => {
                const isSelected = servicesWatch.includes(srv);
                return (
                  <label key={srv} className={`px-4 py-2 rounded-xl border font-bold text-sm cursor-pointer transition-all ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-200' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}>
                    <input type="checkbox" value={srv} {...register('interested_services')} className="hidden" />
                    {srv}
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        {/* SECTION 2: Outreach Details */}
        <div className="space-y-4">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
            <Activity size={16} className="text-amber-500" /> Outreach Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Outreach Type *</label>
              <select {...register('outreach_type', { required: true })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-amber-500 transition-all font-medium appearance-none">
                <option value="">Select type</option>
                {OUTREACH_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Date *</label>
              <input type="date" {...register('date', { required: true })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-amber-500 transition-all font-medium" />
            </div>
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Notes *</label>
              <textarea {...register('notes', { required: true })} rows={3} placeholder="What was discussed?" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-amber-500 transition-all font-medium resize-none"></textarea>
            </div>
          </div>
        </div>

        {/* SECTION 3: Outcome */}
        <div className="space-y-4">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
            <CheckCircle2 size={16} className="text-emerald-500" /> Outcome
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {OUTCOMES.map(out => {
              const isSelected = outcome === out;
              const isPositive = out === 'Interested' || out === 'Very Interested' || out === 'Converted to Customer';
              const isNegative = out === 'No Response' || out === 'Not Interested';
              return (
                <label key={out} className={`flex items-center justify-center text-center p-3 rounded-2xl border font-bold text-sm cursor-pointer transition-all ${
                  isSelected 
                    ? isPositive ? 'bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-200' 
                      : isNegative ? 'bg-rose-600 border-rose-600 text-white shadow-md shadow-rose-200' 
                      : 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-200'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}>
                  <input type="radio" value={out} {...register('outcome', { required: true })} className="hidden" />
                  {out}
                </label>
              );
            })}
          </div>

          {/* Follow-up Fields (Conditional) */}
          {(outcome === 'Follow-up Required' || outcome === 'Meeting Scheduled' || outcome === 'Proposal Requested') && (
            <div className="pt-4 mt-4 border-t border-slate-100 space-y-4 animate-in slide-in-from-top-4 fade-in duration-300">
              <div className="flex items-center gap-2">
                <Calendar className="text-indigo-500" size={16} />
                <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">Schedule Follow-up</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Date *</label>
                  <input type="date" {...register('followup_date', { required: true })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-indigo-500 transition-all font-medium" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Time *</label>
                  <input type="time" {...register('followup_time', { required: true })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-indigo-500 transition-all font-medium" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Method *</label>
                  <select {...register('followup_method', { required: true })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-indigo-500 transition-all font-medium appearance-none">
                    <option value="">Select method</option>
                    {FOLLOWUP_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        <button 
          type="submit" 
          disabled={createActivityMutation.isPending}
          className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-lg hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {createActivityMutation.isPending ? <Loader2 className="animate-spin" size={24} /> : 'Submit'}
        </button>
      </form>
    </div>
  );
};

export default SalesActivityForm;
