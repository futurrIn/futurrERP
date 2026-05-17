import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/api';
import {
  Building2,
  Mail,
  Globe,
  FileSignature,
  Image as ImageIcon,
  Plus,
  X,
  Save,
  CheckCircle2,
  Loader2
} from 'lucide-react';

const Settings: React.FC = () => {
  const queryClient = useQueryClient();
  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: api.getSettings
  });

  const [isSaved, setIsSaved] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [newDepartment, setNewDepartment] = useState('');

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
    const updates = {
      ...settings,
      companyName: formData.get('companyName') as string,
      companyAddress: formData.get('companyAddress') as string,
      supportEmail: formData.get('supportEmail') as string,
      websiteUrl: formData.get('websiteUrl') as string,
      gst: formData.get('gst') as string,
      password: formData.get('password') as string,
      primaryColor: formData.get('primaryColor') as string,
      secondaryColor: formData.get('secondaryColor') as string,
    };

    mutation.mutate(updates);
  };

  const addCategory = async () => {
    if (!newCategory) return;
    mutation.mutate({
      ...settings,
      categories: [...settings.categories, newCategory]
    });
    setNewCategory('');
  };

  const removeCategory = async (cat: string) => {
    mutation.mutate({
      ...settings,
      categories: settings.categories.filter((c: string) => c !== cat)
    });
  };

  const addDepartment = async () => {
    if (!newDepartment) return;
    mutation.mutate({
      ...settings,
      departments: [...(settings.departments || []), newDepartment]
    });
    setNewDepartment('');
  };

  const removeDepartment = async (dept: string) => {
    mutation.mutate({
      ...settings,
      departments: settings.departments.filter((d: string) => d !== dept)
    });
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

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Admin Settings</h2>
          <p className="text-slate-500">Configure your company branding and receipt defaults.</p>
        </div>
        {isSaved && (
          <div className="flex items-center gap-2 text-emerald-600 font-medium animate-in fade-in slide-in-from-right-4">
            <CheckCircle2 size={20} />
            Settings saved
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Company Info */}
        <div className="lg:col-span-2 space-y-8">
          <form onSubmit={handleSave} className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center gap-2 text-indigo-600 mb-2">
              <Building2 size={20} />
              <h3 className="font-bold text-lg text-slate-800">Company Information</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Company Name</label>
                <input
                  name="companyName"
                  defaultValue={settings.companyName}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">GST Number (Optional)</label>
                <input
                  name="gst"
                  defaultValue={settings.gst}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Support Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    name="supportEmail"
                    defaultValue={settings.supportEmail}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Website URL</label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    name="websiteUrl"
                    defaultValue={settings.websiteUrl}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-slate-100">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">System Password</label>
                  <input
                    name="password"
                    type="password"
                    defaultValue={settings.password}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Primary Color</label>
                  <div className="flex gap-2">
                    <input
                      name="primaryColor"
                      type="color"
                      defaultValue={settings.primaryColor || '#4f46e5'}
                      className="w-12 h-10 p-1 bg-white border border-slate-200 rounded-xl cursor-pointer"
                    />
                    <input
                      type="text"
                      value={settings.primaryColor || '#4f46e5'}
                      readOnly
                      className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Secondary Color</label>
                  <div className="flex gap-2">
                    <input
                      name="secondaryColor"
                      type="color"
                      defaultValue={settings.secondaryColor || '#9333ea'}
                      className="w-12 h-10 p-1 bg-white border border-slate-200 rounded-xl cursor-pointer"
                    />
                    <input
                      type="text"
                      value={settings.secondaryColor || '#9333ea'}
                      readOnly
                      className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-medium text-slate-700">Address</label>
                <textarea
                  name="companyAddress"
                  defaultValue={settings.companyAddress}
                  rows={3}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                />
              </div>
            </div>

            <button type="submit" className="btn-primary w-full md:w-auto px-8 flex items-center gap-2 justify-center">
              <Save size={18} />
              Save Changes
            </button>
          </form>

          {/* Categories */}
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-lg mb-6">Service Categories</h3>
            <div className="flex flex-wrap gap-2 mb-6">
              {settings.categories.map((cat: string) => (
                <div key={cat} className="group flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-full text-sm font-medium">
                  {cat}
                  <button onClick={() => removeCategory(cat)} className="text-slate-400 hover:text-rose-500 transition-colors">
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="Add new category..."
                className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
              <button
                onClick={addCategory}
                className="p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all"
              >
                <Plus size={24} />
              </button>
            </div>
          </div>

          {/* Departments */}
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm mt-8">
            <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
              <Building2 size={20} className="text-indigo-600"/> 
              Company Departments
            </h3>
            <div className="flex flex-wrap gap-2 mb-6">
              {settings.departments?.map((dept: string) => (
                <div key={dept} className="group flex items-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-full text-sm font-medium text-indigo-800">
                  {dept}
                  <button onClick={() => removeDepartment(dept)} className="text-indigo-400 hover:text-rose-500 transition-colors">
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={newDepartment}
                onChange={(e) => setNewDepartment(e.target.value)}
                placeholder="Add new department..."
                className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
              <button
                onClick={addDepartment}
                className="p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all"
              >
                <Plus size={24} />
              </button>
            </div>
          </div>
        </div>

        {/* Assets Upload */}
        <div className="space-y-8">
          {/* Logo Upload */}
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-center">
            <div className="flex items-center justify-center gap-2 text-slate-800 mb-6 font-bold">
              <ImageIcon size={20} />
              Company Logo (16:9)
            </div>
            <div className="relative group mx-auto w-full aspect-[16/9] mb-4 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden p-4">
              {settings.logo ? (
                <img src={settings.logo} alt="Logo" className="w-full h-full object-contain" />
              ) : (
                <img src="/logo.svg" alt="Default Logo" className="w-16 h-16 object-contain opacity-20" />
              )}
              <label className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer flex items-center justify-center text-white text-xs font-bold">
                Change Logo
                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'logo')} />
              </label>
            </div>
            <p className="text-xs text-slate-500">Recommended: 16:9 Aspect Ratio (e.g., 1600x900px)</p>
          </div>

          {/* Signature Upload */}
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-center">
            <div className="flex items-center justify-center gap-2 text-slate-800 mb-6 font-bold">
              <FileSignature size={20} />
              Authorized Signature
            </div>
            <div className="relative group mx-auto w-48 h-24 mb-4 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden">
              {settings.signature ? (
                <img src={settings.signature} alt="Signature" className="w-full h-full object-contain p-2" />
              ) : (
                <FileSignature className="text-slate-300" size={32} />
              )}
              <label className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer flex items-center justify-center text-white text-xs font-bold">
                Update Signature
                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'signature')} />
              </label>
            </div>
            {settings.signature && (
              <button 
                type="button" 
                onClick={() => mutation.mutate({ ...settings, signature: '' })}
                className="mb-4 text-xs font-bold text-rose-500 hover:text-rose-700 transition-colors uppercase tracking-widest flex items-center gap-1.5 justify-center mx-auto"
              >
                <X size={14} />
                Remove Signature
              </button>
            )}
            <p className="text-xs text-slate-500">Recommended: Transparent PNG signature</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
