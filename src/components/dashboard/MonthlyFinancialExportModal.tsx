import React, { useState, useMemo } from 'react';
import { 
  X, 
  FileSpreadsheet, 
  Download, 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  CheckCircle2, 
  Filter,
  DollarSign
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import * as XLSX from 'xlsx';
import { toast } from 'react-hot-toast';

interface MonthlyFinancialExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  payments: any[];
  teamExpenses: any[];
  sales?: any[];
  allAdvances?: any[];
  capital?: any[];
}

export const MonthlyFinancialExportModal: React.FC<MonthlyFinancialExportModalProps> = ({
  isOpen,
  onClose,
  payments = [],
  teamExpenses = [],
  sales = [],
  allAdvances = [],
  capital = []
}) => {
  const [selectedMonth, setSelectedMonth] = useState<string>('all'); // 'all' or 'YYYY-MM'
  const [statusFilter, setStatusFilter] = useState<'approved' | 'all'>('approved');
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Helper to safely parse dates
  const parseItemDate = (item: any): Date => {
    const raw = item?.date || item?.createdAt || item?.created_at;
    if (!raw) return new Date();
    try {
      return typeof raw === 'string' ? parseISO(raw) : new Date(raw);
    } catch {
      return new Date();
    }
  };

  // Discover all unique months present across payments and expenses
  const availableMonths = useMemo(() => {
    const monthSet = new Set<string>();

    payments.forEach(p => {
      const d = parseItemDate(p);
      if (!isNaN(d.getTime())) {
        monthSet.add(format(d, 'yyyy-MM'));
      }
    });

    teamExpenses.forEach(e => {
      const d = parseItemDate(e);
      if (!isNaN(d.getTime())) {
        monthSet.add(format(d, 'yyyy-MM'));
      }
    });

    return Array.from(monthSet)
      .sort((a, b) => b.localeCompare(a))
      .map(ym => {
        const [year, month] = ym.split('-');
        const dateObj = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
        return {
          key: ym,
          label: format(dateObj, 'MMMM yyyy')
        };
      });
  }, [payments, teamExpenses]);

  // Filtered dataset according to user's month & status criteria
  const filteredData = useMemo(() => {
    const matchesMonth = (itemDate: Date) => {
      if (selectedMonth === 'all') return true;
      return format(itemDate, 'yyyy-MM') === selectedMonth;
    };

    // Filter Payments
    const validPayments = payments.filter(p => matchesMonth(parseItemDate(p)));

    // Filter Expenses
    const validExpenses = teamExpenses.filter(e => {
      const matchesDate = matchesMonth(parseItemDate(e));
      if (!matchesDate) return false;
      if (statusFilter === 'approved') {
        return e.status === 'Approved';
      }
      return true;
    });

    // Filter Advances
    const validAdvances = allAdvances.filter(a => matchesMonth(parseItemDate(a)));

    // Filter Capital
    const validCapital = capital.filter(c => matchesMonth(parseItemDate(c)));

    const totalInflow = validPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const totalOutflow = validExpenses.reduce((sum, e) => sum + (Number(e.totalAmount) || 0), 0);
    const netProfit = totalInflow - totalOutflow;

    return {
      payments: validPayments,
      expenses: validExpenses,
      advances: validAdvances,
      capital: validCapital,
      totalInflow,
      totalOutflow,
      netProfit,
      claimsCount: validExpenses.length,
      revenueCount: validPayments.length
    };
  }, [payments, teamExpenses, allAdvances, capital, selectedMonth, statusFilter]);

  const handleExportExcel = () => {
    try {
      setIsExporting(true);
      const wb = XLSX.utils.book_new();

      const monthLabel = selectedMonth === 'all' 
        ? 'All-Months' 
        : format(new Date(parseInt(selectedMonth.split('-')[0]), parseInt(selectedMonth.split('-')[1]) - 1, 1), 'MMM-yyyy');

      // -------------------------------------------------------------
      // SHEET 1: Monthly Financial Summary (Month by Month)
      // -------------------------------------------------------------
      const monthlySummaryMap: Record<string, {
        monthKey: string;
        monthLabel: string;
        inflow: number;
        outflow: number;
        capital: number;
        advances: number;
        claimsCount: number;
      }> = {};

      // Seed available months (or selected month)
      const targetMonths = selectedMonth === 'all' 
        ? availableMonths 
        : availableMonths.filter(m => m.key === selectedMonth);

      targetMonths.forEach(m => {
        monthlySummaryMap[m.key] = {
          monthKey: m.key,
          monthLabel: m.label,
          inflow: 0,
          outflow: 0,
          capital: 0,
          advances: 0,
          claimsCount: 0
        };
      });

      // Populate from filtered datasets
      filteredData.payments.forEach(p => {
        const key = format(parseItemDate(p), 'yyyy-MM');
        if (monthlySummaryMap[key]) {
          monthlySummaryMap[key].inflow += Number(p.amount) || 0;
        }
      });

      filteredData.expenses.forEach(e => {
        const key = format(parseItemDate(e), 'yyyy-MM');
        if (monthlySummaryMap[key]) {
          monthlySummaryMap[key].outflow += Number(e.totalAmount) || 0;
          monthlySummaryMap[key].claimsCount += 1;
        }
      });

      filteredData.capital.forEach(c => {
        const key = format(parseItemDate(c), 'yyyy-MM');
        if (monthlySummaryMap[key]) {
          monthlySummaryMap[key].capital += Number(c.amount) || 0;
        }
      });

      filteredData.advances.forEach(a => {
        const key = format(parseItemDate(a), 'yyyy-MM');
        if (monthlySummaryMap[key]) {
          monthlySummaryMap[key].advances += Number(a.amount || a.remaining_amount) || 0;
        }
      });

      const summaryRows = Object.values(monthlySummaryMap)
        .sort((a, b) => b.monthKey.localeCompare(a.monthKey))
        .map(row => {
          const net = row.inflow - row.outflow;
          const margin = row.inflow > 0 ? ((net / row.inflow) * 100).toFixed(1) + '%' : '0.0%';
          return {
            'Financial Month': row.monthLabel,
            'Total Inflow / Revenue (₹)': Math.round(row.inflow),
            'Total Expenses (₹)': Math.round(row.outflow),
            'Net Profit / Balance (₹)': Math.round(net),
            'Profit Margin': margin,
            'Capital Injected (₹)': Math.round(row.capital),
            'Advances Issued (₹)': Math.round(row.advances),
            'Expense Claims Count': row.claimsCount
          };
        });

      // Append Total Summary row
      const totalInflowAll = summaryRows.reduce((sum, r) => sum + r['Total Inflow / Revenue (₹)'], 0);
      const totalOutflowAll = summaryRows.reduce((sum, r) => sum + r['Total Expenses (₹)'], 0);
      const totalNetAll = totalInflowAll - totalOutflowAll;
      const totalMarginAll = totalInflowAll > 0 ? ((totalNetAll / totalInflowAll) * 100).toFixed(1) + '%' : '0.0%';

      summaryRows.push({
        'Financial Month': 'TOTAL CUMULATIVE',
        'Total Inflow / Revenue (₹)': totalInflowAll,
        'Total Expenses (₹)': totalOutflowAll,
        'Net Profit / Balance (₹)': totalNetAll,
        'Profit Margin': totalMarginAll,
        'Capital Injected (₹)': summaryRows.reduce((sum, r) => sum + r['Capital Injected (₹)'], 0),
        'Advances Issued (₹)': summaryRows.reduce((sum, r) => sum + r['Advances Issued (₹)'], 0),
        'Expense Claims Count': summaryRows.reduce((sum, r) => sum + r['Expense Claims Count'], 0)
      });

      const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
      wsSummary['!cols'] = [
        { wch: 22 }, // Financial Month
        { wch: 26 }, // Total Inflow
        { wch: 22 }, // Total Expenses
        { wch: 25 }, // Net Profit
        { wch: 16 }, // Margin
        { wch: 22 }, // Capital
        { wch: 22 }, // Advances
        { wch: 22 }, // Claims Count
      ];
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Monthly Financials');

      // -------------------------------------------------------------
      // SHEET 2: Employee Expenses (Monthly Basis)
      // -------------------------------------------------------------
      const empMonthlyMap: Record<string, {
        month: string;
        employeeName: string;
        department: string;
        role: string;
        travelTotal: number;
        foodStayTotal: number;
        purchasesTotal: number;
        grandTotal: number;
        claimsCount: number;
        statusSet: Set<string>;
      }> = {};

      filteredData.expenses.forEach(exp => {
        const d = parseItemDate(exp);
        const monthKey = format(d, 'MMMM yyyy');
        const empName = exp.employee?.fullName || 'Unassigned / Staff';
        const groupKey = `${monthKey}_${empName}`;

        if (!empMonthlyMap[groupKey]) {
          empMonthlyMap[groupKey] = {
            month: monthKey,
            employeeName: empName,
            department: exp.employee?.department || 'Operations',
            role: exp.employee?.role || 'Team Member',
            travelTotal: 0,
            foodStayTotal: 0,
            purchasesTotal: 0,
            grandTotal: 0,
            claimsCount: 0,
            statusSet: new Set()
          };
        }

        const entry = empMonthlyMap[groupKey];
        entry.claimsCount += 1;
        entry.statusSet.add(exp.status || 'Pending');

        // Sum trip allowances
        const tripsSum = (exp.trips || []).reduce((sum: number, t: any) => sum + (Number(t.amount) || 0), 0);
        entry.travelTotal += tripsSum;

        // Sum food + accommodation
        const foodStaySum = (Number(exp.foodAmount) || 0) + (Number(exp.accommodationAmount) || 0);
        entry.foodStayTotal += foodStaySum;

        // Sum purchases
        const purchasesSum = (exp.purchases || []).reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0);
        entry.purchasesTotal += purchasesSum;

        entry.grandTotal += Number(exp.totalAmount) || 0;
      });

      const empMonthlyRows = Object.values(empMonthlyMap)
        .sort((a, b) => a.month.localeCompare(b.month) || b.grandTotal - a.grandTotal)
        .map(row => ({
          'Month': row.month,
          'Employee Name': row.employeeName,
          'Department': row.department,
          'Role': row.role,
          'Travel / Mileage (₹)': Math.round(row.travelTotal),
          'Food & Stay (₹)': Math.round(row.foodStayTotal),
          'Purchases / Vendors (₹)': Math.round(row.purchasesTotal),
          'Total Reimbursed / Claimed (₹)': Math.round(row.grandTotal),
          'Claims Filed': row.claimsCount,
          'Approval Status': Array.from(row.statusSet).join(', ')
        }));

      const wsEmpExpenses = XLSX.utils.json_to_sheet(empMonthlyRows);
      wsEmpExpenses['!cols'] = [
        { wch: 18 }, // Month
        { wch: 24 }, // Employee Name
        { wch: 18 }, // Department
        { wch: 18 }, // Role
        { wch: 22 }, // Travel
        { wch: 18 }, // Food & Stay
        { wch: 24 }, // Purchases
        { wch: 28 }, // Total
        { wch: 15 }, // Claims Filed
        { wch: 20 }, // Approval Status
      ];
      XLSX.utils.book_append_sheet(wb, wsEmpExpenses, 'Employee Monthly Expenses');

      // -------------------------------------------------------------
      // SHEET 3: Detailed Expense Claims Ledger
      // -------------------------------------------------------------
      const detailedClaimRows = filteredData.expenses.map(exp => {
        const d = parseItemDate(exp);
        const tripsCount = (exp.trips || []).length;
        const purchasesCount = (exp.purchases || []).length;

        return {
          'Claim ID': `#${exp.id}`,
          'Date Filed': format(d, 'yyyy-MM-dd'),
          'Month': format(d, 'MMM yyyy'),
          'Employee': exp.employee?.fullName || 'Unassigned',
          'Department': exp.employee?.department || 'Operations',
          'Role': exp.employee?.role || 'Staff',
          'Food (₹)': Number(exp.foodAmount) || 0,
          'Stay (₹)': Number(exp.accommodationAmount) || 0,
          'Trips Count': tripsCount,
          'Purchases Count': purchasesCount,
          'Total Amount (₹)': Number(exp.totalAmount) || 0,
          'Advance Adjusted': exp.advance_id ? `Advance #${exp.advance_id}` : 'None',
          'Status': exp.status || 'Pending'
        };
      });

      const wsClaims = XLSX.utils.json_to_sheet(detailedClaimRows);
      wsClaims['!cols'] = [
        { wch: 12 }, // Claim ID
        { wch: 14 }, // Date
        { wch: 14 }, // Month
        { wch: 24 }, // Employee
        { wch: 18 }, // Department
        { wch: 16 }, // Role
        { wch: 14 }, // Food
        { wch: 14 }, // Stay
        { wch: 14 }, // Trips
        { wch: 16 }, // Purchases
        { wch: 18 }, // Total
        { wch: 18 }, // Advance Adjusted
        { wch: 14 }, // Status
      ];
      XLSX.utils.book_append_sheet(wb, wsClaims, 'Claims Ledger');

      // -------------------------------------------------------------
      // SHEET 4: Revenue & Receipts Ledger
      // -------------------------------------------------------------
      const revenueRows = filteredData.payments.map(p => {
        const d = parseItemDate(p);
        // Find matched sale if available
        const matchedSale = sales.find(s => s.id === p.sale_id);
        const customerName = matchedSale?.customers?.name || matchedSale?.customer_name || 'Direct Client';
        const projectTitle = matchedSale?.service_product || matchedSale?.category || 'Standard Service';

        return {
          'Payment ID': `#${p.id}`,
          'Date': format(d, 'yyyy-MM-dd'),
          'Month': format(d, 'MMM yyyy'),
          'Receipt No': p.receipt_number || 'N/A',
          'Customer': customerName,
          'Project / Service': projectTitle,
          'Amount Received (₹)': Number(p.amount) || 0,
          'Payment Method': p.payment_method || 'Bank Transfer',
          'Reference No / UTR': p.transaction_id || p.reference_number || 'N/A'
        };
      });

      const wsRevenue = XLSX.utils.json_to_sheet(revenueRows);
      wsRevenue['!cols'] = [
        { wch: 14 }, // Payment ID
        { wch: 14 }, // Date
        { wch: 14 }, // Month
        { wch: 18 }, // Receipt No
        { wch: 24 }, // Customer
        { wch: 24 }, // Project
        { wch: 22 }, // Amount Received
        { wch: 18 }, // Method
        { wch: 22 }, // Reference
      ];
      XLSX.utils.book_append_sheet(wb, wsRevenue, 'Revenue & Receipts');

      // Trigger file download
      const filename = `Futurr_Financial_Report_${monthLabel}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
      XLSX.writeFile(wb, filename);

      toast.success(`Exported complete multi-tab report: ${filename}`);
      onClose();
    } catch (err: any) {
      console.error('Failed to export Excel report:', err);
      toast.error('Failed to export report: ' + (err?.message || 'Unknown error'));
    } finally {
      setIsExporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
              <FileSpreadsheet size={22} className="text-white" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight text-white">Monthly Financial &amp; Expense Report</h3>
              <p className="text-xs text-emerald-100 font-medium">Executive &amp; Accountant Excel Export</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/20 text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Controls: Month Selection & Expense Scope */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                <Calendar size={14} className="text-emerald-600" /> Financial Period:
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
              >
                <option value="all">All Months (Complete Financial History)</option>
                {availableMonths.map(m => (
                  <option key={m.key} value={m.key}>{m.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                <Filter size={14} className="text-emerald-600" /> Expense Status Scope:
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
              >
                <option value="approved">Approved Claims Only (Realized Financials)</option>
                <option value="all">All Claims (Including Pending &amp; Under Review)</option>
              </select>
            </div>
          </div>

          {/* Quick Metrics Preview of the export */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 block">
              Live Export Snapshot ({selectedMonth === 'all' ? 'All Months' : availableMonths.find(m => m.key === selectedMonth)?.label}):
            </span>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
                <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 uppercase mb-1">
                  <TrendingUp size={12} /> Revenue Inflow
                </div>
                <div className="text-base font-black text-slate-900 font-mono">
                  ₹{filteredData.totalInflow.toLocaleString('en-IN')}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {filteredData.revenueCount} payments
                </div>
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
                <div className="flex items-center gap-1 text-[10px] font-bold text-rose-600 uppercase mb-1">
                  <TrendingDown size={12} /> Total Outflow
                </div>
                <div className="text-base font-black text-slate-900 font-mono">
                  ₹{filteredData.totalOutflow.toLocaleString('en-IN')}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {filteredData.claimsCount} claims
                </div>
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
                <div className="flex items-center gap-1 text-[10px] font-bold text-indigo-600 uppercase mb-1">
                  <DollarSign size={12} /> Net Profit
                </div>
                <div className={`text-base font-black font-mono ${filteredData.netProfit >= 0 ? 'text-indigo-700' : 'text-rose-600'}`}>
                  ₹{filteredData.netProfit.toLocaleString('en-IN')}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {filteredData.totalInflow > 0 
                    ? `${((filteredData.netProfit / filteredData.totalInflow) * 100).toFixed(1)}% margin`
                    : '0% margin'}
                </div>
              </div>
            </div>
          </div>

          {/* Included Sheets Specification */}
          <div className="space-y-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 block">
              Included Excel Worksheets:
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2 text-slate-700 font-semibold">
                <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                <span>1. Monthly Financials</span>
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2 text-slate-700 font-semibold">
                <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                <span>2. Employee Monthly Expenses</span>
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2 text-slate-700 font-semibold">
                <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                <span>3. Claims Ledger</span>
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2 text-slate-700 font-semibold">
                <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                <span>4. Revenue &amp; Receipts</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <div className="text-xs text-slate-500 font-medium">
            Strictly authorized for <span className="font-bold text-slate-700">Accountant &amp; Owner</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isExporting}
              onClick={handleExportExcel}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-md shadow-emerald-700/20 transition-all disabled:opacity-50"
            >
              <Download size={15} />
              <span>{isExporting ? 'Generating...' : 'Download Excel (.xlsx)'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonthlyFinancialExportModal;
