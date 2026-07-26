import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/api';
import { format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { FileText, Download, Filter } from 'lucide-react';
import * as XLSX from 'xlsx';

const ReportsView = () => {
  const [reportType, setReportType] = useState('sales');
  const [dateRange, setDateRange] = useState('month'); // month, all

  const { data: sales = [] } = useQuery({ queryKey: ['sales'], queryFn: api.getSales });
  const { data: payments = [] } = useQuery({ queryKey: ['payments'], queryFn: () => api.getPayments() });

  // Filtering based on date
  const now = new Date();
  const start = startOfMonth(now);
  const end = endOfMonth(now);

  const filteredSales = sales.filter((s: any) => 
    dateRange === 'all' || isWithinInterval(new Date(s.created_at), { start, end })
  );

  const filteredPayments = payments.filter((p: any) => 
    dateRange === 'all' || isWithinInterval(new Date(p.created_at), { start, end })
  );

  const handleExport = () => {
    let exportData = [];
    if (reportType === 'sales') {
      exportData = filteredSales.map((s: any) => ({
        Date: format(new Date(s.created_at), 'dd MMM yyyy'),
        Customer: s.customers?.name,
        Category: s.category,
        Product: s.service_product,
        Amount: s.final_amount,
        Status: s.status
      }));
    } else {
      exportData = filteredPayments.map((p: any) => ({
        Date: format(new Date(p.created_at), 'dd MMM yyyy'),
        ReceiptNo: p.receipt_number,
        Amount: p.amount,
        Method: p.payment_method,
        Reference: p.transaction_id
      }));
    }

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, reportType === 'sales' ? 'Sales Report' : 'Payments Report');
    XLSX.writeFile(wb, `${reportType}-report-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <FileText className="text-indigo-600" /> Revenue Reports
          </h2>
          <p className="text-slate-500 text-sm mt-1">Generate and export financial reports.</p>
        </div>
        <button 
          onClick={handleExport}
          className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200"
        >
          <Download size={20} /> Export CSV / Excel
        </button>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4 items-center">
        <div className="flex items-center gap-2 font-bold text-slate-700">
          <Filter size={18} className="text-slate-400" /> Filters:
        </div>
        <select 
          value={reportType}
          onChange={(e) => setReportType(e.target.value)}
          className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20"
        >
          <option value="sales">Sales & Revenue</option>
          <option value="payments">Payments & Receipts</option>
        </select>
        <select 
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20"
        >
          <option value="month">This Month</option>
          <option value="all">All Time</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-8 text-center">
        <h3 className="text-xl font-bold text-slate-800 mb-2">
          {reportType === 'sales' ? 'Sales Report Preview' : 'Payments Report Preview'}
        </h3>
        <p className="text-slate-500 mb-6">
          Showing data for {dateRange === 'month' ? 'this month' : 'all time'}. 
          Found {reportType === 'sales' ? filteredSales.length : filteredPayments.length} records.
        </p>
        <button 
          onClick={handleExport}
          className="bg-indigo-50 text-indigo-600 px-6 py-3 rounded-xl font-bold hover:bg-indigo-100 transition-colors"
        >
          Download Full Report
        </button>
      </div>
    </div>
  );
};

export default ReportsView;
