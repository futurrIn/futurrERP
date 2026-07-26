import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/api';
import { Users, PlusCircle, Search, Building2, Phone, Mail, PiggyBank } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { useForm } from 'react-hook-form';

interface InvestorManagerProps {
  onInvestorSelect?: (id: string) => void;
  onNewInvestment?: () => void;
}

const InvestorManager: React.FC<InvestorManagerProps> = ({ onInvestorSelect, onNewInvestment }) => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);

  const { data: investors = [], isLoading } = useQuery({
    queryKey: ['investors'],
    queryFn: api.getInvestors
  });

  const { register, handleSubmit, reset } = useForm();

  const mutation = useMutation({
    mutationFn: api.createInvestor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investors'] });
      toast.success('Investor/Lender added successfully');
      setShowForm(false);
      reset();
    },
    onError: (err: any) => toast.error(err.message)
  });

  const onSubmit = (data: any) => {
    mutation.mutate(data);
  };

  const filtered = investors.filter((i: any) => 
    i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (i.company && i.company.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <PiggyBank className="text-indigo-600" /> Capital & Lenders
          </h2>
          <p className="text-slate-500 font-medium text-sm mt-1">Manage investors, lenders, and track capital injections.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowForm(!showForm)}
            className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl font-bold hover:bg-slate-50 transition-colors"
          >
            {showForm ? 'Cancel' : 'New Profile'}
          </button>
          {onNewInvestment && (
            <button 
              onClick={onNewInvestment}
              className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
            >
              <PlusCircle size={20} />
              Add Capital/Loan
            </button>
          )}
        </div>
      </div>

      {showForm && (
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm mb-6 animate-in fade-in slide-in-from-top-4">
          <h3 className="text-lg font-black text-slate-800 mb-6">Add New Investor / Lender</h3>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Full Name *</label>
                <input 
                  type="text"
                  {...register('name', { required: true })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="e.g. John Doe"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Type *</label>
                <select 
                  {...register('type', { required: true })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="Investor">Investor (Equity)</option>
                  <option value="Lender">Lender (Debt/Loan)</option>
                  <option value="Partner">Partner</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Company (Optional)</label>
                <input 
                  type="text"
                  {...register('company')}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="e.g. ABC Capital"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Phone (Optional)</label>
                <input 
                  type="text"
                  {...register('phone')}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-bold text-slate-700">Email (Optional)</label>
                <input 
                  type="email"
                  {...register('email')}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>
            <button 
              type="submit"
              disabled={mutation.isPending}
              className="w-full md:w-auto bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 disabled:opacity-50"
            >
              {mutation.isPending ? 'Saving...' : 'Save Profile'}
            </button>
          </form>
        </div>
      )}

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              placeholder="Search by name or company..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:border-indigo-400 transition-colors shadow-sm"
            />
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {isLoading ? (
            <div className="p-8 text-center text-slate-500">Loading...</div>
          ) : filtered.length > 0 ? (
            filtered.map((inv: any) => (
              <div 
                key={inv.id} 
                onClick={() => onInvestorSelect && onInvestorSelect(inv.id)}
                className={`p-4 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${onInvestorSelect ? 'cursor-pointer' : ''}`}
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center flex-shrink-0 text-indigo-600 font-black text-xl shadow-inner border border-indigo-100">
                    {inv.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-800 text-lg">{inv.name}</h4>
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-bold uppercase tracking-wider">
                        {inv.type}
                      </span>
                    </div>
                    {inv.company && (
                      <div className="flex items-center gap-1.5 text-sm font-medium text-slate-500 mt-1">
                        <Building2 size={14} /> {inv.company}
                      </div>
                    )}
                    <div className="flex items-center gap-4 mt-2">
                      {inv.phone && (
                        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                          <Phone size={12} /> {inv.phone}
                        </div>
                      )}
                      {inv.email && (
                        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                          <Mail size={12} /> {inv.email}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Added</span>
                  <div className="text-sm font-bold text-slate-700">{format(new Date(inv.created_at), 'dd MMM yyyy')}</div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-4">
                <Users className="text-slate-400" size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-1">No profiles found</h3>
              <p className="text-slate-500">Add an investor or lender to get started.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvestorManager;
