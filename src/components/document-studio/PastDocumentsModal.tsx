import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  X, 
  Search, 
  FileSpreadsheet, 
  FileText, 
  Receipt, 
  Download, 
  Edit3, 
  Trash2, 
  FolderArchive, 
  Clock, 
  Building2,
  Calendar,
  CheckCircle2
} from 'lucide-react';
import { api } from '../../api/api';
import { DocumentData, DocumentMode } from './types';
import { toast } from 'react-hot-toast';
import { formatINR } from './utils/calculations';

interface PastDocumentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadDocument: (docData: DocumentData, saleId: number) => void;
  onDirectExportPDF?: (docData: DocumentData) => void;
}

export const PastDocumentsModal: React.FC<PastDocumentsModalProps> = ({
  isOpen,
  onClose,
  onLoadDocument
}) => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filterMode, setFilterMode] = useState<string>('all');

  const { data: sales = [], isLoading } = useQuery({
    queryKey: ['sales'],
    queryFn: api.getSales,
    enabled: isOpen
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.deleteSale(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      toast.success('Document deleted successfully');
    },
    onError: (err: any) => {
      toast.error('Failed to delete: ' + (err?.message || 'Unknown error'));
    }
  });

  if (!isOpen) return null;

  // Filter sales that correspond to documents (either have dynamic_fields or are Quotation/Product Sales)
  const documents = sales.filter((s: any) => {
    const df = s.dynamic_fields || {};
    const hasDocNum = Boolean(df.documentNumber || s.project_name);
    return hasDocNum;
  });

  const filteredDocs = documents.filter((s: any) => {
    const df = s.dynamic_fields || {};
    const docNum = (df.documentNumber || s.project_name || '').toLowerCase();
    const customer = (s.customers?.name || df.customerName || '').toLowerCase();
    const company = (s.customers?.company || df.customerCompany || '').toLowerCase();
    const query = search.toLowerCase();

    const matchesSearch = docNum.includes(query) || customer.includes(query) || company.includes(query);

    const docMode = df.mode || (s.category?.toLowerCase().includes('quotation') ? 'quotation' : 'invoice');
    const matchesFilter = filterMode === 'all' || docMode === filterMode;

    return matchesSearch && matchesFilter;
  });

  const getDocBadge = (mode: string) => {
    switch (mode) {
      case 'invoice':
        return {
          label: 'TAX INVOICE',
          icon: FileText,
          bg: 'bg-emerald-100 text-emerald-800 border-emerald-300'
        };
      case 'receipt':
        return {
          label: 'RECEIPT',
          icon: Receipt,
          bg: 'bg-indigo-100 text-indigo-800 border-indigo-300'
        };
      default:
        return {
          label: 'QUOTATION',
          icon: FileSpreadsheet,
          bg: 'bg-amber-100 text-amber-800 border-amber-300'
        };
    }
  };

  const handleSelectToEdit = (sale: any) => {
    const df = sale.dynamic_fields || {};
    
    // Construct full DocumentData from saved record
    const loadedData: DocumentData = df.fullDocData || {
      id: sale.id,
      mode: df.mode || (sale.category?.toLowerCase().includes('quotation') ? 'quotation' : 'invoice'),
      documentNumber: df.documentNumber || sale.project_name || `DOC-${sale.id}`,
      issueDate: df.issueDate || sale.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
      dueDate: df.dueDate || sale.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
      customerId: sale.customer_id,
      customerName: sale.customers?.name || df.customerName || 'Contact not recorded',
      customerCompany: sale.customers?.company || df.customerCompany || '',
      customerAddress: sale.customers?.dynamic_fields?.address || df.venue || 'Mumbai, Maharashtra',
      customerEmail: sale.customers?.email || df.customerEmail || '',
      customerPhone: sale.customers?.phone || df.customerPhone || '',
      customerGst: sale.customers?.gst || df.customerGst || '',
      venue: df.venue || 'Mumbai, Maharashtra',
      bookingRef: df.bookingRef || `FUT-${sale.id}`,
      items: df.items && df.items.length > 0 ? df.items : [
        {
          id: 'item_1',
          name: sale.service_product || 'Robotics Services',
          category: 'Service',
          quantity: 1,
          rate: sale.amount || 0,
          amount: sale.amount || 0
        }
      ],
      transportCharges: df.transportCharges || 0,
      discount: sale.discount || df.discount || 0,
      gstType: df.gstType || (sale.tax > 0 ? 'cgst_sgst' : 'exempt'),
      gstRate: df.gstRate || 18,
      logoUrl: df.logoUrl || '/logo.svg',
      companyName: df.companyName || 'Futurr Innovations and Research',
      companyTagline: df.companyTagline || 'Advanced Humanoid & Quadruped Robotics, High-Tech Stage Deployments & Automation',
      companyAddress: df.companyAddress || 'first floor Ak building, oppsosite KSRTC, Mannarcad Road, Perinthalmanna, Malappuram, Kerala-679322',
      brandPreset: df.brandPreset || 'Neo-Core',
      badgeBg: df.badgeBg || 'dark',
      signatoryName: df.signatoryName || 'Albin - Operations Lead',
      signatoryDesignation: df.signatoryDesignation || 'Authorized Signatory, Futurr Innovations and Research',
      termsAndConditions: df.termsAndConditions || 'Bank transfer / NEFT / UPI settlement prior to dispatch. All bookings subject to operator safety clearance and technical verification.',
      bankDetails: df.bankDetails || {
        bankName: 'HDFC Bank Ltd',
        accountNumber: '50200088921044',
        ifsc: 'HDFC0001234',
        accountHolder: 'Futurr Innovations and Research',
        upiId: 'futurr@upi'
      }
    };

    onLoadDocument(loadedData, sale.id);
    onClose();
    toast.success(`Loaded document ${loadedData.documentNumber} for editing!`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-in fade-in">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95">
        {/* Modal Header */}
        <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-black">
              <FolderArchive size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg text-slate-900">Past Documents Archive</h3>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  {documents.length} records
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Browse, open, edit, or re-export past quotations, tax invoices &amp; receipts
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Filter and Search Bar */}
        <div className="p-4 sm:px-6 bg-slate-50 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Document #, Customer Name, or Company..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-purple-500/20"
            />
          </div>

          {/* Type Filter Pills */}
          <div className="flex items-center gap-1 p-1 bg-white border border-slate-200 rounded-xl overflow-x-auto shrink-0 scrollbar-hide">
            {[
              { id: 'all', label: 'All' },
              { id: 'quotation', label: 'Quotations' },
              { id: 'invoice', label: 'Invoices' },
              { id: 'receipt', label: 'Receipts' }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterMode(tab.id)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  filterMode === tab.id
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Documents List */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-3">
          {isLoading && (
            <div className="py-16 text-center text-slate-400 text-xs font-semibold">
              Loading past documents...
            </div>
          )}

          {!isLoading && filteredDocs.map((sale: any) => {
            const df = sale.dynamic_fields || {};
            const docMode = df.mode || (sale.category?.toLowerCase().includes('quotation') ? 'quotation' : 'invoice');
            const badge = getDocBadge(docMode);
            const BadgeIcon = badge.icon;
            const docNum = df.documentNumber || sale.project_name || `DOC-${sale.id}`;
            const custName = sale.customers?.name || df.customerName || 'Contact not recorded';
            const custCompany = sale.customers?.company || df.customerCompany;
            const issueDate = df.issueDate || sale.created_at?.split('T')[0];
            const itemsCount = df.items?.length || 1;
            const total = sale.final_amount || sale.amount || 0;

            return (
              <div
                key={sale.id}
                className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-purple-300 hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${badge.bg}`}>
                    <BadgeIcon size={18} />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-black text-slate-900 text-sm">
                        {docNum}
                      </span>
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${badge.bg}`}>
                        {badge.label}
                      </span>
                      {sale.status && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          sale.status === 'Paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {sale.status}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-600 mt-1 font-medium flex-wrap">
                      <span className="font-bold text-slate-800">{custName}</span>
                      {custCompany && (
                        <>
                          <span>•</span>
                          <span className="text-slate-500">{custCompany}</span>
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} /> {issueDate}
                      </span>
                      <span>•</span>
                      <span>{itemsCount} {itemsCount === 1 ? 'line item' : 'line items'}</span>
                    </div>
                  </div>
                </div>

                {/* Amount & Actions */}
                <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 shrink-0">
                  <div className="text-left sm:text-right">
                    <div className="text-xs text-slate-400 font-medium">Grand Total</div>
                    <div className="text-base font-black font-mono text-purple-950">
                      ₹{formatINR(total)}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleSelectToEdit(sale)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
                      title="Load this document into Document Studio to edit and export"
                    >
                      <Edit3 size={13} />
                      <span>Edit Document</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Are you sure you want to delete ${docNum}?`)) {
                          deleteMutation.mutate(sale.id);
                        }
                      }}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                      title="Delete document"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {!isLoading && filteredDocs.length === 0 && (
            <div className="py-16 text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <FolderArchive size={24} />
              </div>
              <p className="text-sm font-bold text-slate-700">No past documents found</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {search ? 'No documents match your search criteria.' : 'Create and click "Save Record" in Document Studio to build your archive.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default PastDocumentsModal;

