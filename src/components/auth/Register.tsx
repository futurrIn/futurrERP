import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { 
  User, 
  Mail, 
  Lock, 
  Phone, 
  Briefcase, 
  Building2, 
  ArrowRight, 
  Loader2,
  ChevronLeft
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/api';

const Register = ({ onBack, onComplete }: any) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  
  const role = watch('role');

  const { data: settings } = useQuery({ queryKey: ['settings'], queryFn: api.getSettings });

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      await api.signUp(data);
      toast.success('Registration successful! You can now log in.');
      onComplete();
    } catch (error: any) {
      toast.error(error.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    { id: 'Admin', label: 'Company Admin', desc: 'Full control over company settings and all receipts.' },
    { id: 'Manager', label: 'Manager', desc: 'Can manage and view all receipts in their department.' },
    { id: 'Accountant', label: 'Accountant', desc: 'Can view and export financial data and reports.' },
    { id: 'Employee', label: 'Employee', desc: 'Can generate receipts and view their own history.' }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        <div className="p-8">
          <div className="mb-8">
            {step > 1 && (
              <button onClick={() => setStep(step - 1)} className="mb-4 text-slate-400 hover:text-indigo-600 flex items-center gap-1 transition-colors">
                <ChevronLeft size={18} />
                <span className="text-sm font-medium">Back</span>
              </button>
            )}
            <h2 className="text-3xl font-bold text-slate-800">Create Account</h2>
            <p className="text-slate-500 mt-2">Step {step} of 2: {step === 1 ? 'Select your role' : 'Account details'}</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {step === 1 ? (
              <div className="space-y-3">
                {roles.map((r) => (
                  <label key={r.id} className={`block p-4 rounded-2xl border-2 cursor-pointer transition-all ${role === r.id ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-100 hover:border-slate-200 bg-slate-50/30'}`}>
                    <div className="flex items-center gap-3">
                      <input 
                        {...register('role', { required: true })}
                        type="radio" 
                        value={r.id} 
                        className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500"
                      />
                      <div>
                        <p className="font-bold text-slate-800">{r.label}</p>
                        <p className="text-xs text-slate-500">{r.desc}</p>
                      </div>
                    </div>
                  </label>
                ))}
                <button 
                  type="button"
                  disabled={!role}
                  onClick={() => setStep(2)}
                  className="w-full mt-6 bg-indigo-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 disabled:opacity-50 transition-all active:scale-95"
                >
                  Continue
                  <ArrowRight size={20} />
                </button>
              </div>
            ) : (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input {...register('fullName', { required: true })} className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" placeholder="John Doe" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input {...register('email', { required: true })} type="email" className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" placeholder="john@company.com" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input {...register('phone', { required: true })} className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" placeholder="+91 98765 43210" />
                  </div>
                </div>

                {(role === 'Employee' || role === 'Manager') && (
                  <>
                    <div className="space-y-1">
                      <label className="text-sm font-semibold text-slate-700">Department</label>
                      <div className="relative">
                        <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <select {...register('department', { required: true })} className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none">
                          <option value="">Select Department</option>
                          {settings?.departments?.map((d: string) => <option key={d} value={d}>{d}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-sm font-semibold text-slate-700">Job Position</label>
                      <div className="relative">
                        <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input {...register('jobPosition', { required: true })} className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" placeholder="e.g. Senior Accountant" />
                      </div>
                    </div>
                  </>
                )}

                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input {...register('password', { required: true, minLength: 6 })} type="password" className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" placeholder="••••••••" />
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full mt-6 bg-indigo-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 disabled:opacity-50 transition-all active:scale-95"
                >
                  {loading ? <Loader2 className="animate-spin" size={20} /> : 'Complete Registration'}
                </button>
              </div>
            )}
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <button onClick={onBack} className="text-slate-500 text-sm hover:text-indigo-600 font-medium">
              Already have an account? Log in
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
