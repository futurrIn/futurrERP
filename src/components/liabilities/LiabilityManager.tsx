import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/api';
import { CreditCard, PlusCircle, Search, Calendar, AlertCircle, Edit, Trash2 } from 'lucide-react';
import { format, isPast } from 'date-fns';
import { toast } from 'react-hot-toast';
import { useForm } from 'react-hook-form';

const LIABILITY_CATEGORIES = [
  'Vendor Payments',
  'Salary Payables',
  'Office Rent',
  'Utility Bills',
  'Loan Repayments',
  'Tax / GST',
  'Other Payables'
];

const LiabilityManager = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const { data: liabilities = [], isLoading } = useQuery({
    queryKey: ['liabilities'],
    queryFn: api.getLiabilities
  });

  const { register, handleSubmit, reset, watch } = useForm({
    defaultValues: {
      title: '',
      category: 'Vendor Payments',
      amount: 0,
      due_date: format(new Date(), 'yyyy-MM-dd'),
      status: 'Pending',
      notes: ''
    }
  });

  const mutation = useMutation({
    mutationFn: (data: any) => {
      if (editingId) return api.updateLiability(editingId, data);
      return api.createLiability(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['liabilities'] });
      toast.success(editingId ? 'Liability updated' : 'Liability added');
      setShowForm(false);
      setEditingId(null);
      reset();
    },
    onError: (err: any) => toast.error(err.message)
  });

  const deleteMutation = useMutation({
    mutationFn: api.deleteLiability,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['liabilities'] });
      toast.success('Liability deleted');
    }
  });

  const onSubmit = (data: any) => {
    mutation.mutate({
      ...data,
      amount: Number(data.amount)
    });
  };

  const handleEdit = (item: any) => {
    setEditingId(item.id);
    reset({
      title: item.title,
      category: item.category,
      amount: item.amount,
      due_date: item.due_date,
      status: item.status,
      notes: item.notes || ''
    });
    setShowForm(true);
  };

  const filtered = liabilities.filter((l: any) => 
    l.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPending = liabilities.filter((l: any) => l.status === 'Pending').reduce((sum: number, l: any) => sum + l.amount, 0);
  const totalOverdue = liabilities.filter((l: any) => l.status === 'Pending' && isPast(new Date(l.due_date))).reduce((sum: number, l: any) => sum + l.amount, 0);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <CreditCard className="text-rose-500" /> Liabilities & Payables
          </h2>
          <p className="text-slate-500 text-sm mt-1">Track money the company owes.</p>
        </div>
        <button 
          onClick={() => {
            setShowForm(!showForm);
            if (showForm) {
              setEditingId(null);
              reset();
            }
          }}
          className="bg-rose-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-rose-700 transition-colors shadow-lg shadow-rose-200"
        >
          {showForm ? 'Cancel' : <><PlusCircle size={20} /> Add Liability</>}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm border-l-4 border-l-slate-400">
          <div className="text-sm font-bold text-slate-500">Total Liabilities</div>
          <div className="text-2xl font-black text-slate-800 mt-1">₹{liabilities.reduce((sum: number, l: any) => sum + l.amount, 0).toLocaleString()}</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm border-l-4 border-l-amber-400">
          <div className="text-sm font-bold text-slate-500">Pending Amount</div>
          <div className="text-2xl font-black text-amber-600 mt-1">₹{totalPending.toLocaleString()}</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm border-l-4 border-l-rose-500">
          <div className="text-sm font-bold text-slate-500">Overdue</div>
          <div className="text-2xl font-black text-rose-600 mt-1">₹{totalOverdue.toLocaleString()}</div>
        </div>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm animate-in zoom-in-95 duration-200">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Title</label>
                <input {...register('title', { required: true })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" placeholder="e.g. Office Rent August" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Category</label>
                <select {...register('category')} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none">
                  {LIABILITY_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Amount (₹)</label>
                <input type="number" {...register('amount', { required: true })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Due Date</label>
                <input type="date" {...register('due_date', { required: true })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Status</label>
                <select {...register('status')} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold">
                  <option value="Pending">Pending</option>
                  <option value="Paid">Paid</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Notes (Optional)</label>
                <input {...register('notes')} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" />
              </div>
            </div>
            <div className="flex justify-end pt-4 gap-3">
              <button type="submit" disabled={mutation.isPending} className="bg-rose-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-rose-700">
                {mutation.isPending ? 'Saving...' : 'Save Liability'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              placeholder="Search liabilities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none shadow-sm"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50/50 border-b border-slate-200">
              <tr>
                <th className="text-left text-xs font-bold text-slate-500 uppercase p-4">Title</th>
                <th className="text-left text-xs font-bold text-slate-500 uppercase p-4">Category</th>
                <th className="text-left text-xs font-bold text-slate-500 uppercase p-4">Due Date</th>
                <th className="text-right text-xs font-bold text-slate-500 uppercase p-4">Amount</th>
                <th className="text-center text-xs font-bold text-slate-500 uppercase p-4">Status</th>
                <th className="text-right text-xs font-bold text-slate-500 uppercase p-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((item: any) => {
                const overdue = item.status === 'Pending' && isPast(new Date(item.due_date));
                return (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="p-4 font-bold text-slate-800">
                      <div className="flex items-center gap-2">
                        {overdue && <AlertCircle size={16} className="text-rose-500" />}
                        {item.title}
                      </div>
                      {item.notes && <div className="text-xs text-slate-500 font-normal mt-0.5">{item.notes}</div>}
                    </td>
                    <td className="p-4 text-sm text-slate-600">
                      <span className="px-2.5 py-1 bg-slate-100 rounded-lg text-xs font-bold">{item.category}</span>
                    </td>
                    <td className="p-4">
                      <span className={`text-sm font-medium flex items-center gap-1 ${overdue ? 'text-rose-600 font-bold' : 'text-slate-600'}`}>
                        <Calendar size={14} />
                        {format(new Date(item.due_date), 'dd MMM yyyy')}
                      </span>
                    </td>
                    <td className="p-4 text-right font-black text-slate-800">₹{item.amount.toLocaleString()}</td>
                    <td className="p-4 text-center">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                        item.status === 'Paid' ? 'bg-emerald-50 text-emerald-600' : 
                        overdue ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'
                      }`}>
                        {overdue && item.status === 'Pending' ? 'Overdue' : item.status}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button onClick={() => handleEdit(item)} className="p-2 text-slate-400 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 rounded-lg transition-colors">
                        <Edit size={16} />
                      </button>
                      <button onClick={() => { if(window.confirm('Delete liability?')) deleteMutation.mutate(item.id) }} className="p-2 text-slate-400 hover:text-rose-600 bg-slate-50 hover:bg-rose-50 rounded-lg transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="p-12 text-center text-slate-500">No liabilities found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LiabilityManager;
