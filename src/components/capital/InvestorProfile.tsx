import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/api';
import { ArrowLeft, Building2, Phone, Mail, FileText, ArrowDownRight } from 'lucide-react';
import { format } from 'date-fns';

interface InvestorProfileProps {
  investorId: string;
  onBack: () => void;
}

const InvestorProfile: React.FC<InvestorProfileProps> = ({ investorId, onBack }) => {
  const { data: investors = [] } = useQuery({
    queryKey: ['investors'],
    queryFn: api.getInvestors
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ['capital_transactions'],
    queryFn: api.getCapitalTransactions
  });

  const profile = investors.find((i: any) => i.id === investorId);
  const profileTransactions = transactions.filter((t: any) => t.investor_id === investorId);

  const totalInjected = profileTransactions.reduce((sum: number, t: any) => sum + (t.amount || 0), 0);
  const totalLoans = profileTransactions.filter((t: any) => t.type === 'Loan').reduce((sum: number, t: any) => sum + (t.amount || 0), 0);
  const totalEquity = profileTransactions.filter((t: any) => t.type === 'Equity').reduce((sum: number, t: any) => sum + (t.amount || 0), 0);

  if (!profile) return null;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-bold text-sm transition-colors"
      >
        <ArrowLeft size={16} /> Back to Investors
      </button>

      {/* Header Card */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute -right-10 -top-10 opacity-5 text-indigo-600">
          <Building2 size={200} />
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row gap-6 md:gap-8 items-start md:items-center">
          <div className="w-24 h-24 rounded-3xl bg-indigo-50 flex items-center justify-center flex-shrink-0 text-indigo-600 font-black text-4xl shadow-inner border border-indigo-100">
            {profile.name.charAt(0).toUpperCase()}
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-3xl font-black text-slate-800 tracking-tight">{profile.name}</h2>
              <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-bold uppercase tracking-wider">
                {profile.type}
              </span>
            </div>
            
            <div className="flex flex-wrap items-center gap-4 md:gap-6 mt-4">
              {profile.company && (
                <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                  <Building2 size={16} className="text-slate-400" /> {profile.company}
                </div>
              )}
              {profile.phone && (
                <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                  <Phone size={16} className="text-slate-400" /> {profile.phone}
                </div>
              )}
              {profile.email && (
                <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                  <Mail size={16} className="text-slate-400" /> {profile.email}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Total Capital Injected</p>
          <p className="text-3xl font-black text-indigo-600 tracking-tight">₹{totalInjected.toLocaleString()}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Total Loans (Debt)</p>
          <p className="text-3xl font-black text-orange-600 tracking-tight">₹{totalLoans.toLocaleString()}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Total Equity</p>
          <p className="text-3xl font-black text-emerald-600 tracking-tight">₹{totalEquity.toLocaleString()}</p>
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <FileText className="text-indigo-600" /> Transaction History
          </h3>
        </div>
        
        <div className="divide-y divide-slate-100">
          {profileTransactions.length > 0 ? (
            profileTransactions.map((t: any) => (
              <div key={t.id} className="p-6 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    t.type === 'Loan' ? 'bg-orange-50 text-orange-600' : 'bg-emerald-50 text-emerald-600'
                  }`}>
                    <ArrowDownRight size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800">{t.type} Injection</h4>
                    <p className="text-sm font-medium text-slate-500 flex items-center gap-2 mt-1">
                      {format(new Date(t.created_at), 'dd MMM yyyy, hh:mm a')}
                      {t.payment_method && <span className="px-2 py-0.5 rounded bg-slate-100 text-xs">{t.payment_method}</span>}
                    </p>
                    {t.notes && <p className="text-xs text-slate-400 mt-1 italic">"{t.notes}"</p>}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-black text-slate-800 tracking-tight">₹{t.amount.toLocaleString()}</div>
                  {t.transaction_id && <div className="text-xs font-medium text-slate-400 mt-1">Ref: {t.transaction_id}</div>}
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center text-slate-500 font-medium">
              No capital transactions recorded yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvestorProfile;
