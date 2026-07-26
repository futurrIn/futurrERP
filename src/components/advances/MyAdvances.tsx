import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/api';
import { Wallet, RefreshCcw } from 'lucide-react';
import { format } from 'date-fns';

const MyAdvances = () => {
  const { data: advances, isLoading } = useQuery({
    queryKey: ['my-advances'],
    queryFn: api.getMyAdvances
  });

  if (isLoading) return <div className="p-8 text-center"><RefreshCcw className="animate-spin mx-auto text-indigo-600" /></div>;

  const totalAdvance = advances?.reduce((sum: number, a: any) => sum + (a.amount || 0), 0) || 0;
  const remainingBalance = advances?.reduce((sum: number, a: any) => sum + (a.remaining_amount || 0), 0) || 0;
  const totalSettled = advances?.filter((a: any) => a.status === 'Settled').length || 0;
  const pendingCount = advances?.filter((a: any) => a.remaining_amount > 0 && a.status !== 'Cancelled').length || 0;

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
      <div>
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Wallet className="text-indigo-600" /> My Advances
        </h2>
        <p className="text-slate-500 text-sm mt-1">Track company money transferred to you for future expenses.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-sm font-bold text-slate-500 uppercase">Total Advance</p>
          <p className="text-3xl font-black text-slate-800 mt-2">₹{totalAdvance.toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-orange-100 rounded-bl-full -z-0" />
          <p className="text-sm font-bold text-slate-500 uppercase relative z-10">Remaining Balance</p>
          <p className="text-3xl font-black text-orange-600 mt-2 relative z-10">₹{remainingBalance.toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-sm font-bold text-slate-500 uppercase">Total Settled</p>
          <p className="text-3xl font-black text-emerald-600 mt-2">{totalSettled}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-sm font-bold text-slate-500 uppercase">Pending Settlement</p>
          <p className="text-3xl font-black text-indigo-600 mt-2">{pendingCount}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mt-8">
        <div className="p-6 border-b border-slate-100">
          <h3 className="font-bold text-slate-800 text-lg">Recent Advances</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left text-xs font-bold text-slate-500 uppercase p-4">Date</th>
                <th className="text-left text-xs font-bold text-slate-500 uppercase p-4">Purpose</th>
                <th className="text-left text-xs font-bold text-slate-500 uppercase p-4">Project</th>
                <th className="text-right text-xs font-bold text-slate-500 uppercase p-4">Amount</th>
                <th className="text-right text-xs font-bold text-slate-500 uppercase p-4">Remaining</th>
                <th className="text-center text-xs font-bold text-slate-500 uppercase p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {advances?.map((adv: any) => (
                <tr key={adv.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 text-sm text-slate-600 font-medium">{format(new Date(adv.transfer_date), 'dd MMM yyyy')}</td>
                  <td className="p-4 text-sm font-bold text-slate-800">{adv.purpose}</td>
                  <td className="p-4 text-sm text-slate-500">{adv.project_id || '-'}</td>
                  <td className="p-4 text-sm font-bold text-slate-800 text-right">₹{adv.amount.toLocaleString('en-IN')}</td>
                  <td className="p-4 text-sm font-black text-orange-600 text-right">₹{adv.remaining_amount.toLocaleString('en-IN')}</td>
                  <td className="p-4 text-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${getStatusColor(adv.status)}`}>
                      {adv.status}
                    </span>
                  </td>
                </tr>
              ))}
              {(!advances || advances.length === 0) && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500 font-medium">No advances found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MyAdvances;
