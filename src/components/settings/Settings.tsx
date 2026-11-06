import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/api';
import { toast } from 'react-hot-toast';
import {
  Building2, Mail, Globe, FileSignature, Image as ImageIcon,
  Plus, X, Save, CheckCircle2, Loader2, CreditCard, Users, Briefcase, 
  Settings as SettingsIcon, Shield, Activity, Target, Trash2, PenTool, Upload,
  Landmark, Check, Edit2
} from 'lucide-react';
import SignaturePad from '../document-studio/SignaturePad';
import { BankAccount } from '../document-studio/types';

const Settings: React.FC = () => {
  const queryClient = useQueryClient();
  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: api.getSettings
  });

  const [activeTab, setActiveTab] = useState('general');
  const [signatureTab, setSignatureTab] = useState<'upload' | 'draw'>('upload');
  const [isSaved, setIsSaved] = useState(false);
  
  // Multiple Bank Accounts state
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [editingBankId, setEditingBankId] = useState<string | null>(null);
  const [bankForm, setBankForm] = useState<BankAccount>({
    id: '',
    bankName: '',
    accountNumber: '',
    ifsc: '',
    accountHolder: 'Futurr Innovations and Research',
    upiId: '',
    label: '',
    isDefault: false
  });

  // Array inputs
  const [newCategory, setNewCategory] = useState('');
  const [newDepartment, setNewDepartment] = useState('');
  const [newLeadSource, setNewLeadSource] = useState('');
  const [newService, setNewService] = useState('');
  const [newPipelineStage, setNewPipelineStage] = useState('');
  const [newPaymentMethod, setNewPaymentMethod] = useState('');

  // Initialize multiple bank accounts from settings
  useEffect(() => {
    if (settings) {
      if (Array.isArray(settings.bank_accounts) && settings.bank_accounts.length > 0) {
        setBankAccounts(settings.bank_accounts);
      } else {
        const initialAccount: BankAccount = {
          id: 'bank_primary',
          bankName: settings.bank_name || 'HDFC Bank Ltd',
          accountNumber: settings.bank_account || '50200088921044',
          ifsc: settings.bank_ifsc || 'HDFC0001234',
          accountHolder: settings.companyName || 'Futurr Innovations and Research',
          upiId: settings.bank_upi || 'futurr@upi',
          label: 'Primary Current Account',
          isDefault: true
        };
        setBankAccounts([initialAccount]);
      }
    }
  }, [settings]);

  const mutation = useMutation({
    mutationFn: api.updateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      setIsSaved(true);
      toast.success('Settings saved successfully!');
      setTimeout(() => setIsSaved(false), 3500);
    },
    onError: (err: any) => {
      toast.error('Failed to save settings: ' + (err?.message || 'Unknown error'));
    }
  });

  // Bank management helpers
  const handleOpenAddBank = () => {
    setEditingBankId(null);
    setBankForm({
      id: '',
      bankName: '',
      accountNumber: '',
      ifsc: '',
      accountHolder: settings?.companyName || 'Futurr Innovations and Research',
      upiId: '',
      label: '',
      isDefault: bankAccounts.length === 0
    });
    setIsBankModalOpen(true);
  };

  const handleOpenEditBank = (acc: BankAccount) => {
    setEditingBankId(acc.id);
    setBankForm({ ...acc });
    setIsBankModalOpen(true);
  };

  const handleSaveBankAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankForm.bankName.trim() || !bankForm.accountNumber.trim()) {
      toast.error('Bank Name and Account Number are required');
      return;
    }

    let updatedList: BankAccount[];
    if (editingBankId) {
      updatedList = bankAccounts.map(b => {
        if (b.id === editingBankId) {
          return { ...bankForm, id: editingBankId };
        }
        return bankForm.isDefault ? { ...b, isDefault: false } : b;
      });
    } else {
      const newAcc: BankAccount = {
        ...bankForm,
        id: 'bank_' + Date.now(),
        isDefault: bankAccounts.length === 0 || bankForm.isDefault
      };
      updatedList = bankAccounts.map(b => newAcc.isDefault ? { ...b, isDefault: false } : b).concat(newAcc);
    }

    // Ensure at least one default
    if (!updatedList.some(b => b.isDefault)) {
      updatedList[0].isDefault = true;
    }

    setBankAccounts(updatedList);
    setIsBankModalOpen(false);
    setEditingBankId(null);

    const defaultAcc = updatedList.find(b => b.isDefault) || updatedList[0];
    mutation.mutate({
      ...settings,
      bank_accounts: updatedList,
      bank_name: defaultAcc?.bankName,
      bank_account: defaultAcc?.accountNumber,
      bank_ifsc: defaultAcc?.ifsc,
      bank_upi: defaultAcc?.upiId
    });
  };

  const handleSetDefaultBank = (id: string) => {
    const updated = bankAccounts.map(b => ({
      ...b,
      isDefault: b.id === id
    }));
    setBankAccounts(updated);
    const defaultAcc = updated.find(b => b.id === id);
    mutation.mutate({
      ...settings,
      bank_accounts: updated,
      bank_name: defaultAcc?.bankName,
      bank_account: defaultAcc?.accountNumber,
      bank_ifsc: defaultAcc?.ifsc,
      bank_upi: defaultAcc?.upiId
    });
    toast.success(`${defaultAcc?.bankName} set as primary bank account!`);
  };

  const handleDeleteBank = (id: string) => {
    if (bankAccounts.length <= 1) {
      toast.error('At least one bank account must remain');
      return;
    }
    const updated = bankAccounts.filter(b => b.id !== id);
    if (!updated.some(b => b.isDefault)) {
      updated[0].isDefault = true;
    }
    setBankAccounts(updated);
    const defaultAcc = updated.find(b => b.isDefault) || updated[0];
    mutation.mutate({
      ...settings,
      bank_accounts: updated,
      bank_name: defaultAcc?.bankName,
      bank_account: defaultAcc?.accountNumber,
      bank_ifsc: defaultAcc?.ifsc,
      bank_upi: defaultAcc?.upiId
    });
    toast.success('Bank account removed');
  };

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
      updates.bank_accounts = bankAccounts;
      const defAcc = bankAccounts.find(b => b.isDefault) || bankAccounts[0];
      if (defAcc) {
        updates.bank_name = defAcc.bankName;
        updates.bank_account = defAcc.accountNumber;
        updates.bank_ifsc = defAcc.ifsc;
        updates.bank_upi = defAcc.upiId;
      }
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

            {/* Multiple Bank Accounts Section */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-xl text-slate-800">Official Settlement &amp; Bank Accounts</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Configure multiple company bank accounts. Choose a primary default, and easily switch between them on any quotation or invoice.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleOpenAddBank}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-colors border border-indigo-200 self-start sm:self-auto shrink-0"
                >
                  <Plus size={15} />
                  <span>Add Bank Account</span>
                </button>
              </div>

              {/* Bank Accounts Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {bankAccounts.map((acc) => (
                  <div
                    key={acc.id}
                    className={`p-4 rounded-2xl border transition-all relative ${
                      acc.isDefault
                        ? 'bg-indigo-50/40 border-indigo-300 shadow-sm ring-1 ring-indigo-500/20'
                        : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${acc.isDefault ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-700'}`}>
                          <Landmark size={16} />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-slate-900">{acc.bankName}</h4>
                          <span className="text-[10px] font-semibold text-slate-500">{acc.label || 'Business Account'}</span>
                        </div>
                      </div>

                      {acc.isDefault ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <Check size={11} /> Primary Default
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSetDefaultBank(acc.id)}
                          className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline"
                        >
                          Set as Default
                        </button>
                      )}
                    </div>

                    <div className="space-y-1 text-xs text-slate-600 mt-3 pt-3 border-t border-slate-200/60 font-mono">
                      <div>
                        <span className="text-slate-400 font-sans text-[11px] font-medium mr-1.5">A/C:</span>
                        <span className="font-bold text-slate-800">{acc.accountNumber}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-sans text-[11px] font-medium mr-1.5">IFSC:</span>
                        <span className="font-bold text-slate-800">{acc.ifsc}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-sans text-[11px] font-medium mr-1.5">UPI:</span>
                        <span className="font-bold text-indigo-700">{acc.upiId || 'N/A'}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 mt-3 pt-2 border-t border-slate-200/50">
                      <button
                        type="button"
                        onClick={() => handleOpenEditBank(acc)}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 hover:text-slate-900 px-2 py-1 rounded hover:bg-white transition-colors"
                      >
                        <Edit2 size={12} /> Edit
                      </button>
                      {bankAccounts.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleDeleteBank(acc.id)}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-500 hover:text-rose-700 px-2 py-1 rounded hover:bg-rose-50 transition-colors"
                        >
                          <Trash2 size={12} /> Delete
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {bankAccounts.length === 0 && (
                  <div className="col-span-2 text-center p-6 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-slate-400 text-xs font-medium">
                    No bank accounts configured. Click &quot;Add Bank Account&quot; to add your company settlement account.
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={mutation.isPending}
              className={`w-full md:w-auto px-8 py-3 rounded-xl font-bold flex items-center gap-2 justify-center mt-6 transition-all shadow-md ${
                isSaved
                  ? 'bg-emerald-600 text-white shadow-emerald-200 hover:bg-emerald-700'
                  : 'btn-primary'
              }`}
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="animate-spin" size={18} /> Saving Settings...
                </>
              ) : isSaved ? (
                <>
                  <CheckCircle2 size={18} /> Saved!
                </>
              ) : (
                <>
                  <Save size={18} /> Save Settings
                </>
              )}
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
            <button
              type="submit"
              disabled={mutation.isPending}
              className={`px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-md ${
                isSaved
                  ? 'bg-emerald-600 text-white shadow-emerald-200 hover:bg-emerald-700'
                  : 'btn-primary'
              }`}
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="animate-spin" size={18} /> Saving Config...
                </>
              ) : isSaved ? (
                <>
                  <CheckCircle2 size={18} /> Saved!
                </>
              ) : (
                <>
                  <Save size={18} /> Save Config
                </>
              )}
            </button>
          </form>

          {renderArrayManager('Expense Categories', 'categories', settings.categories, newCategory, setNewCategory, Activity, 'Add new expense category...')}
          {renderArrayManager('Payment Methods', 'finance_payment_methods', settings.finance_payment_methods, newPaymentMethod, setNewPaymentMethod, CreditCard, 'Add new payment method...')}
        </div>
      )}

      {/* Add / Edit Bank Account Modal */}
      {isBankModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <Landmark size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900">
                    {editingBankId ? 'Edit Bank Account' : 'Add New Bank Account'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Company settlement account for invoices &amp; receipts
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsBankModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveBankAccount} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700">Bank Name *</label>
                  <input
                    type="text"
                    required
                    value={bankForm.bankName}
                    onChange={(e) => setBankForm(prev => ({ ...prev, bankName: e.target.value }))}
                    placeholder="e.g. HDFC Bank Ltd / ICICI Bank"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700">Account Label / Nickname</label>
                  <input
                    type="text"
                    value={bankForm.label || ''}
                    onChange={(e) => setBankForm(prev => ({ ...prev, label: e.target.value }))}
                    placeholder="e.g. Primary Current Account / Robotics Escrow"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700">Account Number *</label>
                  <input
                    type="text"
                    required
                    value={bankForm.accountNumber}
                    onChange={(e) => setBankForm(prev => ({ ...prev, accountNumber: e.target.value }))}
                    placeholder="e.g. 50200088921044"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">IFSC Code *</label>
                  <input
                    type="text"
                    required
                    value={bankForm.ifsc}
                    onChange={(e) => setBankForm(prev => ({ ...prev, ifsc: e.target.value }))}
                    placeholder="e.g. HDFC0001234"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white uppercase"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">UPI ID / VPA</label>
                  <input
                    type="text"
                    value={bankForm.upiId}
                    onChange={(e) => setBankForm(prev => ({ ...prev, upiId: e.target.value }))}
                    placeholder="e.g. futurr@upi"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-indigo-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700">Account Holder Name</label>
                  <input
                    type="text"
                    value={bankForm.accountHolder}
                    onChange={(e) => setBankForm(prev => ({ ...prev, accountHolder: e.target.value }))}
                    placeholder="e.g. Futurr Innovations and Research"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white"
                  />
                </div>

                <div className="sm:col-span-2 flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="isDefaultBankCheck"
                    checked={bankForm.isDefault}
                    onChange={(e) => setBankForm(prev => ({ ...prev, isDefault: e.target.checked }))}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                  />
                  <label htmlFor="isDefaultBankCheck" className="text-xs font-semibold text-slate-700 cursor-pointer select-none">
                    Set as default primary account for newly generated documents
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsBankModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-200 transition-all flex items-center gap-2"
                >
                  <Save size={15} />
                  <span>{editingBankId ? 'Update Bank Account' : 'Save Account'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Settings;
