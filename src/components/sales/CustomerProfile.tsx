import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/api';
import { ArrowLeft, User, Phone, Mail, Building2, GraduationCap, Building, Briefcase, FileText, CheckCircle2, IndianRupee, Clock, Calendar } from 'lucide-react';
import { format } from 'date-fns';

const CustomerProfile = ({ customerId, onBack }: { customerId: number, onBack: () => void }) => {
  const [activeTab, setActiveTab] = useState('overview');

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: api.getCustomers
  });

  const { data: allSales = [] } = useQuery({
    queryKey: ['sales'],
    queryFn: api.getSales
  });

  const { data: allPayments = [] } = useQuery({
    queryKey: ['payments'],
    queryFn: () => api.getPayments()
  });

  const customer = customers.find((c: any) => c.id === customerId);
  
  if (!customer) {
    return <div className="p-8 text-center text-slate-500">Loading customer profile...</div>;
  }

  const sales = allSales.filter((s: any) => s.customer_id === customerId);
  const saleIds = sales.map((s: any) => s.id);
  const payments = allPayments.filter((p: any) => saleIds.includes(p.sale_id));

  const totalRevenue = sales.reduce((sum: number, s: any) => sum + (s.final_amount || 0), 0);
  const totalPaid = payments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
  const outstanding = totalRevenue - totalPaid;

  const type = customer.customer_type || 'Individual';
  const df = customer.dynamic_fields || {};

  const getCategoryIcon = (type: string) => {
    switch(type) {
      case 'Student': return <GraduationCap size={24} className="text-blue-500" />;
      case 'Business / Company': return <Building2 size={24} className="text-emerald-500" />;
      case 'College / Institution': return <Building size={24} className="text-purple-500" />;
      default: return <User size={24} className="text-slate-500" />;
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'sales', label: 'Sales & Projects' },
    { id: 'financials', label: 'Financials' },
    { id: 'timeline', label: 'Activity Timeline' }
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={onBack}
          className="p-2 bg-white rounded-full border border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 transition-all shadow-sm"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
            {customer.name}
            <span className="text-sm font-bold px-3 py-1 bg-slate-100 text-slate-600 rounded-lg border border-slate-200 flex items-center gap-1.5">
              {getCategoryIcon(type)} {type}
            </span>
          </h2>
          <p className="text-slate-500 text-sm mt-1">{customer.company || 'Individual Profile'}</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-sm font-bold text-slate-500 mb-1 flex items-center gap-2">
            <IndianRupee size={16} className="text-emerald-500" /> Total Revenue
          </div>
          <div className="text-2xl font-black text-slate-800">₹{totalRevenue.toLocaleString('en-IN')}</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-sm font-bold text-slate-500 mb-1 flex items-center gap-2">
            <Clock size={16} className="text-amber-500" /> Outstanding
          </div>
          <div className="text-2xl font-black text-amber-600">₹{outstanding.toLocaleString('en-IN')}</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-sm font-bold text-slate-500 mb-1 flex items-center gap-2">
            <Briefcase size={16} className="text-indigo-500" /> Total Projects
          </div>
          <div className="text-2xl font-black text-slate-800">{sales.length}</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-sm font-bold text-slate-500 mb-1 flex items-center gap-2">
            <FileText size={16} className="text-purple-500" /> Payments Received
          </div>
          <div className="text-2xl font-black text-slate-800">{payments.length}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${
              activeTab === tab.id 
                ? 'bg-indigo-600 text-white shadow-md' 
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 md:p-8 min-h-[400px]">
        
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
                  <User size={18} className="text-indigo-500" /> Contact Information
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Phone size={18} className="text-slate-400 mt-0.5" />
                    <div>
                      <div className="text-xs font-bold text-slate-500">Phone</div>
                      <div className="text-slate-800 font-medium">{customer.phone || 'N/A'}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Mail size={18} className="text-slate-400 mt-0.5" />
                    <div>
                      <div className="text-xs font-bold text-slate-500">Email</div>
                      <div className="text-slate-800 font-medium">{customer.email || 'N/A'}</div>
                    </div>
                  </div>
                  {customer.gst && (
                    <div className="flex items-start gap-3">
                      <FileText size={18} className="text-slate-400 mt-0.5" />
                      <div>
                        <div className="text-xs font-bold text-slate-500">GST Number</div>
                        <div className="text-slate-800 font-medium uppercase">{customer.gst}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
                  {type === 'Student' ? <GraduationCap size={18} className="text-indigo-500" /> : <Building2 size={18} className="text-indigo-500" />}
                  {type} Details
                </h3>
                
                {/* Dynamic Fields Display */}
                {Object.keys(df).length > 0 ? (
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(df).map(([key, value]: [string, any]) => (
                      <div key={key} className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <div className="text-xs font-bold text-slate-500 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</div>
                        <div className="text-slate-800 font-medium mt-1 truncate" title={value}>{value || '-'}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-slate-500 text-sm italic p-4 bg-slate-50 rounded-xl">No additional {type.toLowerCase()} details available.</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* SALES TAB */}
        {activeTab === 'sales' && (
          <div className="space-y-4">
            <h3 className="text-lg font-black text-slate-800 mb-4">Sales & Projects</h3>
            {sales.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="text-left text-xs font-bold text-slate-500 uppercase p-4">Date</th>
                      <th className="text-left text-xs font-bold text-slate-500 uppercase p-4">Service / Product</th>
                      <th className="text-left text-xs font-bold text-slate-500 uppercase p-4">Category</th>
                      <th className="text-right text-xs font-bold text-slate-500 uppercase p-4">Amount</th>
                      <th className="text-center text-xs font-bold text-slate-500 uppercase p-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sales.map((sale: any) => (
                      <tr key={sale.id} className="hover:bg-slate-50">
                        <td className="p-4 text-sm text-slate-600">{format(new Date(sale.created_at), 'dd MMM yyyy')}</td>
                        <td className="p-4 font-bold text-slate-800">{sale.service_product}</td>
                        <td className="p-4 text-sm text-slate-500">{sale.category}</td>
                        <td className="p-4 text-sm font-black text-slate-800 text-right">₹{sale.final_amount?.toLocaleString('en-IN')}</td>
                        <td className="p-4 text-center">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${
                            sale.status === 'Paid' ? 'bg-emerald-50 text-emerald-600' :
                            sale.status === 'Partially Paid' ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {sale.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center p-8 text-slate-500">No sales records found for this customer.</div>
            )}
          </div>
        )}

        {/* FINANCIALS TAB */}
        {activeTab === 'financials' && (
          <div className="space-y-4">
            <h3 className="text-lg font-black text-slate-800 mb-4">Payment History</h3>
            {payments.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="text-left text-xs font-bold text-slate-500 uppercase p-4">Date</th>
                      <th className="text-left text-xs font-bold text-slate-500 uppercase p-4">Receipt No</th>
                      <th className="text-left text-xs font-bold text-slate-500 uppercase p-4">Project / Sale</th>
                      <th className="text-left text-xs font-bold text-slate-500 uppercase p-4">Method</th>
                      <th className="text-right text-xs font-bold text-slate-500 uppercase p-4">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {payments.map((p: any) => {
                      const relatedSale = sales.find((s:any) => s.id === p.sale_id);
                      return (
                        <tr key={p.id} className="hover:bg-slate-50">
                          <td className="p-4 text-sm text-slate-600">{format(new Date(p.created_at), 'dd MMM yyyy')}</td>
                          <td className="p-4 font-bold text-indigo-600">{p.receipt_number || '-'}</td>
                          <td className="p-4 text-sm font-medium text-slate-700">{relatedSale?.service_product || 'Unknown Sale'}</td>
                          <td className="p-4">
                            <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-md text-xs font-bold">{p.payment_method}</span>
                          </td>
                          <td className="p-4 text-sm font-black text-emerald-600 text-right">₹{p.amount?.toLocaleString('en-IN')}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center p-8 text-slate-500">No payment records found for this customer.</div>
            )}
          </div>
        )}

        {/* TIMELINE TAB */}
        {activeTab === 'timeline' && (
          <div className="space-y-4">
            <h3 className="text-lg font-black text-slate-800 mb-6">Activity Timeline</h3>
            <div className="relative border-l-2 border-slate-100 ml-4 space-y-8 pb-4">
              
              {/* Combine sales and payments, sort by date desc */}
              {[...sales.map((s:any) => ({...s, _type: 'sale'})), ...payments.map((p:any) => ({...p, _type: 'payment'}))]
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .map((item: any, idx) => (
                  <div key={`${item._type}-${item.id}-${idx}`} className="relative pl-8">
                    {item._type === 'sale' ? (
                      <>
                        <div className="absolute -left-[11px] top-1 w-5 h-5 rounded-full bg-indigo-100 border-2 border-white flex items-center justify-center">
                          <Briefcase size={10} className="text-indigo-600" />
                        </div>
                        <div className="bg-indigo-50/50 border border-indigo-100 p-4 rounded-xl">
                          <div className="text-xs font-bold text-indigo-500 mb-1">{format(new Date(item.created_at), 'dd MMM yyyy, h:mm a')}</div>
                          <div className="font-bold text-slate-800">New Project/Sale: {item.service_product}</div>
                          <div className="text-sm text-slate-600 mt-1">Amount: ₹{item.final_amount?.toLocaleString('en-IN')} ({item.category})</div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="absolute -left-[11px] top-1 w-5 h-5 rounded-full bg-emerald-100 border-2 border-white flex items-center justify-center">
                          <IndianRupee size={10} className="text-emerald-600" />
                        </div>
                        <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-xl">
                          <div className="text-xs font-bold text-emerald-500 mb-1">{format(new Date(item.created_at), 'dd MMM yyyy, h:mm a')}</div>
                          <div className="font-bold text-slate-800">Payment Received</div>
                          <div className="text-sm text-slate-600 mt-1">Amount: ₹{item.amount?.toLocaleString('en-IN')} via {item.payment_method}</div>
                        </div>
                      </>
                    )}
                  </div>
              ))}
              
              {sales.length === 0 && payments.length === 0 && (
                <div className="text-slate-500 italic pl-8">No activity recorded yet.</div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default CustomerProfile;
