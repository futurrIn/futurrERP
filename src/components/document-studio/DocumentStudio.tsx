import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Receipt, 
  FileSpreadsheet, 
  Download, 
  Printer, 
  Eye, 
  Sliders, 
  CheckCircle2, 
  Save, 
  Building2, 
  User, 
  Sparkles,
  Bot,
  ZoomIn,
  ZoomOut,
  Maximize2
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { api } from '../../api/api';
import { DocumentData, DocumentMode, LineItem } from './types';
import DocumentControls from './DocumentControls';
import DocumentA4Preview from './DocumentA4Preview';
import { exportA4PDF, triggerA4Print } from './utils/pdfExport';

export const DocumentStudio: React.FC = () => {
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<'split' | 'a4'>('split');
  const [isExporting, setIsExporting] = useState(false);
  const [zoom, setZoom] = useState<number>(0.92);

  // Load existing customers for auto-population
  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: api.getCustomers
  });

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: api.getSettings
  });

  // Initial Document State
  const [docData, setDocData] = useState<DocumentData>({
    mode: 'quotation',
    documentNumber: `QUO-FUT-${Math.floor(100 + Math.random() * 900)}`,
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    customerId: null,
    customerName: 'Contact not recorded',
    customerCompany: 'Advanced Robotics Division',
    customerAddress: 'Mumbai, Maharashtra',
    customerEmail: '',
    customerPhone: '',
    customerGst: '',
    venue: 'Mumbai, Maharashtra',
    bookingRef: `FUT-${Math.floor(100 + Math.random() * 900)}`,
    items: [
      {
        id: 'init_1',
        name: 'Unitree G1 Humanoid Robot (Rental / Day)',
        category: 'Robot Rental',
        quantity: 1,
        rate: 90000,
        amount: 90000
      },
      {
        id: 'init_2',
        name: 'Transformers Bumblebee Suit (Rental / Day)',
        category: 'Costume / Act',
        quantity: 1,
        rate: 28000,
        amount: 28000
      }
    ],
    transportCharges: 35000,
    discount: 0,
    gstType: 'exempt',
    gstRate: 18,
    logoUrl: '/logo.svg',
    companyName: 'FUTURR INNOVATIONS',
    companyTagline: 'Advanced Humanoid & Quadruped Robotics, High-Tech Stage Deployments & Automation',
    brandPreset: 'Neo-Core',
    badgeBg: 'dark',
    signatoryName: 'Albin - Operations Lead',
    signatoryDesignation: 'Authorized Signatory, Futurr Innovations',
    termsAndConditions: 'Bank transfer / NEFT / UPI settlement prior to dispatch. All bookings subject to operator safety clearance and technical verification.',
    bankDetails: {
      bankName: 'HDFC Bank Ltd',
      accountNumber: '50200088921044',
      ifsc: 'HDFC0001234',
      accountHolder: 'Futurr Innovations Pvt Ltd',
      upiId: 'futurr@upi'
    }
  });

  // Sync settings directly from Admin Settings into Document Studio
  useEffect(() => {
    if (settings) {
      setDocData(prev => ({
        ...prev,
        companyName: settings.companyName || prev.companyName,
        companyTagline: settings.tagline || prev.companyTagline,
        logoUrl: settings.logo || prev.logoUrl,
        signatoryName: prev.signatoryName || settings.companyName,
        signatureDataUrl: prev.signatureDataUrl || settings.signature,
        bankDetails: {
          ...prev.bankDetails,
          bankName: settings.bank_name || prev.bankDetails.bankName,
          accountNumber: settings.bank_account || prev.bankDetails.accountNumber,
          ifsc: settings.bank_ifsc || prev.bankDetails.ifsc,
          upiId: settings.bank_upi || prev.bankDetails.upiId
        }
      }));
    }
  }, [settings]);

  // Handle Mode Change (Quotation / Invoice / Receipt)
  const handleModeChange = (newMode: DocumentMode) => {
    const prefix = newMode === 'quotation' ? 'QUO' : newMode === 'invoice' ? 'INV' : 'REC';
    const randNum = Math.floor(100 + Math.random() * 900);
    setDocData(prev => ({
      ...prev,
      mode: newMode,
      documentNumber: `${prefix}-FUT-${randNum}`
    }));
  };

  // Handle Loading a Customer
  const handleSelectCustomer = (customerIdStr: string) => {
    if (!customerIdStr) return;
    const cid = Number(customerIdStr);
    const selected = customers.find((c: any) => c.id === cid);
    if (selected) {
      setDocData(prev => ({
        ...prev,
        customerId: selected.id,
        customerName: selected.name || '',
        customerCompany: selected.company || '',
        customerEmail: selected.email || '',
        customerPhone: selected.phone || '',
        customerGst: selected.gst || '',
        customerAddress: selected.dynamic_fields?.address || prev.venue || 'Mumbai, Maharashtra',
        venue: selected.dynamic_fields?.address || prev.venue
      }));
      toast.success(`Loaded details for ${selected.name}`);
    }
  };

  // PDF Export
  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      await exportA4PDF('document-a4-sheet', `${docData.documentNumber}`);
    } finally {
      setIsExporting(false);
    }
  };

  // Save/Sync into ERP
  const saveMutation = useMutation({
    mutationFn: async () => {
      const sub = docData.items.reduce((s, i) => s + (i.amount || 0), 0);
      const finalAmt = sub + (Number(docData.transportCharges) || 0) - (Number(docData.discount) || 0);

      const payload = {
        customer_id: docData.customerId || null,
        category: docData.mode === 'quotation' ? 'Quotation / Proposal' : 'Product Sales',
        service_product: docData.items.map(i => i.name).join(', ') || 'Robotics Services',
        project_name: docData.documentNumber,
        amount: sub,
        discount: docData.discount,
        tax: docData.gstType === 'exempt' ? 0 : Math.round(finalAmt * 0.18),
        final_amount: finalAmt,
        status: docData.mode === 'receipt' ? 'Paid' : 'Pending',
        dynamic_fields: {
          documentNumber: docData.documentNumber,
          mode: docData.mode,
          venue: docData.venue,
          bookingRef: docData.bookingRef,
          items: docData.items,
          transportCharges: docData.transportCharges,
          signatoryName: docData.signatoryName
        }
      };

      return api.createSale(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      toast.success(`${docData.mode.toUpperCase()} saved to ERP records!`);
    },
    onError: (err: any) => {
      toast.error('Failed to sync to ERP: ' + err.message);
    }
  });

  return (
    <div className="space-y-4 w-full animate-in fade-in duration-300">
      {/* Print-only stylesheet to enforce strict A4 printing */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #document-a4-sheet, #document-a4-sheet * {
            visibility: visible !important;
          }
          #document-a4-sheet {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 210mm !important;
            min-height: 297mm !important;
            box-shadow: none !important;
            border: none !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            transform: none !important;
          }
          @page {
            size: A4 portrait;
            margin: 0;
          }
        }
      `}</style>

      {/* Top Banner & Mode Navigation Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 space-y-4 w-full">
        {/* Row 1: Brand title and customer loader */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-black shadow-md shadow-purple-200">
              <Bot size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black text-slate-900 tracking-tight">
                  {docData.companyName || 'FUTURR INNOVATIONS'}
                </h1>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 bg-purple-100 text-purple-700 rounded-md">
                  DOC STUDIO
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">Robotics &amp; AI • Quotation, Tax Invoice &amp; Receipt Suite</p>
            </div>
          </div>

          {/* Customer / Lead Auto-loader */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 shrink-0">Load Customer:</span>
            <select
              value={docData.customerId || ''}
              onChange={(e) => handleSelectCustomer(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-purple-500/20 max-w-xs"
            >
              <option value="">Select Existing Customer / Inquiry...</option>
              {customers.map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.company ? `(${c.company})` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 2: Mode selector, view toggle, and actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Document Mode Pills */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl w-fit">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2">
              DOCUMENT:
            </span>
            <button
              type="button"
              onClick={() => handleModeChange('quotation')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                docData.mode === 'quotation'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileSpreadsheet size={14} />
              <span>Quotation</span>
            </button>
            <button
              type="button"
              onClick={() => handleModeChange('invoice')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                docData.mode === 'invoice'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText size={14} />
              <span>Tax Invoice</span>
            </button>
            <button
              type="button"
              onClick={() => handleModeChange('receipt')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                docData.mode === 'receipt'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Receipt size={14} />
              <span>Payment Receipt</span>
            </button>
          </div>

          {/* View Toggles & Actions */}
          <div className="flex items-center gap-2">
            <div className="flex p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => setViewMode('split')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  viewMode === 'split' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Sliders size={13} />
                <span>Interactive Studio</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('a4')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  viewMode === 'a4' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Eye size={13} />
                <span>Full A4 View</span>
              </button>
            </div>

            <button
              type="button"
              disabled={saveMutation.isPending}
              onClick={() => saveMutation.mutate()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
              title="Save to ERP Records"
            >
              <Save size={14} />
              <span className="hidden sm:inline">Save Record</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Workspace: Full Width Flex Layout */}
      <div className="flex flex-col lg:flex-row gap-6 items-start w-full">
        {/* Left Column: Form & Customization Controls */}
        {viewMode === 'split' && (
          <div className="w-full lg:w-[480px] xl:w-[520px] 2xl:w-[560px] shrink-0 space-y-6">
            <DocumentControls
              data={docData}
              onChange={(updates) => setDocData(prev => ({ ...prev, ...updates }))}
              onItemChange={(items) => setDocData(prev => ({ ...prev, items }))}
            />
          </div>
        )}

        {/* Right Column: Live A4 Preview Workspace */}
        <div className="flex-1 w-full min-w-0">
          {/* Action & Zoom Bar Above Preview */}
          <div className="bg-slate-900 text-white rounded-2xl p-3 px-4 mb-4 flex flex-wrap items-center justify-between gap-3 shadow-md w-full">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
              <CheckCircle2 size={16} />
              <span>Real-Time Synchronized Sheet</span>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700">
                <button
                  type="button"
                  onClick={() => setZoom(prev => Math.max(0.6, Number((prev - 0.08).toFixed(2))))}
                  className="p-1.5 text-slate-400 hover:text-white rounded transition-colors"
                  title="Zoom Out"
                >
                  <ZoomOut size={13} />
                </button>
                <span className="text-[11px] font-mono font-bold text-slate-300 px-2 select-none">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setZoom(prev => Math.min(1.3, Number((prev + 0.08).toFixed(2))))}
                  className="p-1.5 text-slate-400 hover:text-white rounded transition-colors"
                  title="Zoom In"
                >
                  <ZoomIn size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => setZoom(0.92)}
                  className="text-[10px] font-bold text-slate-400 hover:text-white px-2 py-1 border-l border-slate-700 transition-colors"
                  title="Reset Zoom"
                >
                  Fit
                </button>
                <button
                  type="button"
                  onClick={() => setZoom(1.0)}
                  className="text-[10px] font-bold text-slate-400 hover:text-white px-2 py-1 border-l border-slate-700 transition-colors"
                  title="Actual Size"
                >
                  100%
                </button>
              </div>

              <button
                type="button"
                onClick={() => setViewMode(prev => prev === 'split' ? 'a4' : 'split')}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold transition-colors"
              >
                {viewMode === 'split' ? 'Full View' : 'Split View'}
              </button>

              <button
                type="button"
                onClick={triggerA4Print}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold transition-colors"
                title="Print vector PDF via browser"
              >
                <Printer size={13} />
                <span className="hidden sm:inline">Print Vector</span>
              </button>

              <button
                type="button"
                disabled={isExporting}
                onClick={handleExportPDF}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-black transition-all shadow-md shadow-purple-900/50 disabled:opacity-50"
              >
                <Download size={14} />
                <span>{isExporting ? 'Exporting...' : 'Export PDF'}</span>
              </button>
            </div>
          </div>

          {/* Live A4 Stage */}
          <div className="bg-slate-200/70 p-3 sm:p-6 rounded-2xl border border-slate-200 flex flex-col items-center justify-start min-h-[900px] overflow-x-auto shadow-inner w-full">
            <DocumentA4Preview data={docData} scale={zoom} />
          </div>
        </div>
      </div>
    </div>
  );
};
export default DocumentStudio;
