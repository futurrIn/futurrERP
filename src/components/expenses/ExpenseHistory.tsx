import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, supabase } from '../../api/api';
import { format } from 'date-fns';
import { 
  FileText, 
  Eye, 
  Download, 
  Clock, 
  CheckCircle2, 
  XCircle,
  Car,
  Coffee,
  Hotel,
  ShoppingBag,
  Trash2
} from 'lucide-react';

const ExpenseHistory = ({ onEdit }: any) => {
  const queryClient = useQueryClient();
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ['expenses'],
    queryFn: api.getExpenses
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from('expenses').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    }
  });

  const filteredExpenses = useMemo(() => {
    return expenses.filter((exp: any) => {
      // Filter by date
      if (dateFrom && new Date(exp.date) < new Date(dateFrom)) return false;
      if (dateTo && new Date(exp.date) > new Date(dateTo)) return false;

      return true;
    });
  }, [expenses, dateFrom, dateTo]);

  const handleExport = () => {
    if (filteredExpenses.length === 0) return alert('No data to export');

    const headers = ['Date', 'Employee Name', 'Email', 'Position', 'Total Amount', 'Trips Count', 'Meals', 'Accommodation', 'Purchase', 'Status'];
    const rows = filteredExpenses.map((exp: any) => [
      format(new Date(exp.date), 'yyyy-MM-dd HH:mm'),
      exp.employeeName || 'N/A',
      exp.employeeEmail || 'N/A',
      exp.employeeJobPosition || 'N/A',
      exp.totalAmount,
      exp.trips?.length || 0,
      exp.foodType?.join(', ') || 'None',
      exp.accommodationAmount,
      exp.purchaseItem || 'None',
      exp.status
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row: any[]) => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `Expense_Report_${format(new Date(), 'yyyyMMdd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved': return 'text-emerald-600 bg-emerald-50';
      case 'Rejected': return 'text-red-600 bg-red-50';
      default: return 'text-amber-600 bg-amber-50';
    }
  };

  const getIcon = (type: string) => {
    if (['Public', 'Private', 'Trips'].includes(type)) return <Car size={16} />;
    return <FileText size={16} />;
  };

  if (isLoading) {
    return <div className="flex justify-center p-12"><Clock className="animate-spin text-slate-300" size={32} /></div>;
  }

  return (
    <div className="space-y-4 md:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 px-4 md:px-0">
      {/* Filters Bar */}
      <div className="bg-white p-4 md:p-6 rounded-2xl md:rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-stretch md:items-end">
        <div className="grid grid-cols-2 gap-3 flex-1">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">From Date</label>
            <input 
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none text-xs font-semibold"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">To Date</label>
            <input 
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none text-xs font-semibold"
            />
          </div>
        </div>

        <button 
          onClick={handleExport}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition-all active:scale-95 shadow-lg shadow-emerald-100"
        >
          <Download size={18} />
          Export CSV
        </button>
      </div>

      {/* Mobile Card View (shown only on small screens) */}
      <div className="md:hidden space-y-3">
        {filteredExpenses.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400 text-sm">
            No matching expenses found.
          </div>
        ) : (
          filteredExpenses.map((exp: any) => (
            <div key={exp.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="text-sm font-black text-slate-800">{format(new Date(exp.date), 'dd MMM, yyyy')}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">{exp.type || 'Expense'}</p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider ${getStatusColor(exp.status)}`}>
                  {exp.status}
                </span>
              </div>
              
              <div className="space-y-2 mb-4">
                <p className="text-xs text-slate-600 font-medium line-clamp-1">
                  {exp.trips?.length > 0 
                    ? `${exp.trips.length} Trip(s): ${exp.trips[0].from} → ${exp.trips[0].to}`
                    : exp.foodType?.length > 0
                      ? `Food: ${exp.foodType.join(', ')}`
                      : exp.purchaseItem || 'General Expense'}
                </p>
                <p className="text-lg font-black text-indigo-600">₹{exp.totalAmount.toLocaleString()}</p>
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-slate-50">
                <button 
                  onClick={() => onEdit(exp)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-slate-50 text-slate-600 rounded-xl text-xs font-bold"
                >
                  <FileText size={14} />
                  Edit
                </button>
                {exp.billUrl && (
                  <a 
                    href={exp.billUrl} 
                    target="_blank" 
                    rel="noreferrer"
                    className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl"
                  >
                    <Eye size={16} />
                  </a>
                )}
                <button 
                  onClick={() => {
                    if (confirm('Delete this claim?')) deleteMutation.mutate(exp.id);
                  }}
                  className="p-2.5 bg-red-50 text-red-500 rounded-xl"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Table View (hidden on small screens) */}
      <div className="hidden md:block bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Details</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">No matching expenses found.</td>
                </tr>
              ) : (
                filteredExpenses.map((exp: any) => (
                  <tr key={exp.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm font-bold text-slate-800">{format(new Date(exp.date), 'dd MMM, yyyy')}</p>
                      <p className="text-[10px] text-slate-400 font-medium">{format(new Date(exp.date), 'hh:mm a')}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                          {getIcon(exp.type || 'Travel')}
                        </div>
                        <span className="text-sm font-semibold text-slate-700">{exp.type || 'Expense'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs text-slate-600 font-medium truncate max-w-[200px]">
                        {exp.trips?.length > 0 
                          ? `${exp.trips.length} Trip(s): ${exp.trips[0].from} → ${exp.trips[0].to}`
                          : exp.foodType?.length > 0
                            ? `Food: ${exp.foodType.join(', ')}`
                            : exp.purchaseItem || 'General Expense'}
                      </p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-bold text-slate-800">
                      ₹{exp.totalAmount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusColor(exp.status)}`}>
                        {exp.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => onEdit(exp)}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                          title="Edit"
                        >
                          <FileText size={18} />
                        </button>
                        {exp.billUrl && (
                          <a 
                            href={exp.billUrl} 
                            target="_blank" 
                            rel="noreferrer"
                            className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                            title="View Bill"
                          >
                            <Eye size={18} />
                          </a>
                        )}
                        <button 
                          onClick={() => {
                            if (confirm('Delete this claim?')) deleteMutation.mutate(exp.id);
                          }}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          title="Delete"
                        >
                          <Trash2 size={18} />
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

export default ExpenseHistory;
