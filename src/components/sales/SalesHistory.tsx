import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/api';
import { Search, ExternalLink, Calendar, CheckCircle2, Clock, Edit } from 'lucide-react';
import { format } from 'date-fns';
import NewSale from './NewSale';

const SalesHistory = ({ onNavigateToPayments }: { onNavigateToPayments: (saleId: number) => void }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingSale, setEditingSale] = useState<any>(null);

  const { data: sales = [], isLoading } = useQuery({
    queryKey: ['sales'],
    queryFn: api.getSales
  });

  const filtered = sales.filter((s: any) => 
    s.customers?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.service_product?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (editingSale) {
    return (
      <NewSale 
        editData={editingSale}
        onComplete={() => setEditingSale(null)} 
        onCancel={() => setEditingSale(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Sales History</h2>
          <p className="text-slate-500 text-sm mt-1">View all completed and pending sales.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              placeholder="Search by customer, product, or category..."
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
                <th className="text-left text-xs font-bold text-slate-500 uppercase p-4">Customer</th>
                <th className="text-left text-xs font-bold text-slate-500 uppercase p-4">Sale Details</th>
                <th className="text-right text-xs font-bold text-slate-500 uppercase p-4">Amount</th>
                <th className="text-center text-xs font-bold text-slate-500 uppercase p-4">Status</th>
                <th className="text-right text-xs font-bold text-slate-500 uppercase p-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((sale: any) => (
                <tr key={sale.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-slate-400" />
                      {format(new Date(sale.created_at), 'dd MMM yyyy')}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="font-bold text-slate-800">{sale.customers?.name}</div>
                    <div className="text-xs text-slate-500">{sale.customers?.company}</div>
                  </td>
                  <td className="p-4">
                    <div className="text-sm font-bold text-slate-700">{sale.service_product}</div>
                    <div className="text-xs text-slate-500">{sale.category}</div>
                  </td>
                  <td className="p-4 text-sm font-black text-slate-800 text-right">
                    ₹{sale.final_amount?.toLocaleString('en-IN')}
                  </td>
                  <td className="p-4 text-center">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${
                      sale.status === 'Paid' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' :
                      sale.status === 'Partially Paid' ? 'bg-amber-50 text-amber-600 border border-amber-200' :
                      'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}>
                      {sale.status === 'Paid' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                      {sale.status}
                    </span>
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <button 
                      onClick={() => setEditingSale(sale)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-50 text-amber-600 hover:bg-amber-100 rounded-lg text-sm font-bold transition-colors"
                    >
                      <Edit size={14} /> Edit
                    </button>
                    <button 
                      onClick={() => onNavigateToPayments(sale.id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg text-sm font-bold transition-colors"
                    >
                      Payments <ExternalLink size={14} />
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">No sales found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SalesHistory;
