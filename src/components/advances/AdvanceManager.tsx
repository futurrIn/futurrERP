import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/api';
import { 
  Wallet, 
  Search,
  PlusCircle,
  IndianRupee,
  RefreshCcw,
  CheckCircle2,
  XCircle,
  Eye,
  MoreVertical
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';

const AdvanceManager = ({ onNewAdvance }: { onNewAdvance: () => void }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();

  const { data: advances, isLoading } = useQuery({
    queryKey: ['all-advances'],
    queryFn: api.getAllAdvances
  });

  const returnMutation = useMutation({
    mutationFn: ({ id, amount }: { id: number, amount: number }) => api.recordAdvanceReturn(id, amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-advances'] });
      toast.success('Return recorded successfully');
    }
  });

  const closeMutation = useMutation({
    mutationFn: (id: number) => api.closeAdvance(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-advances'] });
      toast.success('Advance closed successfully');
    }
  });

  if (isLoading) return <div className="p-8 text-center"><RefreshCcw className="animate-spin mx-auto text-indigo-600" /></div>;

  const filtered = advances?.filter((a: any) => 
    a.employee?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.purpose?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const totalActive = advances?.filter((a: any) => a.status !== 'Settled' && a.status !== 'Cancelled').length || 0;
  const totalAmount = advances?.reduce((sum: number, a: any) => sum + (a.amount || 0), 0) || 0;
  const totalPending = advances?.reduce((sum: number, a: any) => sum + (a.remaining_amount || 0), 0) || 0;
  const totalSettledCount = advances?.filter((a: any) => a.status === 'Settled').length || 0;

  const handleReturn = (id: number, currentRemaining: number) => {
    const val = window.prompt(`Enter amount returned (Max: ${currentRemaining}):`);
    if (!val) return;
    const amount = Number(val);
    if (isNaN(amount) || amount <= 0 || amount > currentRemaining) {
      toast.error('Invalid amount');
      return;
    }
    returnMutation.mutate({ id, amount });
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Transferred': return 'bg-blue-100 text-blue-700';
      case 'Partially Settled': return 'bg-orange-100 text-orange-700';
      case 'Settled': return 'bg-green-100 text-green-700';
      case 'Cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Wallet className="text-indigo-600" /> Employee Advances
          </h2>
          <p className="text-slate-500 text-sm mt-1">Manage and track money transferred to employees.</p>
        </div>
        <button 
          onClick={onNewAdvance}
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
        >
          <PlusCircle size={20} />
          Transfer Advance
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-sm font-bold text-slate-500 uppercase">Active Advances</p>
          <p className="text-3xl font-black text-slate-800 mt-2">{totalActive}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-sm font-bold text-slate-500 uppercase">Pending Settlement</p>
          <p className="text-3xl font-black text-orange-600 mt-2">₹{totalPending.toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-sm font-bold text-slate-500 uppercase">Total Settled</p>
          <p className="text-3xl font-black text-emerald-600 mt-2">{totalSettledCount}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-sm font-bold text-slate-500 uppercase">Total Advanced</p>
          <p className="text-3xl font-black text-indigo-600 mt-2">₹{totalAmount.toLocaleString('en-IN')}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              placeholder="Search by employee or purpose..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-400 transition-colors"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left text-xs font-bold text-slate-500 uppercase p-4">Date</th>
                <th className="text-left text-xs font-bold text-slate-500 uppercase p-4">Employee</th>
                <th className="text-left text-xs font-bold text-slate-500 uppercase p-4">Purpose</th>
                <th className="text-right text-xs font-bold text-slate-500 uppercase p-4">Total Amount</th>
                <th className="text-right text-xs font-bold text-slate-500 uppercase p-4">Remaining</th>
                <th className="text-center text-xs font-bold text-slate-500 uppercase p-4">Status</th>
                <th className="text-right text-xs font-bold text-slate-500 uppercase p-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((adv: any) => (
                <tr key={adv.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 text-sm text-slate-600">{format(new Date(adv.transfer_date), 'dd MMM yyyy')}</td>
                  <td className="p-4">
                    <div className="font-bold text-slate-800">{adv.employee?.fullName || 'Unknown'}</div>
                    <div className="text-xs text-slate-500">{adv.employee?.department || ''}</div>
                  </td>
                  <td className="p-4 text-sm text-slate-700">{adv.purpose}</td>
                  <td className="p-4 text-sm font-bold text-slate-800 text-right">₹{adv.amount.toLocaleString('en-IN')}</td>
                  <td className="p-4 text-sm font-bold text-orange-600 text-right">₹{adv.remaining_amount.toLocaleString('en-IN')}</td>
                  <td className="p-4 text-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(adv.status)}`}>
                      {adv.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    {adv.remaining_amount > 0 && (
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleReturn(adv.id, adv.remaining_amount)}
                          className="text-xs font-bold text-blue-600 hover:bg-blue-50 px-2 py-1 rounded"
                        >
                          Record Return
                        </button>
                        <button 
                          onClick={() => {
                            if(window.confirm('Are you sure you want to close this advance? (Remaining balance will be written off)')) {
                              closeMutation.mutate(adv.id);
                            }
                          }}
                          className="text-xs font-bold text-red-600 hover:bg-red-50 px-2 py-1 rounded"
                        >
                          Close
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">No advances found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdvanceManager;
