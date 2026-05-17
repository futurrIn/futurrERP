import React, { useState } from 'react';
import { api } from '../../api/api';
import { 
  Building2, 
  Lock, 
  ArrowRight, 
  ShieldCheck, 
  Palette, 
  Check,
  Loader2
} from 'lucide-react';

interface SetupProps {
  onComplete: () => void;
}

const Setup: React.FC<SetupProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    companyName: '',
    supportEmail: '',
    primaryColor: '#4f46e5',
    secondaryColor: '#9333ea'
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNext = () => setStep(step + 1);
  const handleBack = () => setStep(step - 1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await api.updateSettings({
        companyName: formData.companyName,
        companyAddress: 'Enter your address in settings later',
        supportEmail: formData.supportEmail,
        websiteUrl: 'https://',
        categories: [
          'Internship',
          'Online Course',
          'Workshop',
          'Certification',
          'Training Program'
        ],
        primaryColor: formData.primaryColor,
        secondaryColor: formData.secondaryColor
      });
      onComplete();
    } catch (err) {
      console.error(err);
      alert("Setup failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-xl animate-in fade-in zoom-in duration-500">
        <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
          {/* Progress Bar */}
          <div className="h-2 w-full bg-slate-100 flex">
            <div 
              className="h-full bg-indigo-600 transition-all duration-500" 
              style={{ width: `${(step / 2) * 100}%` }}
            />
          </div>

          <div className="p-8 sm:p-12">
            <div className="mb-10 text-center flex flex-col items-center">
              <div 
                className="w-20 h-20 rounded-2xl flex items-center justify-center text-white shadow-xl mb-6 p-3"
                style={{ background: `linear-gradient(135deg, ${formData.primaryColor}, ${formData.secondaryColor})` }}
              >
                <img src="/logo.svg" alt="Logo" className="w-full h-full object-contain brightness-0 invert" />
              </div>
              <h1 className="text-3xl font-black text-slate-800 mb-2">Welcome to your Receipt Builder</h1>
              <p className="text-slate-500">Let's set up your personalized system.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              {step === 1 && (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                  <div className="flex items-center gap-3 text-indigo-600 font-bold mb-2">
                    <Building2 size={24} />
                    <h2 className="text-xl">Company Identity</h2>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Company Name</label>
                      <input 
                        required
                        name="companyName"
                        value={formData.companyName}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                        placeholder="e.g. Acme Innovations"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Support Email</label>
                      <input 
                        required
                        type="email"
                        name="supportEmail"
                        value={formData.supportEmail}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                        placeholder="support@company.com"
                      />
                    </div>
                  </div>
                  <button 
                    type="button" 
                    onClick={handleNext}
                    className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold shadow-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                  >
                    Next Step <ArrowRight size={20} />
                  </button>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                  <div className="flex items-center gap-3 text-purple-600 font-bold mb-2">
                    <Palette size={24} />
                    <h2 className="text-xl">Brand Colors</h2>
                  </div>
                  <p className="text-sm text-slate-500 mb-4">Choose the primary and secondary colors for your dashboard.</p>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Primary Color</label>
                      <input 
                        type="color"
                        name="primaryColor"
                        value={formData.primaryColor}
                        onChange={handleChange}
                        className="w-full h-14 p-1 bg-white border border-slate-200 rounded-xl cursor-pointer"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Secondary Color</label>
                      <input 
                        type="color"
                        name="secondaryColor"
                        value={formData.secondaryColor}
                        onChange={handleChange}
                        className="w-full h-14 p-1 bg-white border border-slate-200 rounded-xl cursor-pointer"
                      />
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <button type="button" onClick={handleBack} className="flex-1 py-4 text-slate-600 font-bold hover:bg-slate-50 rounded-xl transition-all">
                      Back
                    </button>
                    <button 
                      type="submit" 
                      disabled={isLoading}
                      className="flex-1 py-4 bg-emerald-600 text-white rounded-xl font-bold shadow-lg hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
                    >
                      {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Check size={20} />}
                      Finish Setup
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>

          <div className="p-6 bg-slate-50 border-t border-slate-100 text-center">
            <div className="flex items-center justify-center gap-2 text-slate-400 text-xs font-medium">
              <ShieldCheck size={14} />
              Secure Offline Storage via IndexedDB
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Setup;
