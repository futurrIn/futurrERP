import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/api';
import { toast } from 'react-hot-toast';
import { Loader2, ArrowRight, Save, LayoutDashboard, ShoppingCart, User, IndianRupee } from 'lucide-react';

const CATEGORIES = [
  'Internship & Training Programs',
  'Website Development Projects',
  'Software Development Projects',
  'Hardware / IoT Projects',
  'Monthly Recurring Services',
  'Product Sales',
  'Component Sales',
  'Custom Services'
];

const NewSale = ({ onComplete, editData, onCancel }: { onComplete: () => void, editData?: any, onCancel?: () => void }) => {
  const queryClient = useQueryClient();
  const { register, handleSubmit, watch, reset, control } = useForm();
  
  const { data: customers } = useQuery({ queryKey: ['customers'], queryFn: api.getCustomers });
  const { data: users } = useQuery({ queryKey: ['users'], queryFn: api.getAllUsers });

  const category = watch('category');
  const amount = Number(watch('amount') || 0);
  const discount = Number(watch('discount') || 0);
  const tax = Number(watch('tax') || 0);
  const finalAmount = amount - discount + tax;

  const mutation = useMutation({
    mutationFn: (data: any) => {
      // Structure dynamic fields based on category
      let dynamic_fields: any = {};
      if (data.category?.includes('Internship')) {
        dynamic_fields = { studentName: data.studentName, college: data.college, course: data.course, duration: data.duration };
      } else if (data.category?.includes('Website') || data.category?.includes('Software')) {
        dynamic_fields = { deliveryDate: data.deliveryDate, milestone: data.milestone };
      } else if (data.category?.includes('Hardware')) {
        dynamic_fields = { componentsCost: data.componentsCost, developmentCost: data.developmentCost };
      } else if (data.category?.includes('Product')) {
        dynamic_fields = { product: data.product, quantity: data.quantity, unitPrice: data.unitPrice };
      } else if (data.category?.includes('Monthly')) {
        dynamic_fields = { billingCycle: data.billingCycle, renewalDate: data.renewalDate, nextBillingDate: data.nextBillingDate };
      }

      const payload = {
        customer_id: data.customer_id,
        category: data.category,
        service_product: data.service_product,
        project_name: data.project_name,
        assigned_to: data.assigned_to || null,
        description: data.description,
        amount: Number(data.amount) || 0,
        discount: Number(data.discount) || 0,
        tax: Number(data.tax) || 0,
        final_amount: finalAmount,
        status: editData ? editData.status : 'Pending',
        dynamic_fields
      };
      
      if (editData) {
        return api.updateSale(editData.id, payload);
      }
      return api.createSale(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      toast.success(editData ? 'Sale updated successfully!' : 'Sale created successfully!');
      onComplete();
    },
    onError: (err: any) => {
      toast.error('Failed to create sale: ' + err.message);
    }
  });

  const onSubmit = (data: any) => {
    mutation.mutate(data);
  };

  useEffect(() => {
    if (editData) {
      reset({
        ...editData,
        ...editData.dynamic_fields
      });
    }
  }, [editData, reset]);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
          <ShoppingCart className="text-indigo-600" /> {editData ? 'Edit Sale' : 'New Sale'}
        </h2>
        {onCancel && (
          <button onClick={onCancel} className="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg font-bold">
            Cancel Edit
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        
        {/* Customer Information */}
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <User className="text-indigo-500" size={20} /> Customer Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-bold text-slate-700">Select Customer *</label>
              <select {...register('customer_id', { required: true })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20">
                <option value="">-- Choose Existing Customer --</option>
                {customers?.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name} {c.company ? `(${c.company})` : ''}</option>
                ))}
              </select>
              <p className="text-xs text-slate-500 mt-1">If it's a new customer, add them first in the Customers module.</p>
            </div>
          </div>
        </div>

        {/* Sale Details */}
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <LayoutDashboard className="text-indigo-500" size={20} /> Sale Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Sale Category *</label>
              <select {...register('category', { required: true })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20">
                <option value="">-- Select Category --</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Service / Product Name *</label>
              <input {...register('service_product', { required: true })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Project Name (Optional)</label>
              <input {...register('project_name')} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Assigned To (Salesperson)</label>
              <select {...register('assigned_to')} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20">
                <option value="">-- Select Employee --</option>
                {users?.filter((u:any) => u.is_active).map((u: any) => (
                  <option key={u.id} value={u.id}>{u.fullName}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-bold text-slate-700">Description</label>
              <textarea {...register('description')} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20" rows={3}></textarea>
            </div>
          </div>
        </div>

        {/* Dynamic Fields */}
        {category && (
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm animate-in fade-in">
            <h3 className="text-lg font-bold text-slate-800 mb-4">{category} Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {category.includes('Internship') && (
                <>
                  <div className="space-y-2"><label className="text-sm font-bold text-slate-700">Student Name</label><input {...register('studentName')} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" /></div>
                  <div className="space-y-2"><label className="text-sm font-bold text-slate-700">College</label><input {...register('college')} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" /></div>
                  <div className="space-y-2"><label className="text-sm font-bold text-slate-700">Course</label><input {...register('course')} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" /></div>
                  <div className="space-y-2"><label className="text-sm font-bold text-slate-700">Duration</label><input {...register('duration')} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" /></div>
                </>
              )}
              {(category.includes('Website') || category.includes('Software')) && (
                <>
                  <div className="space-y-2"><label className="text-sm font-bold text-slate-700">Delivery Date</label><input type="date" {...register('deliveryDate')} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" /></div>
                  <div className="space-y-2"><label className="text-sm font-bold text-slate-700">Milestone</label><input {...register('milestone')} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" /></div>
                </>
              )}
              {category.includes('Hardware') && (
                <>
                  <div className="space-y-2"><label className="text-sm font-bold text-slate-700">Components Cost (₹)</label><input type="number" {...register('componentsCost')} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" /></div>
                  <div className="space-y-2"><label className="text-sm font-bold text-slate-700">Development Cost (₹)</label><input type="number" {...register('developmentCost')} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" /></div>
                </>
              )}
              {category.includes('Product') && (
                <>
                  <div className="space-y-2"><label className="text-sm font-bold text-slate-700">Product</label><input {...register('product')} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" /></div>
                  <div className="space-y-2"><label className="text-sm font-bold text-slate-700">Quantity</label><input type="number" {...register('quantity')} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" /></div>
                  <div className="space-y-2"><label className="text-sm font-bold text-slate-700">Unit Price</label><input type="number" {...register('unitPrice')} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" /></div>
                </>
              )}
              {category.includes('Monthly') && (
                <>
                  <div className="space-y-2"><label className="text-sm font-bold text-slate-700">Billing Cycle</label><input {...register('billingCycle')} placeholder="e.g. 1st of Month" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" /></div>
                  <div className="space-y-2"><label className="text-sm font-bold text-slate-700">Renewal Date</label><input type="date" {...register('renewalDate')} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" /></div>
                  <div className="space-y-2"><label className="text-sm font-bold text-slate-700">Next Billing Date</label><input type="date" {...register('nextBillingDate')} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" /></div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Financial Information */}
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <IndianRupee className="text-indigo-500" size={20} /> Financial Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Base Amount (₹) *</label>
              <input type="number" {...register('amount', { required: true })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 font-bold" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Discount (₹)</label>
              <input type="number" {...register('discount')} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Tax (₹)</label>
              <input type="number" {...register('tax')} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20" />
            </div>
          </div>
          
          <div className="mt-8 p-6 bg-indigo-50 rounded-2xl border border-indigo-100 flex items-center justify-between">
            <div>
              <p className="text-indigo-900 font-bold">Final Sale Amount</p>
              <p className="text-sm text-indigo-700 mt-1">Amount to be collected</p>
            </div>
            <div className="text-4xl font-black text-indigo-600">
              ₹{finalAmount.toLocaleString('en-IN')}
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-6 gap-3">
          {onCancel && (
            <button 
              type="button" 
              onClick={onCancel}
              className="px-8 py-3 rounded-2xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
          )}
          <button 
            type="submit" 
            disabled={mutation.isPending}
            className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
          >
            {mutation.isPending ? <Loader2 className="animate-spin" /> : <Save />}
            {editData ? 'Update Sale' : 'Save & Create Sale'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewSale;
