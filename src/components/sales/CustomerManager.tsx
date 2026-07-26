import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/api';
import { Users, Search, PlusCircle, User, Phone, Mail, FileText, Edit, ChevronRight, Building2, GraduationCap, Building } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useForm } from 'react-hook-form';

const CUSTOMER_TYPES = [
  'Individual',
  'Student',
  'Business / Company',
  'College / Institution',
  'Vendor / Supplier'
];

const CustomerManager = ({ onCustomerSelect }: { onCustomerSelect?: (id: number) => void }) => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingCustomerId, setEditingCustomerId] = useState<number | null>(null);
  
  const { register, handleSubmit, reset, watch, setValue } = useForm({
    defaultValues: {
      name: '',
      company: '',
      phone: '',
      email: '',
      gst: '',
      customer_type: 'Individual',
      dynamic_fields: {} as any
    }
  });

  const customerType = watch('customer_type');

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: api.getCustomers
  });

  const { data: sales = [] } = useQuery({
    queryKey: ['sales'],
    queryFn: api.getSales
  });

  const mutation = useMutation({
    mutationFn: (data: any) => {
      if (editingCustomerId) {
        return api.updateCustomer(editingCustomerId, data);
      }
      return api.createCustomer(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success(editingCustomerId ? 'Customer updated successfully!' : 'Customer created successfully!');
      setShowForm(false);
      setEditingCustomerId(null);
      reset({ name: '', company: '', phone: '', email: '', gst: '', customer_type: 'Individual', dynamic_fields: {} });
    },
    onError: (err: any) => {
      toast.error('Operation failed: ' + err.message);
    }
  });

  const onSubmit = (data: any) => {
    mutation.mutate(data);
  };

  const handleEdit = (e: React.MouseEvent, customer: any) => {
    e.stopPropagation(); // prevent row click
    setEditingCustomerId(customer.id);
    reset({
      name: customer.name || '',
      company: customer.company || '',
      phone: customer.phone || '',
      email: customer.email || '',
      gst: customer.gst || '',
      customer_type: customer.customer_type || 'Individual',
      dynamic_fields: customer.dynamic_fields || {}
    });
    setShowForm(true);
  };

  const filtered = customers.filter((c: any) => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = activeCategory ? (c.customer_type || 'Individual') === activeCategory : true;

    return matchesSearch && matchesCategory;
  });

  const getCategoryIcon = (type: string) => {
    switch(type) {
      case 'Student': return <GraduationCap size={16} className="text-blue-500" />;
      case 'Business / Company': return <Building2 size={16} className="text-emerald-500" />;
      case 'College / Institution': return <Building size={16} className="text-purple-500" />;
      default: return <User size={16} className="text-slate-500" />;
    }
  };

  const getCategoryColor = (type: string) => {
    switch(type) {
      case 'Student': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Business / Company': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'College / Institution': return 'bg-purple-50 text-purple-700 border-purple-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Users className="text-indigo-600" /> Customers
          </h2>
          <p className="text-slate-500 text-sm mt-1">Manage client profiles across different business models.</p>
        </div>
        <button 
          onClick={() => {
            if (showForm) {
              setShowForm(false);
              setEditingCustomerId(null);
              reset({ name: '', company: '', phone: '', email: '', gst: '', customer_type: 'Individual', dynamic_fields: {} });
            } else {
              setShowForm(true);
            }
          }}
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
        >
          {showForm ? 'Cancel' : <><PlusCircle size={20} /> Add Customer</>}
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm animate-in zoom-in-95 duration-200">
          <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
            {editingCustomerId ? 'Edit Customer Profile' : 'New Customer Profile'}
          </h3>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            
            {/* Core Information */}
            <div className="space-y-6">
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Customer Type *</label>
                  <select {...register('customer_type', { required: true })} className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 font-bold text-indigo-900 shadow-sm">
                    {CUSTOMER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Full Name / Primary Contact *</label>
                  <input {...register('name', { required: true })} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20" placeholder="John Doe" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Phone</label>
                  <input {...register('phone')} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20" placeholder="+91 98765 43210" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Email</label>
                  <input type="email" {...register('email')} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20" placeholder="john@example.com" />
                </div>
                
                {customerType !== 'Student' && customerType !== 'Individual' && (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">Company / Organization Name</label>
                      <input {...register('company')} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20" placeholder="Acme Corp" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">GST Number</label>
                      <input {...register('gst')} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20" placeholder="22AAAAA0000A1Z5" />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Dynamic Fields based on Type */}
            {customerType === 'Student' && (
              <div className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100 space-y-6">
                <h4 className="font-bold text-indigo-900 flex items-center gap-2 border-b border-indigo-100 pb-2">
                  <GraduationCap size={18} /> Academic Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">College Name</label>
                    <input {...register('dynamic_fields.collegeName')} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Degree / Course</label>
                    <input {...register('dynamic_fields.degree')} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none" placeholder="B.Tech Computer Science" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Graduation Year</label>
                    <input type="number" {...register('dynamic_fields.graduationYear')} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none" placeholder="2027" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Student ID / Roll No</label>
                    <input {...register('dynamic_fields.studentId')} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none" />
                  </div>
                </div>
              </div>
            )}

            {customerType === 'Business / Company' && (
              <div className="bg-emerald-50/50 p-6 rounded-2xl border border-emerald-100 space-y-6">
                <h4 className="font-bold text-emerald-900 flex items-center gap-2 border-b border-emerald-100 pb-2">
                  <Building2 size={18} /> Business Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Industry</label>
                    <input {...register('dynamic_fields.industry')} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none" placeholder="IT / Manufacturing" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Company Logo URL (Optional)</label>
                    <input {...register('dynamic_fields.logoUrl')} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none" placeholder="https://..." />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-bold text-slate-700">Address</label>
                    <textarea {...register('dynamic_fields.address')} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none" rows={2}></textarea>
                  </div>
                </div>
              </div>
            )}

            {customerType === 'College / Institution' && (
              <div className="bg-purple-50/50 p-6 rounded-2xl border border-purple-100 space-y-6">
                <h4 className="font-bold text-purple-900 flex items-center gap-2 border-b border-purple-100 pb-2">
                  <Building size={18} /> Institution Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Contact Person Designation</label>
                    <input {...register('dynamic_fields.contactDesignation')} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none" placeholder="HOD / Placement Officer" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Partnership Status</label>
                    <select {...register('dynamic_fields.partnershipStatus')} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none">
                      <option value="Active">Active Partner</option>
                      <option value="Prospect">Prospect</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-bold text-slate-700">Institution Address</label>
                    <textarea {...register('dynamic_fields.address')} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none" rows={2}></textarea>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-4 gap-3">
              {editingCustomerId && (
                <button 
                  type="button" 
                  onClick={() => {
                    setShowForm(false);
                    setEditingCustomerId(null);
                    reset();
                  }}
                  className="px-6 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
              )}
              <button type="submit" disabled={mutation.isPending} className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg">
                {mutation.isPending ? 'Saving...' : (editingCustomerId ? 'Update Profile' : 'Create Profile')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Category Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {CUSTOMER_TYPES.filter(t => t !== 'Vendor / Supplier').map(type => {
          const count = customers.filter((c: any) => (c.customer_type || 'Individual') === type).length;
          return (
            <div 
              key={type} 
              className={`bg-white p-5 rounded-2xl border shadow-sm flex items-center gap-4 cursor-pointer transition-colors ${activeCategory === type ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-slate-200 hover:border-indigo-300'}`} 
              onClick={() => setActiveCategory(activeCategory === type ? null : type)}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getCategoryColor(type)}`}>
                {getCategoryIcon(type)}
              </div>
              <div>
                <div className="text-2xl font-black text-slate-800">{count}</div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">{type === 'Business / Company' ? 'Businesses' : type + 's'}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center gap-4 bg-slate-50/50">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              placeholder="Search by name, company, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all shadow-sm"
            />
          </div>
          <div className="text-sm text-slate-500 font-medium px-2">
            Showing {filtered.length} customers
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50/50 border-b border-slate-200">
              <tr>
                <th className="text-left text-xs font-bold text-slate-500 uppercase p-4 px-6">Customer Profile</th>
                <th className="text-left text-xs font-bold text-slate-500 uppercase p-4">Category</th>
                <th className="text-left text-xs font-bold text-slate-500 uppercase p-4">Contact</th>
                <th className="text-right text-xs font-bold text-slate-500 uppercase p-4">Revenue</th>
                <th className="text-right text-xs font-bold text-slate-500 uppercase p-4 px-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((c: any) => {
                const customerSales = sales.filter((s: any) => s.customer_id === c.id);
                const totalRev = customerSales.reduce((sum: number, s: any) => sum + (s.final_amount || 0), 0);
                const type = c.customer_type || 'Individual';
                
                return (
                  <tr 
                    key={c.id} 
                    onClick={() => onCustomerSelect && onCustomerSelect(c.id)}
                    className="hover:bg-slate-50 transition-all cursor-pointer group"
                  >
                    <td className="p-4 px-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-lg shadow-sm border border-indigo-100 group-hover:scale-105 transition-transform">
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-slate-800 text-base">{c.name}</div>
                          {c.company && <div className="text-xs font-medium text-slate-500 mt-0.5">{c.company}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${getCategoryColor(type)}`}>
                        {getCategoryIcon(type)}
                        {type}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1.5 text-sm text-slate-600">
                        {c.phone ? <span className="flex items-center gap-2"><Phone size={14} className="text-slate-400" /> {c.phone}</span> : <span className="text-slate-300">-</span>}
                        {c.email ? <span className="flex items-center gap-2"><Mail size={14} className="text-slate-400" /> {c.email}</span> : null}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="text-sm font-black text-emerald-600">₹{totalRev.toLocaleString('en-IN')}</div>
                      <div className="text-xs text-slate-400 font-medium mt-0.5">{customerSales.length} Projects</div>
                    </td>
                    <td className="p-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={(e) => handleEdit(e, c)}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Edit Customer"
                        >
                          <Edit size={18} />
                        </button>
                        <button 
                          className="p-2 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all"
                        >
                          <ChevronRight size={20} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-slate-500">
                    <div className="flex flex-col items-center gap-3">
                      <Users size={48} className="text-slate-300" />
                      <p className="font-medium text-lg">No customers found</p>
                      <p className="text-sm text-slate-400">Try adjusting your search or add a new customer.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CustomerManager;
