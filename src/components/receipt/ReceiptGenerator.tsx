import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { 
  User, 
  Mail, 
  Phone, 
  School, 
  IndianRupee, 
  Calendar, 
  CreditCard, 
  Tag, 
  Clock,
  CheckCircle2,
  FileText,
  Eye,
  ArrowRight,
  Loader2,
  X
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/api';
import ReceiptTemplate from './ReceiptTemplate';

interface ReceiptGeneratorProps {
  editData?: any | null;
  onComplete?: () => void;
}

const ReceiptGenerator: React.FC<ReceiptGeneratorProps> = ({ editData, onComplete }) => {
  const [showSuccess, setShowSuccess] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [receiptNumber, setReceiptNumber] = useState('');
  const queryClient = useQueryClient();

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: api.getSettings
  });

  const { register, handleSubmit, reset, setValue, watch, trigger } = useForm();
  const formData = watch();

  const mutation = useMutation({
    mutationFn: (data: any) => {
      if (editData?.id) {
        return api.updateReceipt(editData.id, data);
      }
      return api.createReceipt(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
      setShowSuccess(true);
      toast.success(editData ? 'Receipt updated successfully!' : 'Receipt generated successfully!');
      setTimeout(() => {
        setShowSuccess(false);
        reset();
        if (onComplete) onComplete();
      }, 2000);
    },
    onError: (error: any) => {
      console.error('Receipt Generation Error:', error);
      toast.error(`Error saving receipt: ${error.message || 'Unknown error'}.`);
    }
  });

  const isSubmitting = mutation.isPending;

  useEffect(() => {
    if (editData) {
      reset({
        ...editData,
        date: new Date(editData.date).toISOString().slice(0, 16)
      });
      setReceiptNumber(editData.receiptNumber);
    } else if (settings) {
      const date = new Date();
      const companyName = settings.companyName || 'REC';
      const prefix = companyName.slice(0, 3).toUpperCase();
      const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
      const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      const num = `${prefix}-${dateStr}-${random}`;
      setReceiptNumber(num);
      setValue('receiptNumber', num);
      setValue('date', date.toISOString().slice(0, 16));
      setValue('includeSignature', true);
    }
  }, [setValue, showSuccess, settings, editData, reset]);

  const onSubmit = async (data: any) => {
    mutation.mutate({
      ...data,
      amount: Number(data.amount),
      date: new Date(data.date),
      createdAt: editData?.createdAt || new Date().toISOString()
    });
  };

  if (!settings) return null;

  const brandColor = settings.primaryColor || '#4f46e5';

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      {showSuccess && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-700">
          <CheckCircle2 size={24} />
          <div>
            <p className="font-bold">Receipt Generated Successfully!</p>
            <p className="text-sm">Receipt #{receiptNumber} has been saved to the database.</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Student Details Section */}
        <section className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-6" style={{ color: brandColor }}>
            <User size={20} />
            <h3 className="font-bold text-lg text-slate-800">Student Details</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Student Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  {...register('studentName', { required: true })}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none transition-all focus:ring-2"
                  style={{ '--tw-ring-color': `${brandColor}33` } as any}
                  placeholder="John Doe"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  {...register('email', { required: true })}
                  type="email"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none transition-all focus:ring-2"
                  style={{ '--tw-ring-color': `${brandColor}33` } as any}
                  placeholder="john@example.com"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  {...register('phone', { required: true })}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none transition-all focus:ring-2"
                  style={{ '--tw-ring-color': `${brandColor}33` } as any}
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">College Name (Optional)</label>
              <div className="relative">
                <School className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  {...register('college')}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none transition-all focus:ring-2"
                  style={{ '--tw-ring-color': `${brandColor}33` } as any}
                  placeholder="ABC Institute of Technology"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Payment Details Section */}
        <section className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-6" style={{ color: settings.secondaryColor }}>
            <CreditCard size={20} />
            <h3 className="font-bold text-lg text-slate-800">Payment Details</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Receipt Number</label>
              <input 
                {...register('receiptNumber')}
                readOnly
                className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 outline-none cursor-not-allowed"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Date & Time</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  {...register('date', { required: true })}
                  type="datetime-local"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none transition-all focus:ring-2"
                  style={{ '--tw-ring-color': `${brandColor}33` } as any}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Amount Paid (₹)</label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  {...register('amount', { required: true })}
                  type="number"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none transition-all focus:ring-2"
                  style={{ '--tw-ring-color': `${brandColor}33` } as any}
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Payment Method</label>
              <select 
                {...register('paymentMethod', { required: true })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none transition-all focus:ring-2"
                style={{ '--tw-ring-color': `${brandColor}33` } as any}
              >
                <option value="UPI">UPI</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cash">Cash</option>
                <option value="Razorpay">Razorpay</option>
                <option value="Paytm">Paytm</option>
                <option value="Google Pay">Google Pay</option>
              </select>
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className="text-sm font-medium text-slate-700">Transaction ID / UTR Number</label>
              <input 
                {...register('transactionId')}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none transition-all focus:ring-2"
                style={{ '--tw-ring-color': `${brandColor}33` } as any}
                placeholder="TXN123456789"
              />
            </div>
          </div>
        </section>

        {/* Service Details Section */}
        <section className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-6 text-blue-600">
            <Tag size={20} />
            <h3 className="font-bold text-lg text-slate-800">Service Details</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Category</label>
              <select 
                {...register('category', { required: true })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none transition-all focus:ring-2"
                style={{ '--tw-ring-color': `${brandColor}33` } as any}
              >
                {settings?.categories.map((cat: string) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Course / Program Name</label>
              <input 
                {...register('courseName', { required: true })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none transition-all focus:ring-2"
                style={{ '--tw-ring-color': `${brandColor}33` } as any}
                placeholder="Data Science Internship"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Duration</label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  {...register('duration')}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none transition-all focus:ring-2"
                  style={{ '--tw-ring-color': `${brandColor}33` } as any}
                  placeholder="3 Months"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Batch Name</label>
              <input 
                {...register('batchName')}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none transition-all focus:ring-2"
                style={{ '--tw-ring-color': `${brandColor}33` } as any}
                placeholder="June 2024 Batch"
              />
            </div>
          </div>
        </section>

        {/* Options Section */}
        <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <input 
            type="checkbox"
            id="includeSignature"
            {...register('includeSignature')}
            className="w-5 h-5 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
            style={{ accentColor: brandColor }}
          />
          <label htmlFor="includeSignature" className="text-sm font-bold text-slate-700 cursor-pointer select-none">
            Include Authorized Signature on this Receipt
          </label>
        </section>

        {/* Form Actions */}
        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="flex-1 btn-primary py-4 text-lg flex items-center justify-center gap-2 w-full"
            style={{ background: `linear-gradient(to right, ${brandColor}, ${settings.secondaryColor})` }}
          >
            {isSubmitting ? <Loader2 className="animate-spin" /> : <FileText size={22} />}
            {editData ? 'Confirm Changes' : 'Generate Receipt'}
          </button>
          <button 
            type="button"
            onClick={async () => {
              const isValid = await trigger();
              if (isValid) setShowPreview(true);
            }}
            className="px-6 btn-secondary flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            <Eye size={20} />
            Preview
          </button>
        </div>
      </form>

      {/* Preview Modal */}
      {showPreview && (
        <ReceiptTemplate 
          settings={settings}
          onClose={() => setShowPreview(false)}
          onSave={() => {
            setShowPreview(false);
            handleSubmit(onSubmit)();
          }}
          receipt={{
            ...formData,
            receiptNumber,
            date: new Date(),
            createdAt: Date.now(),
            includeSignature: formData.includeSignature
          } as any} 
        />
      )}
    </div>
  );
};

export default ReceiptGenerator;
