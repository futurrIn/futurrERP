import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Trash2, 
  Pencil,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileSpreadsheet,
  LogOut
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/api';
import ReceiptTemplate from './ReceiptTemplate';

interface ReceiptHistoryProps {
  onEdit: (receipt: any) => void;
}

const ReceiptHistory: React.FC<ReceiptHistoryProps> = ({ onEdit }) => {
  const formatDate = (dateValue: any, formatStr: string) => {
    try {
      if (!dateValue) return 'N/A';
      const d = new Date(dateValue);
      return isNaN(d.getTime()) ? 'N/A' : format(d, formatStr);
    } catch (err) {
      return 'N/A';
    }
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState<any | null>(null);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [selectedCategory, setSelectedCategory] = useState('All');
  const queryClient = useQueryClient();
  
  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: api.getSettings
  });

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: api.getProfile
  });

  const { data: allReceipts = [], isLoading } = useQuery({
    queryKey: ['receipts'],
    queryFn: api.getReceipts
  });

  const receipts = useMemo(() => {
    let results = [...allReceipts];

    // Apply Search Filter
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      results = results.filter(r => 
        r.studentName.toLowerCase().includes(lowerSearch) || 
        r.receiptNumber.toLowerCase().includes(lowerSearch)
      );
    }

    // Apply Category Filter
    if (selectedCategory !== 'All') {
      results = results.filter(r => r.category === selectedCategory);
    }

    // Apply Date Range Filter
    if (dateRange.start) {
      const start = new Date(dateRange.start);
      start.setHours(0, 0, 0, 0);
      results = results.filter(r => new Date(r.date) >= start);
    }
    if (dateRange.end) {
      const end = new Date(dateRange.end);
      end.setHours(23, 59, 59, 999);
      results = results.filter(r => new Date(r.date) <= end);
    }

    return results;
  }, [allReceipts, searchTerm, selectedCategory, dateRange]);

  const deleteMutation = useMutation({
    mutationFn: api.deleteReceipt,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
    }
  });

  const deleteReceipt = async (id: number) => {
    if (confirm('Are you sure you want to delete this receipt?')) {
      deleteMutation.mutate(id);
    }
  };

  const exportToCSV = () => {
    if (!receipts || !settings) return;
    
    const headers = ['Receipt #', 'Date', 'Month', 'Year', 'Student Name', 'Category', 'Course Name', 'Amount (₹)', 'Payment Method', 'Transaction ID', 'Email', 'Phone'];
    const csvData = receipts.map(r => [
      r.receiptNumber,
      format(new Date(r.date), 'dd-MM-yyyy'),
      format(new Date(r.date), 'MMMM'),
      format(new Date(r.date), 'yyyy'),
      r.studentName,
      r.category,
      r.courseName,
      r.amount,
      r.paymentMethod,
      r.transactionId || 'N/A',
      r.email,
      r.phone
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${settings.companyName}-Filtered-Report-${format(new Date(), 'dd-MMM-yyyy')}.csv`;
    link.click();
  };

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('All');
    setDateRange({ start: '', end: '' });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      {/* Header & Main Search */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <h2 className="text-2xl font-bold text-slate-800">History & Reports</h2>
        <div className="flex gap-2 w-full sm:w-auto">
          <button onClick={exportToCSV} className="btn-primary flex items-center gap-2 flex-1 sm:flex-none justify-center">
            <FileSpreadsheet size={18} />
            Export Filtered Data
          </button>
        </div>
      </div>

      {/* Advanced Filters Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Name or Receipt #..." 
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm"
              />
            </div>
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Service / Category</label>
            <select 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm appearance-none"
            >
              <option value="All">All Services</option>
              {settings?.categories.map((cat: string) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* From Date */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">From Date</label>
            <input 
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm"
            />
          </div>

          {/* To Date */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">To Date</label>
            <input 
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button 
            onClick={resetFilters}
            className="text-xs font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest flex items-center gap-1.5"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {receipts?.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-500 text-sm">
            No receipts found.
          </div>
        ) : (
          receipts?.map((receipt) => (
            <div key={receipt.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="font-black text-slate-800">{receipt.receiptNumber}</p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase">{formatDate(receipt.date, 'MMM d, yyyy')}</p>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-600">
                  {receipt.paymentMethod}
                </span>
              </div>
              
              <div className="space-y-1 mb-4">
                <p className="text-sm font-bold text-slate-700">{receipt.studentName}</p>
                <p className="text-xs text-slate-500">{receipt.courseName} ({receipt.category})</p>
                <p className="text-lg font-black text-emerald-600 pt-1">₹{receipt.amount.toLocaleString()}</p>
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-slate-50">
                <button 
                  onClick={() => setSelectedReceipt(receipt)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold"
                >
                  <Eye size={14} />
                  View
                </button>
                <button 
                  onClick={() => onEdit(receipt)}
                  className="p-2.5 bg-amber-50 text-amber-600 rounded-xl"
                >
                  <Pencil size={16} />
                </button>
                <button 
                  onClick={() => deleteReceipt(receipt.id!)}
                  className="p-2.5 bg-rose-50 text-rose-500 rounded-xl"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Receipt Info</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Student Details</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Program</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Amount</th>
                {profile?.role === 'Admin' && (
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Generated By</th>
                )}
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {receipts?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    No receipts found.
                  </td>
                </tr>
              ) : (
                receipts?.map((receipt) => (
                  <tr key={receipt.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-800">{receipt.receiptNumber}</p>
                      <p className="text-xs text-slate-500">{formatDate(receipt.date, 'MMM d, yyyy')}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium">{receipt.studentName}</p>
                      <p className="text-xs text-slate-500">{receipt.email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium">{receipt.courseName}</p>
                      <p className="text-xs text-slate-500">{receipt.category}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-800">₹{receipt.amount.toLocaleString()}</p>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-600 uppercase tracking-wider mt-1">
                        {receipt.paymentMethod}
                      </span>
                    </td>
                    {profile?.role === 'Admin' && (
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-slate-700">{receipt.creatorName || 'Unknown'}</p>
                        <p className="text-xs text-slate-400">{receipt.creatorRole || 'Unknown'}</p>
                      </td>
                    )}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => setSelectedReceipt(receipt)}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="View"
                        >
                          <Eye size={18} />
                        </button>
                        <button 
                          onClick={() => onEdit(receipt)}
                          className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Pencil size={18} />
                        </button>
                        <button 
                          onClick={() => deleteReceipt(receipt.id!)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
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

      {selectedReceipt && settings && (
        <ReceiptTemplate 
          receipt={selectedReceipt} 
          settings={settings} 
          onClose={() => setSelectedReceipt(null)} 
        />
      )}
    </div>
  );
};

export default ReceiptHistory;
