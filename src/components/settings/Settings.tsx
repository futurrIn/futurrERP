import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/api';
import {
  Building2, Mail, Globe, FileSignature, Image as ImageIcon,
  Plus, X, Save, CheckCircle2, Loader2, CreditCard, Users, Briefcase, 
  Settings as SettingsIcon, Shield, Activity, Target
} from 'lucide-react';

const Settings: React.FC = () => {
  const queryClient = useQueryClient();
  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: api.getSettings
  });

  const [activeTab, setActiveTab] = useState('general');
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
      updates.companyAddress = formData.get('companyAddress') as string;
      updates.supportEmail = formData.get('supportEmail') as string;
      updates.websiteUrl = formData.get('websiteUrl') as string;
      updates.gst = formData.get('gst') as string;
      updates.password = formData.get('password') as string;
      updates.primaryColor = formData.get('primaryColor') as string;
      updates.secondaryColor = formData.get('secondaryColor') as string;
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
          { id: 'finance', label: 'Finance Config', icon: CreditCard },
          { id: 'crm', label: 'Sales CRM', icon: Target }
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
                  <input name="companyName" defaultValue={settings.companyName} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all" />
                </div>
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
              <div className="space-y-3">
                <label className="text-sm font-medium text-slate-700 flex items-center justify-between">
                  <span>Company Logo</span>
                  <ImageIcon size={16} className="text-slate-400" />
                </label>
                <div className="flex items-center gap-4">
                  {settings.logo && (
                    <img src={settings.logo} alt="Logo" className="h-12 object-contain bg-slate-50 p-1 rounded-lg border border-slate-200" />
                  )}
                  <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'logo')} className="text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium text-slate-700 flex items-center justify-between">
                  <span>Authorized Signature</span>
                  <FileSignature size={16} className="text-slate-400" />
                </label>
                <div className="flex items-center gap-4">
                  {settings.signature && (
                    <img src={settings.signature} alt="Signature" className="h-12 object-contain bg-slate-50 p-1 rounded-lg border border-slate-200" />
                  )}
                  <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'signature')} className="text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
                </div>
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

      {activeTab === 'crm' && (
        <div className="space-y-6 animate-in fade-in">
          {renderArrayManager('Products & Services', 'crm_services', settings.crm_services, newService, setNewService, Briefcase, 'Add a product or service...')}
          {renderArrayManager('Lead Sources', 'crm_lead_sources', settings.crm_lead_sources, newLeadSource, setNewLeadSource, Globe, 'Add a lead source (e.g. LinkedIn)...')}
          {renderArrayManager('Pipeline Stages', 'crm_pipeline_stages', settings.crm_pipeline_stages, newPipelineStage, setNewPipelineStage, Target, 'Add a pipeline stage (e.g. Meeting Scheduled)...')}
        </div>
      )}

    </div>
  );
};

export default Settings;
