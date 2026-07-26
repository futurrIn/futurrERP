import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { 
  Calendar, 
  MapPin, 
  Car, 
  Coffee, 
  Hotel, 
  ShoppingBag, 
  Upload, 
  Plus, 
  Loader2,
  CheckCircle2,
  Trash2,
  PlusCircle,
  Plane,
  MapPinned,
  ArrowRight,
  History,
  PartyPopper
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/api';

interface Trip {
  type: 'Public' | 'Private';
  mode: string;
  from: string;
  to: string;
  amount: number;
}

interface Purchase {
  vendor: string;
  item: string;
  amount: number;
}

interface ExpenseFormData {
  date: string;
  trips: Trip[];
  foodType: string[];
  foodAmount: number;
  accommodationAmount: number;
  accommodationDays: number;
  purchases: Purchase[];
}

const ExpenseForm = ({ editData, onComplete, onNew }: any) => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const queryClient = useQueryClient();

  const { register, handleSubmit, watch, setValue, reset, control } = useForm<ExpenseFormData>({
    defaultValues: editData ? {
      ...editData,
      date: new Date(editData.date).toISOString().slice(0, 16),
      purchases: editData.purchases?.length
        ? editData.purchases
        : editData.purchaseVendor
          ? [{ vendor: editData.purchaseVendor, item: editData.purchaseItem, amount: editData.purchaseAmount }]
          : []
    } : {
      date: new Date().toISOString().slice(0, 16),
      trips: [],
      foodType: [],
      foodAmount: 0,
      accommodationAmount: 0,
      accommodationDays: 0,
      purchases: []
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "trips"
  });

  const { fields: purchaseFields, append: appendPurchase, remove: removePurchase } = useFieldArray({
    control,
    name: "purchases"
  });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      let billUrl = editData?.billUrl || '';
      if (file) {
        billUrl = await api.uploadBill(file);
      }
      
      const travelTotal = data.trips.reduce((sum: number, t: any) => sum + Number(t.amount || 0), 0);
      const purchasesTotal = (data.purchases || []).reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);
      const totalAmount =
        travelTotal +
        Number(data.foodAmount || 0) +
        Number(data.accommodationAmount || 0) +
        purchasesTotal;

      const payload = {
        ...data,
        totalAmount,
        billUrl
      };

      if (editData?.id) {
        return api.updateExpense(editData.id, payload);
      }
      return api.createExpense(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      setIsSubmitted(true);
      toast.success('Expense claim submitted successfully!');
    },
    onError: (error: any) => {
      console.error('Submission error:', error);
      toast.error('Error submitting expense: ' + (error.message || 'Unknown error.'));
    }
  });

  const onSubmit = (data: any) => {
    mutation.mutate(data);
  };

  const handleNewSubmission = () => {
    if (onNew) {
      onNew();
    }
    reset({
      date: new Date().toISOString().slice(0, 16),
      trips: [],
      foodType: [],
      foodAmount: 0,
      accommodationAmount: 0,
      accommodationDays: 0,
      purchases: []
    });
    setFile(null);
    setIsSubmitted(false);
  };

  const publicModes = ['Bus', 'Auto', 'Cab', 'Train', 'Flight'];
  const privateModes = ['Motorcycle', 'Car', 'Other'];

  if (isSubmitted) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-6 animate-in fade-in zoom-in duration-500">
        <div className="bg-white rounded-[2.5rem] p-12 text-center border border-slate-100 shadow-2xl shadow-indigo-100/50">
          <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce">
            <CheckCircle2 size={48} strokeWidth={3} />
          </div>
          <h2 className="text-4xl font-black text-slate-800 mb-4 tracking-tight">Claim Submitted!</h2>
          <p className="text-slate-500 text-lg mb-10 leading-relaxed font-medium">
            Your expense claim has been successfully recorded and is now pending review by the management.
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button 
              onClick={handleNewSubmission}
              className="group flex items-center justify-center gap-2 py-5 px-8 bg-indigo-600 text-white rounded-3xl font-bold text-lg hover:bg-indigo-700 transition-all active:scale-95 shadow-lg shadow-indigo-200"
            >
              <PlusCircle size={24} />
              New Submission
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button 
              onClick={() => (window as any).setActiveTab('history')}
              className="flex items-center justify-center gap-2 py-5 px-8 bg-slate-50 text-slate-700 rounded-3xl font-bold text-lg hover:bg-slate-100 transition-all active:scale-95 border border-slate-200"
            >
              <History size={24} />
              View History
            </button>
          </div>

          <div className="mt-12 flex items-center justify-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-widest">
            <PartyPopper size={16} />
            Keep tracking your growth
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 px-4 md:px-0">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 md:space-y-6">
        {/* Header Section */}
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4 md:mb-6 text-indigo-600">
            <Calendar size={20} className="md:w-6 md:h-6" />
            <h3 className="text-lg md:text-xl font-bold text-slate-800">Date</h3>
          </div>
          <input 
            {...register('date', { required: true })}
            type="datetime-local" 
            className="w-full px-4 md:px-6 py-3 md:py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 text-base md:text-lg font-medium"
          />
        </div>

        {/* Dynamic Trips Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-lg font-bold text-slate-700 flex items-center gap-2">
              <MapPinned size={20} className="text-emerald-500" />
              Travel Details
            </h3>
            <button
              type="button"
              onClick={() => append({ type: 'Public', mode: 'Bus', from: '', to: '', amount: 0 })}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-sm font-bold hover:bg-emerald-100 transition-all active:scale-95"
            >
              <PlusCircle size={18} />
              Add Trip
            </button>
          </div>

          {fields.map((field, index) => (
            <div key={field.id} className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm animate-in zoom-in-95 duration-200 relative group">
              <div className="absolute top-4 md:top-6 right-4 md:right-6">
                <button 
                  type="button" 
                  onClick={() => remove(index)}
                  className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                >
                  <Trash2 size={16} className="md:w-5 md:h-5" />
                </button>
              </div>

              <div className="flex items-center gap-2 mb-4 md:mb-6">
                <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black uppercase tracking-widest">
                  Trip - {index + 1}
                </span>
              </div>

              <div className="space-y-4 md:space-y-6">
                {/* From / To Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">From</label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                      <input 
                        {...register(`trips.${index}.from` as const)}
                        className="w-full pl-10 pr-4 py-2.5 md:py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-400 transition-colors text-sm"
                        placeholder="Starting Point"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">To</label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-300" size={14} />
                      <input 
                        {...register(`trips.${index}.to` as const)}
                        className="w-full pl-10 pr-4 py-2.5 md:py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-400 transition-colors text-sm"
                        placeholder="Destination"
                      />
                    </div>
                  </div>
                </div>

                {/* Type / Mode / Amount Row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Type</label>
                    <select 
                      {...register(`trips.${index}.type` as const)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm"
                    >
                      <option value="Public">Public</option>
                      <option value="Private">Private</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Mode</label>
                    <select 
                      {...register(`trips.${index}.mode` as const)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm"
                    >
                      {(watch(`trips.${index}.type`) === 'Private' ? privateModes : publicModes).map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Amount (₹)</label>
                    <input 
                      {...register(`trips.${index}.amount` as const)}
                      type="number" 
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-sm"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}

          {fields.length === 0 && (
            <div className="py-12 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center text-slate-400 space-y-2">
              <Car size={32} className="opacity-20" />
              <p className="text-sm font-medium">No trips added. Click "Add Trip" to start.</p>
            </div>
          )}
        </div>

        {/* Food & Accommodation Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-4 md:mb-6 text-orange-600">
              <Coffee size={20} className="md:w-6 md:h-6" />
              <h3 className="text-lg md:text-xl font-bold text-slate-800">Food</h3>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                {['Breakfast', 'Lunch', 'Dinner'].map(meal => (
                  <label key={meal} className="flex flex-col items-center gap-2 p-2 md:p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer hover:bg-orange-50 hover:border-orange-200 transition-all">
                    <input 
                      type="checkbox" 
                      value={meal} 
                      {...register('foodType')}
                      className="w-3 h-3 md:w-4 md:h-4 text-orange-600 border-slate-300 rounded focus:ring-orange-500"
                    />
                    <span className="text-[8px] md:text-[10px] font-bold text-slate-600 uppercase text-center">{meal}</span>
                  </label>
                ))}
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Food Amount (₹)</label>
                <input {...register('foodAmount')} type="number" className="w-full px-4 py-2.5 md:py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm" placeholder="0.00" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-4 md:mb-6 text-blue-600">
              <Hotel size={20} className="md:w-6 md:h-6" />
              <h3 className="text-lg md:text-xl font-bold text-slate-800">Accommodation</h3>
            </div>
            <div className="grid grid-cols-2 gap-3 md:gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Amount (₹)</label>
                <input {...register('accommodationAmount')} type="number" className="w-full px-4 py-2.5 md:py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm" placeholder="0.00" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Days</label>
                <input {...register('accommodationDays')} type="number" className="w-full px-4 py-2.5 md:py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm" placeholder="0" />
              </div>
            </div>
          </div>
        </div>

        {/* General Purchases Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-lg font-bold text-slate-700 flex items-center gap-2">
              <ShoppingBag size={20} className="text-purple-500" />
              General Purchases
            </h3>
            <button
              type="button"
              onClick={() => appendPurchase({ vendor: '', item: '', amount: 0 })}
              className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-600 rounded-xl text-sm font-bold hover:bg-purple-100 transition-all active:scale-95"
            >
              <PlusCircle size={18} />
              Add Vendor
            </button>
          </div>

          {purchaseFields.map((field, index) => (
            <div key={field.id} className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm animate-in zoom-in-95 duration-200 relative group">
              <div className="absolute top-4 md:top-6 right-4 md:right-6">
                <button
                  type="button"
                  onClick={() => removePurchase(index)}
                  className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                >
                  <Trash2 size={16} className="md:w-5 md:h-5" />
                </button>
              </div>

              <div className="flex items-center gap-2 mb-4 md:mb-6">
                <span className="px-3 py-1 bg-purple-50 text-purple-600 rounded-lg text-[10px] font-black uppercase tracking-widest">
                  Purchase - {index + 1}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Vendor</label>
                  <input
                    {...register(`purchases.${index}.vendor` as const)}
                    className="w-full px-4 py-2.5 md:py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-purple-400 transition-colors text-sm"
                    placeholder="Vendor Name"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Item / Service</label>
                  <input
                    {...register(`purchases.${index}.item` as const)}
                    className="w-full px-4 py-2.5 md:py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-purple-400 transition-colors text-sm"
                    placeholder="Item or Service"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Amount (₹)</label>
                  <input
                    {...register(`purchases.${index}.amount` as const)}
                    type="number"
                    className="w-full px-4 py-2.5 md:py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-purple-400 transition-colors text-sm font-bold"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>
          ))}

          {purchaseFields.length === 0 && (
            <div className="py-12 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center text-slate-400 space-y-2">
              <ShoppingBag size={32} className="opacity-20" />
              <p className="text-sm font-medium">No purchases added. Click "Add Vendor" to start.</p>
            </div>
          )}
        </div>

        {/* Bill Upload Section */}
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-dashed border-slate-300 text-center">
          <Upload className="mx-auto text-slate-300 mb-2 md:mb-4 w-8 h-8 md:w-10 md:h-10" />
          <h4 className="font-bold text-slate-800 text-sm md:text-base">Upload Receipt/Bill</h4>
          <p className="text-[10px] text-slate-400 mt-1 mb-4 md:mb-6">PDF, JPG, PNG (Max 5MB)</p>
          <input 
            type="file" 
            id="bill-upload" 
            className="hidden" 
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
          <label 
            htmlFor="bill-upload"
            className="inline-flex items-center gap-2 px-4 md:px-6 py-2 md:py-2.5 bg-slate-800 text-white rounded-xl text-xs md:text-sm font-bold cursor-pointer hover:bg-slate-900 transition-all"
          >
            {file ? file.name : 'Select File'}
          </label>
        </div>

        {/* Submit Button */}
        <button 
          type="submit"
          disabled={mutation.isPending}
          className="w-full py-4 md:py-5 bg-indigo-600 text-white rounded-[1.5rem] md:rounded-3xl font-bold text-lg md:text-xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 disabled:opacity-50 transition-all active:scale-95 flex items-center justify-center gap-3"
        >
          {mutation.isPending ? <Loader2 className="animate-spin" /> : (editData?.id ? 'Update Claim' : 'Submit Full Claim')}
        </button>
      </form>
    </div>
  );
};

export default ExpenseForm;
