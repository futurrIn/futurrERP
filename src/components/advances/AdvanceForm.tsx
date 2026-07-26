import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/api';
import { toast } from 'react-hot-toast';
import { Loader2, ArrowLeft, Send } from 'lucide-react';

const AdvanceForm = ({ onBack }: { onBack: () => void }) => {
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset } = useForm();
  
  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: api.getAllUsers
  });

  const mutation = useMutation({
    mutationFn: (data: any) => api.createAdvance({
      employee_id: data.employee_id,
      amount: Number(data.amount),
      remaining_amount: Number(data.amount),
      purpose: data.purpose,
      project_id: data.project_id,
      payment_method: data.payment_method,
      transaction_id: data.transaction_id,
      notes: data.notes
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-advances'] });
      toast.success('Advance transferred successfully!');
      onBack();
    },
    onError: (err: any) => {
      toast.error('Failed to create advance: ' + err.message);
    }
  });

  const onSubmit = (data: any) => {
    mutation.mutate(data);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-bold text-sm transition-colors"
      >
        <ArrowLeft size={16} /> Back to Advances
      </button>

      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-800 mb-6">Transfer Advance</h2>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Select Employee *</label>
            <select 
              {...register('employee_id', { required: true })}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="">-- Choose Employee --</option>
              {users?.filter((u: any) => u.is_active !== false).map((u: any) => (
                <option key={u.id} value={u.id}>{u.fullName} ({u.department || 'N/A'})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Amount (₹) *</label>
              <input 
                type="number"
                {...register('amount', { required: true, min: 1 })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 font-bold"
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Payment Method *</label>
              <select 
                {...register('payment_method', { required: true })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="UPI">UPI</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cash">Cash</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Purpose *</label>
            <input 
              type="text"
              {...register('purpose', { required: true })}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20"
              placeholder="e.g. Client Meeting, Travel"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Project / Client (Optional)</label>
              <input 
                type="text"
                {...register('project_id')}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20"
                placeholder="e.g. ABC Website"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Transaction ID (Optional)</label>
              <input 
                type="text"
                {...register('transaction_id')}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20"
                placeholder="UPI Ref No."
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Notes (Optional)</label>
            <textarea 
              {...register('notes')}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 min-h-[100px]"
              placeholder="Any additional remarks..."
            />
          </div>

          <button 
            type="submit"
            disabled={mutation.isPending}
            className="w-full bg-indigo-600 text-white px-6 py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 disabled:opacity-50"
          >
            {mutation.isPending ? <Loader2 className="animate-spin" /> : <Send size={20} />}
            Transfer Money
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdvanceForm;
