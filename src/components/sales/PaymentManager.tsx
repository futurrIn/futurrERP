import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/api';
import { format } from 'date-fns';
import { CreditCard, Download, PlusCircle, CheckCircle2, X, Edit } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import ReceiptTemplate from '../receipt/ReceiptTemplate';

const PAYMENT_METHODS = ['UPI', 'Cash', 'Bank Transfer', 'Razorpay', 'Card', 'Other'];

const PaymentManager = ({ defaultSaleId }: { defaultSaleId?: number | null }) => {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(!!defaultSaleId);
  const [selectedSaleId, setSelectedSaleId] = useState<number | ''>(defaultSaleId || '');
  const [editingPaymentId, setEditingPaymentId] = useState<number | null>(null);
  const [viewingReceipt, setViewingReceipt] = useState<any>(null);

  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      sale_id: defaultSaleId || '',
      amount: '',
      payment_method: 'UPI',
      transaction_id: ''
    }
  });

  const { data: settings } = useQuery({ queryKey: ['settings'], queryFn: api.getSettings });
  const { data: sales = [] } = useQuery({ queryKey: ['sales'], queryFn: api.getSales });
  const { data: payments = [] } = useQuery({ 
    queryKey: ['payments', selectedSaleId], 
    queryFn: () => api.getPayments(selectedSaleId || undefined) 
  });

  const mutation = useMutation({
    mutationFn: (data: any) => {
      if (editingPaymentId) {
        return api.updatePayment(editingPaymentId, data);
      }
      return api.createPayment(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      toast.success(editingPaymentId ? 'Payment updated successfully!' : 'Payment recorded successfully!');
      setShowForm(false);
      setEditingPaymentId(null);
      reset({ sale_id: selectedSaleId || '', amount: '', payment_method: 'UPI', transaction_id: '' });
    },
    onError: (err: any) => {
      toast.error('Error saving payment: ' + err.message);
    }
  });

  const onSubmit = (data: any) => {
    mutation.mutate({
      ...data,
      amount: Number(data.amount) || 0
    });
  };

  const handleEditPayment = (payment: any) => {
    setEditingPaymentId(payment.id);
    reset({
      sale_id: payment.sale_id,
      amount: payment.amount,
      payment_method: payment.payment_method,
      transaction_id: payment.transaction_id || ''
    });
    setShowForm(true);
  };

  const handleDownloadReceipt = (payment: any) => {
    const sale = sales.find((s: any) => s.id === payment.sale_id);
    if (!sale) {
      toast.error('Sale details not found for this payment');
      return;
    }

    const mappedData = {
      id: payment.id,
      receiptNumber: payment.receipt_number,
      date: payment.created_at,
      studentName: sale.customers?.name || 'Customer',
      mobile: sale.customers?.phone || '',
      email: sale.customers?.email || '',
      courseName: sale.service_product,
      category: sale.category,
      paymentMethod: payment.payment_method,
      transactionId: payment.transaction_id,
      amount: payment.amount,
      status: 'Completed',
      includeSignature: true
    };

    setViewingReceipt(mappedData);
  };

  if (viewingReceipt && settings) {
    return (
      <ReceiptTemplate 
        receipt={viewingReceipt} 
        settings={settings} 
        onClose={() => setViewingReceipt(null)} 
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <CreditCard className="text-indigo-600" /> Payments & Receipts
          </h2>
          <p className="text-slate-500 text-sm mt-1">Record payments and generate official receipts.</p>
        </div>
        <button 
          onClick={() => {
            if (showForm) {
              setShowForm(false);
              setEditingPaymentId(null);
              reset({ sale_id: selectedSaleId || '', amount: '', payment_method: 'UPI', transaction_id: '' });
            } else {
              setShowForm(true);
            }
          }}
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
        >
          {showForm ? <><X size={20} /> Close Form</> : <><PlusCircle size={20} /> Record Payment</>}
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm animate-in fade-in slide-in-from-top-4">
          <h3 className="text-lg font-bold text-slate-800 mb-6 border-b border-slate-100 pb-4">
            {editingPaymentId ? 'Edit Payment' : 'Record New Payment'}
          </h3>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Select Sale / Project *</label>
                <select {...register('sale_id', { required: true })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20">
                  <option value="">-- Choose Sale --</option>
                  {sales?.map((s: any) => (
                    <option key={s.id} value={s.id}>
                      {s.customers?.name} - {s.service_product} (Final: ₹{s.final_amount})
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Amount Received (₹) *</label>
                <input type="number" {...register('amount', { required: true })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 font-bold" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Payment Method *</label>
                <select {...register('payment_method', { required: true })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20">
                  {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Transaction ID / Ref (Optional)</label>
                <input {...register('transaction_id')} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20" />
              </div>
            </div>
            
            <div className="flex justify-end pt-4 gap-3">
              {editingPaymentId && (
                <button 
                  type="button" 
                  onClick={() => {
                    setShowForm(false);
                    setEditingPaymentId(null);
                    reset({ sale_id: selectedSaleId || '', amount: '', payment_method: 'UPI', transaction_id: '' });
                  }}
                  className="px-6 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
              )}
              <button type="submit" disabled={mutation.isPending} className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-colors">
                {mutation.isPending ? 'Processing...' : (editingPaymentId ? 'Update Payment' : 'Record Payment & Generate Receipt')}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center gap-4">
          <div className="text-sm font-bold text-slate-600">Filter by Sale:</div>
          <select 
            value={selectedSaleId} 
            onChange={(e) => setSelectedSaleId(e.target.value ? Number(e.target.value) : '')}
            className="flex-1 max-w-md px-4 py-2 bg-white border border-slate-200 rounded-lg outline-none text-sm"
          >
            <option value="">All Payments</option>
            {sales.map((s: any) => (
              <option key={s.id} value={s.id}>{s.customers?.name} - {s.service_product}</option>
            ))}
          </select>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white border-b border-slate-200">
              <tr>
                <th className="text-left text-xs font-bold text-slate-500 uppercase p-4">Receipt No.</th>
                <th className="text-left text-xs font-bold text-slate-500 uppercase p-4">Date</th>
                <th className="text-left text-xs font-bold text-slate-500 uppercase p-4">Sale Details</th>
                <th className="text-right text-xs font-bold text-slate-500 uppercase p-4">Amount</th>
                <th className="text-left text-xs font-bold text-slate-500 uppercase p-4 pl-8">Method</th>
                <th className="text-right text-xs font-bold text-slate-500 uppercase p-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payments.map((payment: any) => {
                const sale = sales.find((s: any) => s.id === payment.sale_id);
                return (
                  <tr key={payment.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-bold text-indigo-600 text-sm">{payment.receipt_number}</td>
                    <td className="p-4 text-sm text-slate-600">{format(new Date(payment.created_at), 'dd MMM yyyy')}</td>
                    <td className="p-4">
                      <div className="font-bold text-slate-800">{sale?.customers?.name}</div>
                      <div className="text-xs text-slate-500">{sale?.service_product}</div>
                    </td>
                    <td className="p-4 text-sm font-black text-emerald-600 text-right">
                      ₹{(payment.amount || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="p-4 pl-8">
                      <div className="text-sm font-bold text-slate-700">{payment.payment_method}</div>
                      {payment.transaction_id && <div className="text-xs text-slate-500">Ref: {payment.transaction_id}</div>}
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button 
                        onClick={() => handleEditPayment(payment)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-50 text-amber-600 hover:bg-amber-100 rounded-lg text-sm font-bold transition-colors"
                      >
                        <Edit size={14} /> Edit
                      </button>
                      <button 
                        onClick={() => handleDownloadReceipt(payment)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg text-sm font-bold transition-colors"
                      >
                        <Download size={14} /> Receipt
                      </button>
                    </td>
                  </tr>
                );
              })}
              {payments.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">No payments found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PaymentManager;
