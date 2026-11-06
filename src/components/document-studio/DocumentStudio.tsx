import React, { useState, useEffect, useRef } from 'react';
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
  Maximize2,
  ArrowLeft,
  ArrowRight,
  FolderArchive,
  Edit3,
  Copy,
  PlusCircle
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { api } from '../../api/api';
import { DocumentData, DocumentMode, LineItem, BankAccount } from './types';
import DocumentControls from './DocumentControls';
import DocumentA4Preview from './DocumentA4Preview';
import PastDocumentsModal from './PastDocumentsModal';
import { exportA4PDF, triggerA4Print } from './utils/pdfExport';
import { calculateDocumentTotals, formatINR } from './utils/calculations';
import { paginateDocumentItems } from './utils/pagination';

interface DocumentStudioProps {
  initialData?: DocumentData | null;
  onClearInitialData?: () => void;
}

export const DocumentStudio: React.FC<DocumentStudioProps> = ({
  initialData,
  onClearInitialData
}) => {
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<'split' | 'a4'>('split');
  const [mobileTab, setMobileTab] = useState<'editor' | 'preview'>('editor');
  const [isExporting, setIsExporting] = useState(false);
  const [zoom, setZoom] = useState<number>(0.85);
  const previewStageRef = useRef<HTMLDivElement>(null);

  // Load existing customers and CRM leads for auto-population
  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: api.getCustomers
  });

  const { data: leads = [] } = useQuery({
    queryKey: ['leads'],
    queryFn: () => api.getLeads()
  });

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: api.getSettings
  });

  // Base template configuration
  const getInitialDocData = (): DocumentData => ({
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
    companyName: 'Futurr Innovations and Research',
    companyTagline: 'Advanced Humanoid & Quadruped Robotics, High-Tech Stage Deployments & Automation',
    companyAddress: 'first floor Ak building, oppsosite KSRTC, Mannarcad Road, Perinthalmanna, Malappuram, Kerala-679322',
    brandPreset: 'Neo-Core',
    badgeBg: 'dark',
    signatoryName: 'Albin - Operations Lead',
    signatoryDesignation: 'Authorized Signatory, Futurr Innovations and Research',
    termsAndConditions: 'Bank transfer / NEFT / UPI settlement prior to dispatch. All bookings subject to operator safety clearance and technical verification.',
    bankDetails: {
      bankName: 'HDFC Bank Ltd',
      accountNumber: '50200088921044',
      ifsc: 'HDFC0001234',
      accountHolder: 'Futurr Innovations and Research',
      upiId: 'futurr@upi'
    }
  });

  // Persistent document state: Recover from localStorage draft or fallback
  const [docData, setDocData] = useState<DocumentData>(() => {
    try {
      const savedDraft = localStorage.getItem('futurr_doc_studio_draft');
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        if (parsed && typeof parsed === 'object') {
          return { ...getInitialDocData(), ...parsed };
        }
      }
    } catch (e) {
      console.warn('Failed to parse saved document draft:', e);
    }
    return getInitialDocData();
  });

  const [isPastDocsOpen, setIsPastDocsOpen] = useState(false);

  // Handle direct document/receipt navigation (e.g. from Payments & Receipts tab)
  useEffect(() => {
    if (initialData) {
      setDocData(initialData);
      try {
        localStorage.setItem('futurr_doc_studio_draft', JSON.stringify(initialData));
      } catch (e) {}
      onClearInitialData?.();
      toast.success(`Loaded ${initialData.mode === 'receipt' ? 'Receipt' : 'Document'} #${initialData.documentNumber}`);
    }
  }, [initialData]);

  const totals = calculateDocumentTotals(docData);
  const pageCount = paginateDocumentItems(docData.items).length;

  // Auto-persist draft to localStorage on any change so user inputs never vanish
  useEffect(() => {
    try {
      localStorage.setItem('futurr_doc_studio_draft', JSON.stringify(docData));
    } catch (e) {
      console.warn('Failed to auto-persist document draft:', e);
    }
  }, [docData]);

  // Dynamic Auto-Fit Zoom calculation based on container or window width
  const handleAutoFit = () => {
    if (previewStageRef.current) {
      const containerWidth = previewStageRef.current.clientWidth;
      const horizontalPadding = window.innerWidth < 640 ? 16 : 48;
      const available = containerWidth - horizontalPadding;
      const calculated = Math.min(1.0, Math.max(0.35, Number((available / 794).toFixed(2))));
      setZoom(calculated);
    } else {
      const w = window.innerWidth;
      if (w < 440) setZoom(0.42);
      else if (w < 640) setZoom(0.48);
      else if (w < 1024) setZoom(0.65);
      else setZoom(0.85);
    }
  };

  // Run auto-fit on initial mount and on window resize
  useEffect(() => {
    handleAutoFit();
    const onResize = () => handleAutoFit();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Sync settings directly from Admin Settings into Document Studio
  useEffect(() => {
    if (settings) {
      setDocData(prev => {
        let updatedBank = { ...prev.bankDetails };

        // If bank accounts are configured in Admin Settings and no specific account was chosen yet:
        if (settings.bank_accounts && settings.bank_accounts.length > 0 && !prev.bankDetails?.id) {
          const defaultBank = settings.bank_accounts.find((b: any) => b.isDefault) || settings.bank_accounts[0];
          if (defaultBank) {
            updatedBank = {
              id: defaultBank.id,
              label: defaultBank.label,
              bankName: defaultBank.bankName,
              accountNumber: defaultBank.accountNumber,
              ifsc: defaultBank.ifsc,
              accountHolder: defaultBank.accountHolder,
              upiId: defaultBank.upiId
            };
          }
        } else if (settings.bank_name && !prev.bankDetails?.bankName) {
          updatedBank = {
            ...prev.bankDetails,
            bankName: settings.bank_name || prev.bankDetails.bankName,
            accountNumber: settings.bank_account || prev.bankDetails.accountNumber,
            ifsc: settings.bank_ifsc || prev.bankDetails.ifsc,
            upiId: settings.bank_upi || prev.bankDetails.upiId
          };
        }

        return {
          ...prev,
          companyName: settings.companyName || prev.companyName,
          companyTagline: settings.tagline || prev.companyTagline,
          companyAddress: settings.companyAddress || prev.companyAddress,
          logoUrl: settings.logo || prev.logoUrl,
          signatoryName: prev.signatoryName || settings.companyName,
          signatureDataUrl: settings.signature || prev.signatureDataUrl,
          bankDetails: updatedBank
        };
      });
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

  // Handle Loading a Customer or CRM Lead
  const handleSelectCustomer = (selectionIdStr: string) => {
    if (!selectionIdStr) {
      setDocData(prev => ({
        ...prev,
        customerId: null
      }));
      return;
    }

    // 1. Search in Registered Customers
    const selectedCustomer = customers.find((c: any) => String(c.id) === String(selectionIdStr));
    if (selectedCustomer) {
      const addr = selectedCustomer.dynamic_fields?.address || selectedCustomer.address || '';
      setDocData(prev => ({
        ...prev,
        customerId: selectedCustomer.id,
        customerName: selectedCustomer.name || '',
        customerCompany: selectedCustomer.company || '',
        customerEmail: selectedCustomer.email || '',
        customerPhone: selectedCustomer.phone || '',
        customerGst: selectedCustomer.gst || '',
        customerAddress: addr || prev.customerAddress || 'Mumbai, Maharashtra',
        venue: addr || prev.venue || 'Mumbai, Maharashtra'
      }));
      toast.success(`Loaded details for customer ${selectedCustomer.name}`);
      return;
    }

    // 2. Search in CRM Leads / Inquiries
    const selectedLead = leads.find((l: any) => String(l.id) === String(selectionIdStr));
    if (selectedLead) {
      const addr = selectedLead.address || selectedLead.city || '';
      setDocData(prev => ({
        ...prev,
        customerId: selectedLead.id,
        customerName: selectedLead.name || selectedLead.contact_name || '',
        customerCompany: selectedLead.company || '',
        customerEmail: selectedLead.email || '',
        customerPhone: selectedLead.phone || '',
        customerGst: selectedLead.gst || '',
        customerAddress: addr || prev.customerAddress || 'Mumbai, Maharashtra',
        venue: addr || prev.venue || 'Mumbai, Maharashtra',
        bookingRef: selectedLead.inquiry_id ? `FUT-${selectedLead.inquiry_id}` : prev.bookingRef
      }));
      toast.success(`Loaded details from CRM lead ${selectedLead.name}`);
    }
  };

  // Save current details as permanent default template
  const handleSaveDefaultTemplate = async () => {
    try {
      const templateData = {
        termsAndConditions: docData.termsAndConditions,
        transportCharges: docData.transportCharges,
        gstType: docData.gstType,
        gstRate: docData.gstRate,
        discount: docData.discount,
        signatoryName: docData.signatoryName,
        signatoryDesignation: docData.signatoryDesignation,
        bankDetails: docData.bankDetails,
        defaultItems: docData.items
      };

      if (settings) {
        await api.updateSettings({
          ...settings,
          doc_defaults: templateData
        });
        queryClient.invalidateQueries({ queryKey: ['settings'] });
      }

      localStorage.setItem('futurr_doc_studio_default_template', JSON.stringify(templateData));
      toast.success('Current configuration saved as permanent default template!');
    } catch (err: any) {
      toast.error('Failed to save default template: ' + (err?.message || 'Unknown error'));
    }
  };

  // Reset document to default template
  const handleResetTemplate = () => {
    const base = getInitialDocData();
    const defaults = settings?.doc_defaults;
    const prefix = docData.mode === 'quotation' ? 'QUO' : docData.mode === 'invoice' ? 'INV' : 'REC';
    const randNum = Math.floor(100 + Math.random() * 900);

    const resetData: DocumentData = {
      ...base,
      id: undefined,
      mode: docData.mode,
      documentNumber: `${prefix}-FUT-${randNum}`,
      termsAndConditions: defaults?.termsAndConditions || base.termsAndConditions,
      transportCharges: defaults?.transportCharges ?? base.transportCharges,
      gstType: defaults?.gstType || base.gstType,
      gstRate: defaults?.gstRate ?? base.gstRate,
      discount: defaults?.discount ?? 0,
      companyAddress: settings?.companyAddress || base.companyAddress,
      signatoryName: defaults?.signatoryName || settings?.companyName || base.signatoryName,
      signatoryDesignation: defaults?.signatoryDesignation || base.signatoryDesignation,
      bankDetails: defaults?.bankDetails || (settings?.bank_accounts?.[0] ? {
        id: settings.bank_accounts[0].id,
        label: settings.bank_accounts[0].label,
        bankName: settings.bank_accounts[0].bankName,
        accountNumber: settings.bank_accounts[0].accountNumber,
        ifsc: settings.bank_accounts[0].ifsc,
        accountHolder: settings.bank_accounts[0].accountHolder,
        upiId: settings.bank_accounts[0].upiId
      } : base.bankDetails),
      items: defaults?.defaultItems || base.items
    };

    setDocData(resetData);
    try {
      localStorage.setItem('futurr_doc_studio_draft', JSON.stringify(resetData));
    } catch (e) {}
    toast.success('Document reset to default template');
  };

  // Load a past document into the studio for editing
  const handleLoadPastDocument = (loadedData: DocumentData, saleId: number) => {
    setDocData({
      ...loadedData,
      id: saleId
    });
    toast.success(`Loaded document #${loadedData.documentNumber} for editing!`);
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

  // Save/Sync into ERP (Supports update if editing past doc, or create if new)
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
          issueDate: docData.issueDate,
          dueDate: docData.dueDate,
          customerName: docData.customerName,
          customerCompany: docData.customerCompany,
          customerAddress: docData.customerAddress,
          companyAddress: docData.companyAddress,
          customerEmail: docData.customerEmail,
          customerPhone: docData.customerPhone,
          customerGst: docData.customerGst,
          venue: docData.venue,
          bookingRef: docData.bookingRef,
          items: docData.items,
          transportCharges: docData.transportCharges,
          discount: docData.discount,
          gstType: docData.gstType,
          gstRate: docData.gstRate,
          signatoryName: docData.signatoryName,
          signatoryDesignation: docData.signatoryDesignation,
          termsAndConditions: docData.termsAndConditions,
          bankDetails: docData.bankDetails,
          fullDocData: {
            ...docData,
            signatureDataUrl: settings?.signature || docData.signatureDataUrl,
            logoUrl: settings?.logo || docData.logoUrl || '/logo.svg'
          }
        }
      };

      let savedRecord: any;
      if (docData.id) {
        savedRecord = await api.updateSale(docData.id, payload);
      } else {
        savedRecord = await api.createSale(payload);
        if (savedRecord?.id) {
          setDocData(prev => ({ ...prev, id: savedRecord.id }));
        }
      }

      // If document is a receipt, automatically record/sync payment in Payments & Receipts
      const targetSaleId = docData.id || savedRecord?.id;
      if (docData.mode === 'receipt' && targetSaleId) {
        try {
          await api.syncReceiptPayment(targetSaleId, {
            amount: finalAmt,
            receipt_number: docData.documentNumber,
            payment_method: docData.bankDetails?.bankName ? 'Bank Transfer' : 'UPI',
            transaction_id: docData.bookingRef || ''
          });
        } catch (pErr) {
          console.warn('Auto-recording payment failed:', pErr);
        }
      }

      return savedRecord;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      if (docData.mode === 'receipt') {
        toast.success(`Receipt #${docData.documentNumber} saved & recorded in Payments & Receipts!`);
      } else if (docData.id) {
        toast.success(`Document #${docData.documentNumber} updated successfully!`);
      } else {
        toast.success(`${docData.mode.toUpperCase()} #${docData.documentNumber} saved to ERP records!`);
      }
    },
    onError: (err: any) => {
      toast.error('Failed to sync to ERP: ' + (err?.message || 'Unknown error'));
    }
  });

  return (
    <div className="space-y-4 w-full animate-in fade-in duration-300 pb-20 lg:pb-6">
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
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-3.5 sm:p-5 space-y-3.5 sm:space-y-4 w-full">
        {/* Row 1: Brand title and customer loader */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3 sm:pb-4">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-black shadow-md shadow-purple-200 shrink-0">
              <Bot size={20} className="sm:w-[22px] sm:h-[22px]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight truncate">
                  {docData.companyName || 'Futurr Innovations and Research'}
                </h1>
                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider px-1.5 sm:px-2 py-0.5 bg-purple-100 text-purple-700 rounded-md shrink-0">
                  DOC STUDIO
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 font-medium truncate">Robotics &amp; AI • Quotation, Tax Invoice &amp; Receipt Suite</p>
            </div>
          </div>

          {/* Customer / Lead Auto-loader */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <span className="text-xs font-bold text-slate-500 shrink-0">Client:</span>
            <select
              value={docData.customerId ? String(docData.customerId) : ''}
              onChange={(e) => handleSelectCustomer(e.target.value)}
              className="flex-1 md:flex-initial px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-purple-500/20 max-w-full md:max-w-xs"
            >
              <option value="">Select Existing Customer / Inquiry...</option>
              {customers.length > 0 && (
                <optgroup label="Registered Customers">
                  {customers.map((c: any) => (
                    <option key={`cust_${c.id}`} value={String(c.id)}>
                      {c.name} {c.company ? `(${c.company})` : ''}
                    </option>
                  ))}
                </optgroup>
              )}
              {leads.length > 0 && (
                <optgroup label="CRM Inquiries & Leads">
                  {leads.map((l: any) => (
                    <option key={`lead_${l.id}`} value={String(l.id)}>
                      {l.name || l.contact_name} {l.company ? `(${l.company})` : ''}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>
        </div>

        {/* Row 2: Mode selector, view toggle, and actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Document Mode Pills */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl w-full sm:w-fit overflow-x-auto scrollbar-hide">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1.5 sm:px-2 shrink-0">
              TYPE:
            </span>
            <button
              type="button"
              onClick={() => handleModeChange('quotation')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-black transition-all shrink-0 ${
                docData.mode === 'quotation'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileSpreadsheet size={13} className="shrink-0" />
              <span>Quotation</span>
            </button>
            <button
              type="button"
              onClick={() => handleModeChange('invoice')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-black transition-all shrink-0 ${
                docData.mode === 'invoice'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText size={13} className="shrink-0" />
              <span>Tax Invoice</span>
            </button>
            <button
              type="button"
              onClick={() => handleModeChange('receipt')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-black transition-all shrink-0 ${
                docData.mode === 'receipt'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Receipt size={13} className="shrink-0" />
              <span>Receipt</span>
            </button>
          </div>

          {/* Desktop View Toggles & Actions */}
          <div className="flex items-center justify-between sm:justify-end gap-2">
            <div className="hidden lg:flex p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => setViewMode('split')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  viewMode === 'split' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Sliders size={13} />
                <span>Split Studio</span>
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

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
              <button
                type="button"
                onClick={() => setIsPastDocsOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl text-xs font-bold transition-all shadow-xs"
                title="Browse and edit past documents"
              >
                <FolderArchive size={14} />
                <span>Past Docs</span>
              </button>

              <button
                type="button"
                disabled={saveMutation.isPending}
                onClick={() => saveMutation.mutate()}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm text-white ${
                  docData.id ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-900/30' : 'bg-slate-800 hover:bg-slate-900'
                }`}
                title={docData.id ? `Update record #${docData.id}` : 'Save to ERP Records'}
              >
                <Save size={14} />
                <span>{saveMutation.isPending ? 'Saving...' : docData.id ? 'Update Record' : 'Save Record'}</span>
              </button>

              <button
                type="button"
                disabled={isExporting}
                onClick={handleExportPDF}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-black transition-all shadow-sm shadow-purple-900/30 disabled:opacity-50"
              >
                <Download size={14} />
                <span>{isExporting ? 'Exporting...' : 'Export PDF'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Row 3: Mobile/Tablet View Segmented Switch (lg:hidden) */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl lg:hidden">
          <button
            type="button"
            onClick={() => setMobileTab('editor')}
            className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
              mobileTab === 'editor'
                ? 'bg-white text-purple-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sliders size={14} />
            <span>Form Controls</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMobileTab('preview');
              setTimeout(handleAutoFit, 50);
            }}
            className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
              mobileTab === 'preview'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Eye size={14} />
            <span>Live A4 Preview</span>
            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${mobileTab === 'preview' ? 'bg-purple-800 text-white' : 'bg-slate-200 text-slate-700'}`}>
              ₹{formatINR(totals.grandTotal)}
            </span>
          </button>
        </div>
      </div>

      {/* Active Past Document Editing Banner */}
      {docData.id && (
        <div className="bg-amber-500/10 border border-amber-300 text-amber-900 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold shrink-0">
              <Edit3 size={16} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-black uppercase tracking-wider text-amber-800">
                  Editing Saved Document
                </span>
                <span className="font-mono text-xs font-bold px-2 py-0.5 bg-amber-200/80 rounded text-amber-900">
                  {docData.documentNumber}
                </span>
                <span className="text-[11px] text-amber-700 font-medium">
                  (ERP Record #{docData.id})
                </span>
              </div>
              <p className="text-[11px] text-amber-700/90 font-medium">
                Edits will update this database record, or you can duplicate it as a new copy.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={() => {
                const prefix = docData.mode === 'quotation' ? 'QUO' : docData.mode === 'invoice' ? 'INV' : 'REC';
                const newDocNum = `${prefix}-FUT-${Math.floor(100 + Math.random() * 900)}`;
                setDocData(prev => ({
                  ...prev,
                  id: undefined,
                  documentNumber: newDocNum
                }));
                toast.success(`Duplicated as new document #${newDocNum}`);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold transition-all shadow-xs"
            >
              <Copy size={13} />
              <span>Duplicate as New</span>
            </button>
            <button
              type="button"
              onClick={handleResetTemplate}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
            >
              <PlusCircle size={13} />
              <span>New Blank</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Workspace: Full Width Responsive Layout */}
      <div className="flex flex-col lg:flex-row gap-6 items-start w-full">
        {/* Left Column: Form Controls (Visible if Split View on Desktop OR Editor Tab on Mobile) */}
        {(viewMode === 'split' || mobileTab === 'editor') && (
          <div className={`w-full lg:w-[480px] xl:w-[520px] 2xl:w-[560px] shrink-0 space-y-6 ${mobileTab !== 'editor' ? 'hidden lg:block' : ''}`}>
            <DocumentControls
              data={docData}
              onChange={(updates) => setDocData(prev => ({ ...prev, ...updates }))}
              onItemChange={(items) => setDocData(prev => ({ ...prev, items }))}
              bankAccounts={settings?.bank_accounts || []}
              onSaveDefaultTemplate={handleSaveDefaultTemplate}
              onResetTemplate={handleResetTemplate}
            />
          </div>
        )}

        {/* Right Column: Live A4 Preview Workspace (Visible if on Desktop OR Preview Tab on Mobile) */}
        <div className={`flex-1 w-full min-w-0 ${mobileTab !== 'preview' ? 'hidden lg:block' : ''}`}>
          {/* Action & Zoom Bar Above Preview */}
          <div className="bg-slate-900 text-white rounded-2xl p-3 px-3 sm:px-4 mb-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-md w-full">
            <div className="flex items-center justify-between sm:justify-start gap-2 text-xs font-semibold text-emerald-400">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="shrink-0" />
                <span className="truncate">Synchronized A4 Sheet</span>
                {pageCount > 1 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-500/20 text-purple-300 border border-purple-500/40">
                    {pageCount} Pages
                  </span>
                )}
              </div>
              <div className="sm:hidden font-mono font-bold text-white text-xs bg-slate-800 px-2 py-0.5 rounded">
                ₹{formatINR(totals.grandTotal)}
              </div>
            </div>

            {/* Zoom Controls & Quick Actions */}
            <div className="flex items-center justify-between sm:justify-end gap-2 flex-wrap">
              {/* Zoom Buttons Group */}
              <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700">
                <button
                  type="button"
                  onClick={() => setZoom(prev => Math.max(0.35, Number((prev - 0.06).toFixed(2))))}
                  className="p-1.5 text-slate-400 hover:text-white rounded transition-colors"
                  title="Zoom Out"
                >
                  <ZoomOut size={13} />
                </button>
                <span className="text-[11px] font-mono font-bold text-slate-300 px-1.5 select-none min-w-[34px] text-center">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setZoom(prev => Math.min(1.3, Number((prev + 0.06).toFixed(2))))}
                  className="p-1.5 text-slate-400 hover:text-white rounded transition-colors"
                  title="Zoom In"
                >
                  <ZoomIn size={13} />
                </button>
                <button
                  type="button"
                  onClick={handleAutoFit}
                  className="text-[10px] font-bold text-purple-400 hover:text-white px-2 py-1 border-l border-slate-700 transition-colors"
                  title="Auto Fit to Screen"
                >
                  Fit
                </button>
                <button
                  type="button"
                  onClick={() => setZoom(1.0)}
                  className="text-[10px] font-bold text-slate-400 hover:text-white px-2 py-1 border-l border-slate-700 transition-colors hidden xs:inline-block"
                  title="100% Actual Size"
                >
                  100%
                </button>
              </div>

              {/* Desktop View Switcher */}
              <button
                type="button"
                onClick={() => setViewMode(prev => prev === 'split' ? 'a4' : 'split')}
                className="hidden lg:inline-block px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold transition-colors"
              >
                {viewMode === 'split' ? 'Full View' : 'Split View'}
              </button>

              {/* Mobile Back to Editor button */}
              <button
                type="button"
                onClick={() => setMobileTab('editor')}
                className="lg:hidden inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold transition-colors"
              >
                <ArrowLeft size={13} />
                <span>Editor</span>
              </button>

              <button
                type="button"
                onClick={triggerA4Print}
                className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold transition-colors"
                title="Print vector PDF via browser"
              >
                <Printer size={13} />
                <span className="hidden md:inline">Print</span>
              </button>

              <button
                type="button"
                disabled={isExporting}
                onClick={handleExportPDF}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-black transition-all shadow-md shadow-purple-900/50 disabled:opacity-50"
              >
                <Download size={13} />
                <span>{isExporting ? 'Exporting...' : 'PDF'}</span>
              </button>
            </div>
          </div>

          {/* Live A4 Stage: High-contrast Dark Studio Canvas */}
          <div 
            ref={previewStageRef}
            className="bg-slate-800/95 p-2 sm:p-6 md:p-8 rounded-2xl border border-slate-700/80 flex flex-col items-center justify-start min-h-[520px] sm:min-h-[750px] lg:min-h-[920px] overflow-x-auto shadow-2xl w-full"
          >
            <DocumentA4Preview 
              data={{
                ...docData,
                signatureDataUrl: settings?.signature || docData.signatureDataUrl,
                logoUrl: settings?.logo || docData.logoUrl || '/logo.svg'
              }} 
              scale={zoom} 
            />
          </div>
        </div>
      </div>

      {/* Floating Bottom Quick Bar on Mobile (when in Editor mode) */}
      {mobileTab === 'editor' && (
        <div className="fixed bottom-3 left-3 right-3 z-30 lg:hidden flex items-center gap-2 p-2 bg-slate-900/95 backdrop-blur-md rounded-2xl border border-slate-700 shadow-2xl">
          <button
            type="button"
            onClick={() => {
              setMobileTab('preview');
              setTimeout(handleAutoFit, 50);
            }}
            className="flex-1 py-2.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-black flex items-center justify-center gap-2 shadow-md shadow-purple-900/40"
          >
            <Eye size={15} />
            <span>View Live Preview</span>
            <span className="px-1.5 py-0.5 rounded bg-purple-800 text-[10px] font-mono">
              ₹{formatINR(totals.grandTotal)}
            </span>
            <ArrowRight size={13} />
          </button>

          <button
            type="button"
            disabled={isExporting}
            onClick={handleExportPDF}
            className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 border border-slate-700 shrink-0"
            title="Download PDF"
          >
            <Download size={15} />
            <span className="hidden xs:inline">PDF</span>
          </button>
        </div>
      )}

      {/* Past Documents Archive Browser Modal */}
      <PastDocumentsModal
        isOpen={isPastDocsOpen}
        onClose={() => setIsPastDocsOpen(false)}
        onLoadDocument={handleLoadPastDocument}
      />
    </div>
  );
};

export default DocumentStudio;
