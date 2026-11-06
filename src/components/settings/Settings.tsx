import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/api';
import {
  Building2, Mail, Globe, FileSignature, Image as ImageIcon,
  Plus, X, Save, CheckCircle2, Loader2, CreditCard, Users, Briefcase, 
  Settings as SettingsIcon, Shield, Activity, Target, Trash2, PenTool, Upload
} from 'lucide-react';
import SignaturePad from '../document-studio/SignaturePad';

const Settings: React.FC = () => {
  const queryClient = useQueryClient();
  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: api.getSettings
  });

  const [activeTab, setActiveTab] = useState('general');
  const [signatureTab, setSignatureTab] = useState<'upload' | 'draw'>('upload');
  const [isSaved, setIsSaved] = useState(false);
  
  // Array inputs
  const [newCategory, setNewCategory] = useState('');
  const [newDepartment, setNewDepartment] = useState('');
  const [newLeadSource, setNewLeadSource] = useState('');
  const [newService, setNewService] = useState('');
  const [newPipelineStage, setNewPipelineStage] = useState('');
  const [newPaymentMethod, setNewPaymentMethod] = useState('');

  const mutation = useMutation({
    mutationFn: api.updateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    }
  });

  if (isLoading || !settings) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="animate-spin text-indigo-600" size={32} />
    </div>
  );

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const updates: any = {
      ...settings,
    };

    // General Form Data
    if (activeTab === 'general') {
      updates.companyName = formData.get('companyName') as string;
      updates.tagline = formData.get('tagline') as string;
      updates.companyAddress = formData.get('companyAddress') as string;
      updates.supportEmail = formData.get('supportEmail') as string;
      updates.websiteUrl = formData.get('websiteUrl') as string;
      updates.gst = formData.get('gst') as string;
      updates.password = formData.get('password') as string;
      updates.primaryColor = formData.get('primaryColor') as string;
      updates.secondaryColor = formData.get('secondaryColor') as string;
      updates.bank_name = formData.get('bank_name') as string;
      updates.bank_account = formData.get('bank_account') as string;
      updates.bank_ifsc = formData.get('bank_ifsc') as string;
      updates.bank_upi = formData.get('bank_upi') as string;
    }

    // Finance Form Data
    if (activeTab === 'finance') {
      updates.monthlyBudget = Number(formData.get('monthlyBudget')) || 0;
      updates.default_tax_rate = Number(formData.get('default_tax_rate')) || 0;
    }

    mutation.mutate(updates);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'logo' | 'signature') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      mutation.mutate({ ...settings, [field]: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const addArrayItem = (field: string, value: string, setValue: any) => {
    if (!value) return;
    mutation.mutate({
      ...settings,
      [field]: [...(settings[field] || []), value]
    });
    setValue('');
  };

  const removeArrayItem = (field: string, value: string) => {
    mutation.mutate({
      ...settings,
      [field]: (settings[field] || []).filter((i: string) => i !== value)
    });
  };

  // Helper for rendering array managers
  const renderArrayManager = (
    title: string, 
    field: string, 
    items: string[], 
    inputValue: string, 
    setInputValue: any,
    icon: any,
    placeholder: string
  ) => {
    const Icon = icon;
    return (
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
          <Icon size={20} className="text-indigo-600"/> 
          {title}
        </h3>
        <div className="flex flex-wrap gap-2 mb-6">
          {items?.map((item: string) => (
            <div key={item} className="group flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-full text-sm font-medium">
              {item}
              <button onClick={() => removeArrayItem(field, item)} className="text-slate-400 hover:text-rose-500 transition-colors">
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={placeholder}
            onKeyPress={(e) => e.key === 'Enter' && addArrayItem(field, inputValue, setInputValue)}
            className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
          <button
            onClick={() => addArrayItem(field, inputValue, setInputValue)}
            className="p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all"
          >
            <Plus size={24} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 px-4 md:px-0">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Admin Settings</h2>
          <p className="text-slate-500 font-medium">Configure global system parameters</p>
        </div>
        {isSaved && (
          <span className="flex items-center gap-2 text-emerald-600 font-bold bg-emerald-50 px-4 py-2 rounded-xl">
            <CheckCircle2 size={18} /> Saved
          </span>
        )}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {[
          { id: 'general', label: 'General & Branding', icon: SettingsIcon },
          { id: 'org', label: 'Organization', icon: Users },
          { id: 'finance', label: 'Finance Config', icon: CreditCard }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold whitespace-nowrap transition-all ${
              activeTab === tab.id 
                ? 'bg-indigo-600 text-white shadow-md' 
                : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <tab.icon size={18} /> {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'general' && (
        <div className="space-y-6 animate-in fade-in">
          <form onSubmit={handleSave} className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-8">
            <h3 className="font-bold text-xl border-b border-slate-100 pb-4">Company Profile</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Company Name</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input name="companyName" defaultValue={settings.companyName || 'Futurr Innovations and Research'} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Company Tagline / Subtitle</label>
                <input name="tagline" defaultValue={settings.tagline || 'Advanced Humanoid & Quadruped Robotics, High-Tech Stage Deployments & Automation'} placeholder="e.g. Advanced Humanoid & Quadruped Robotics..." className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">GST / Tax ID</label>
                <input name="gst" defaultValue={settings.gst} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Support Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input name="supportEmail" defaultValue={settings.supportEmail} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Website URL</label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input name="websiteUrl" defaultValue={settings.websiteUrl} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all" />
                </div>
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-medium text-slate-700">Address</label>
                <textarea name="companyAddress" defaultValue={settings.companyAddress} rows={2} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all" />
              </div>
            </div>

            <h3 className="font-bold text-xl border-b border-slate-100 pb-4 pt-4">Branding & Security</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Admin Password</label>
                <input name="password" type="password" defaultValue={settings.password} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Primary Color</label>
                <div className="flex gap-2">
                  <input name="primaryColor" type="color" defaultValue={settings.primaryColor || '#4f46e5'} className="w-12 h-10 p-1 bg-white border border-slate-200 rounded-xl cursor-pointer" />
                  <input type="text" value={settings.primaryColor || '#4f46e5'} readOnly className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Secondary Color</label>
                <div className="flex gap-2">
                  <input name="secondaryColor" type="color" defaultValue={settings.secondaryColor || '#9333ea'} className="w-12 h-10 p-1 bg-white border border-slate-200 rounded-xl cursor-pointer" />
                  <input type="text" value={settings.secondaryColor || '#9333ea'} readOnly className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono" />
                </div>
              </div>
            </div>
            
            {/* Branding: Logo & Signature */}
            <div className="space-y-6 pt-4 border-t border-slate-100">
              <h3 className="font-bold text-xl border-b border-slate-100 pb-4">
                Official Branding &amp; Signatures
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* 1. Company Logo PNG Upload */}
                <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      <ImageIcon size={16} className="text-indigo-600" />
                      <span>Company Logo (PNG Upload)</span>
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Supports transparent PNG, SVG, or high-res JPG. Used in dashboard header and official documents.
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-2xl bg-slate-900 border-2 border-slate-200 flex items-center justify-center p-2 overflow-hidden shadow-inner shrink-0">
                      {settings.logo ? (
                        <img src={settings.logo} alt="Company Logo" className="w-full h-full object-contain" />
                      ) : (
                        <span className="text-[10px] text-slate-400 font-bold text-center">No Logo</span>
                      )}
                    </div>

                    <div className="flex-1 space-y-2">
                      <label className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-sm">
                        <Upload size={14} />
                        <span>Upload PNG Logo</span>
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/svg+xml,image/webp"
                          onChange={(e) => handleFileUpload(e, 'logo')}
                          className="hidden"
                        />
                      </label>

                      {settings.logo && (
                        <div>
                          <button
                            type="button"
                            onClick={() => mutation.mutate({ ...settings, logo: '' })}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2.5 py-1 rounded-lg transition-colors"
                          >
                            <Trash2 size={13} /> Remove Logo
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. Authorized Signature (PNG Upload or Digital Pad) */}
                <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      <FileSignature size={16} className="text-indigo-600" />
                      <span>Authorized Digital Signature</span>
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Will appear on all generated Quotations, Tax Invoices, and Payment Receipts.
                    </p>
                  </div>

                  {/* Toggle between Upload PNG and Draw Pad */}
                  <div className="flex gap-1.5 p-1 bg-slate-200/70 rounded-xl w-fit">
                    <button
                      type="button"
                      onClick={() => setSignatureTab('upload')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                        signatureTab === 'upload' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Upload size={13} />
                      <span>Upload PNG</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSignatureTab('draw')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                        signatureTab === 'draw' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <PenTool size={13} />
                      <span>Draw on Signature Pad</span>
                    </button>
                  </div>

                  {signatureTab === 'upload' ? (
                    <div className="flex items-center gap-4">
                      <div className="w-32 h-16 rounded-xl bg-white border border-slate-200 flex items-center justify-center p-2 overflow-hidden shadow-inner shrink-0">
                        {settings.signature ? (
                          <img src={settings.signature} alt="Signature" className="max-h-full max-w-full object-contain" />
                        ) : (
                          <span className="text-[10px] text-slate-400 font-bold italic">No Signature</span>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-sm">
                          <Upload size={14} />
                          <span>Upload PNG Signature</span>
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            onChange={(e) => handleFileUpload(e, 'signature')}
                            className="hidden"
                          />
                        </label>

                        {settings.signature && (
                          <div>
                            <button
                              type="button"
                              onClick={() => mutation.mutate({ ...settings, signature: '' })}
                              className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2.5 py-1 rounded-lg transition-colors"
                            >
                              <Trash2 size={13} /> Remove Signature
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <SignaturePad
                        hideNameFields={true}
                        value={settings.signature}
                        onChange={(dataUrl) => {
                          if (dataUrl) {
                            mutation.mutate({ ...settings, signature: dataUrl });
                          }
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <h3 className="font-bold text-xl border-b border-slate-100 pb-4 pt-4">Official Settlement & Bank Details</h3>
            <p className="text-xs text-slate-500 -mt-4">These details will automatically appear on all Quotations, Tax Invoices, and Payment Receipts.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Bank Name</label>
                <input name="bank_name" defaultValue={settings.bank_name || 'HDFC Bank Ltd'} placeholder="e.g. HDFC Bank Ltd" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Account Number</label>
                <input name="bank_account" defaultValue={settings.bank_account || '50200088921044'} placeholder="e.g. 50200088921044" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all font-mono" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">IFSC Code</label>
                <input name="bank_ifsc" defaultValue={settings.bank_ifsc || 'HDFC0001234'} placeholder="e.g. HDFC0001234" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all font-mono" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">UPI ID / VPA</label>
                <input name="bank_upi" defaultValue={settings.bank_upi || 'futurr@upi'} placeholder="e.g. futurr@upi" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all font-mono" />
              </div>
            </div>

            <button type="submit" disabled={mutation.isPending} className="btn-primary w-full md:w-auto px-8 flex items-center gap-2 justify-center mt-6">
              <Save size={18} /> Save Settings
            </button>
          </form>
        </div>
      )}

      {activeTab === 'org' && (
        <div className="space-y-6 animate-in fade-in">
          {renderArrayManager('Company Departments', 'departments', settings.departments, newDepartment, setNewDepartment, Building2, 'Add new department...')}
        </div>
      )}

      {activeTab === 'finance' && (
        <div className="space-y-6 animate-in fade-in">
          <form onSubmit={handleSave} className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <h3 className="font-bold text-xl border-b border-slate-100 pb-4">Financial Defaults</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Total Monthly Budget (₹)</label>
                <input name="monthlyBudget" type="number" defaultValue={settings.monthlyBudget || 0} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Default Tax / GST Rate (%)</label>
                <input name="default_tax_rate" type="number" step="0.1" defaultValue={settings.default_tax_rate || 0} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all" />
              </div>
            </div>
            <button type="submit" disabled={mutation.isPending} className="btn-primary px-8 flex items-center gap-2">
              <Save size={18} /> Save Config
            </button>
          </form>

          {renderArrayManager('Expense Categories', 'categories', settings.categories, newCategory, setNewCategory, Activity, 'Add new expense category...')}
          {renderArrayManager('Payment Methods', 'finance_payment_methods', settings.finance_payment_methods, newPaymentMethod, setNewPaymentMethod, CreditCard, 'Add new payment method...')}
        </div>
      )}

    </div>
  );
};

export default Settings;
