import React from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/api';
import { toast } from 'react-hot-toast';
import { Loader2, ArrowLeft, Send } from 'lucide-react';

interface NewInvestmentFormProps {
  onBack: () => void;
}

const NewInvestmentForm: React.FC<NewInvestmentFormProps> = ({ onBack }) => {
  const queryClient = useQueryClient();
  
  const { data: investors = [] } = useQuery({
    queryKey: ['investors'],
    queryFn: api.getInvestors
  });

  const { register, handleSubmit, watch, formState: { errors } } = useForm<any>({
    defaultValues: {
      type: 'Loan',
      addLiability: true,
      due_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]
    }
  });

  const isLoan = watch('type') === 'Loan';

  const mutation = useMutation({
    mutationFn: (data: any) => api.createInvestment({
      investor_id: data.investor_id,
      amount: Number(data.amount),
      type: data.type,
      payment_method: data.payment_method,
      transaction_id: data.transaction_id,
      notes: data.notes,
      addLiability: data.addLiability,
      due_date: data.due_date
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['capital_transactions'] });
      queryClient.invalidateQueries({ queryKey: ['liabilities'] }); // if loan was added
      toast.success('Capital/Loan recorded successfully!');
      onBack();
    },
    onError: (err: any) => {
      toast.error('Failed to record: ' + err.message);
    }
  });

  const onSubmit = (data: any) => {
    mutation.mutate(data);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-bold text-sm transition-colors"
      >
        <ArrowLeft size={16} /> Back to Capital Manager
      </button>

      <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm">
        <h2 className="text-2xl font-black text-slate-800 mb-6">Record Capital Injection</h2>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Select Investor / Lender *</label>
            <select 
              {...register('investor_id', { required: true })}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="">-- Choose Profile --</option>
              {investors.map((i: any) => (
                <option key={i.id} value={i.id}>{i.name} ({i.type})</option>
              ))}
            </select>
            {errors.investor_id && <p className="text-xs text-red-500 font-bold">Required</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Type *</label>
              <select 
                {...register('type', { required: true })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="Loan">Loan (Debt)</option>
                <option value="Equity">Equity Investment</option>
                <option value="Other">Other</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Amount (₹) *</label>
              <input 
                type="number"
                {...register('amount', { required: true, min: 1 })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 font-bold text-indigo-700"
                placeholder="0.00"
              />
              {errors.amount && <p className="text-xs text-red-500 font-bold">Invalid amount</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Payment Method</label>
              <select 
                {...register('payment_method')}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cheque">Cheque</option>
                <option value="UPI">UPI</option>
                <option value="Cash">Cash</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Transaction ID / Cheque No.</label>
              <input 
                type="text"
                {...register('transaction_id')}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20"
                placeholder="Ref No."
              />
            </div>
          </div>

          {isLoan && (
            <div className="bg-orange-50 border border-orange-100 p-5 rounded-2xl space-y-4">
              <div className="flex items-center gap-3">
                <input 
                  type="checkbox" 
                  id="addLiability" 
                  {...register('addLiability')} 
                  className="w-5 h-5 accent-orange-600 rounded"
                />
                <div>
                  <label htmlFor="addLiability" className="text-sm font-black text-orange-900 cursor-pointer">
                    Track as Liability
                  </label>
                  <p className="text-xs font-medium text-orange-700">Automatically add this to Payables/Liabilities</p>
                </div>
              </div>

              {watch('addLiability') && (
                <div className="space-y-2 mt-4">
                  <label className="text-sm font-bold text-orange-900">Expected Repayment Date</label>
                  <input 
                    type="date"
                    {...register('due_date')}
                    className="w-full px-4 py-3 bg-white border border-orange-200 rounded-xl outline-none focus:border-orange-400"
                  />
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Notes (Optional)</label>
            <textarea 
              {...register('notes')}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 min-h-[100px]"
              placeholder="Terms, interest rate details, etc."
            />
          </div>

          <button 
            type="submit"
            disabled={mutation.isPending}
            className="w-full bg-indigo-600 text-white px-6 py-4 rounded-xl font-black tracking-wide flex items-center justify-center gap-2 hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 disabled:opacity-50"
          >
            {mutation.isPending ? <Loader2 className="animate-spin" /> : <Send size={20} />}
            Record Injection
          </button>
        </form>
      </div>
    </div>
  );
};

export default NewInvestmentForm;
