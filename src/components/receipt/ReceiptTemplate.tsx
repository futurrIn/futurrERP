import React from 'react';
import { format } from 'date-fns';
import { Download, Printer, Mail, Share2 } from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { toast } from 'react-hot-toast';

interface ReceiptTemplateProps {
  receipt: any;
  settings: any;
  onClose?: () => void;
  onSave?: () => void;
}

const ReceiptTemplate: React.FC<ReceiptTemplateProps> = ({ receipt, settings, onClose, onSave }) => {
  const formatDate = (dateValue: any, formatStr: string) => {
    try {
      if (!dateValue) return 'N/A';
      const d = new Date(dateValue);
      return isNaN(d.getTime()) ? 'N/A' : format(d, formatStr);
    } catch (err) {
      return 'N/A';
    }
  };

  const formatAmount = (amountValue: any) => {
    try {
      if (amountValue === null || amountValue === undefined) return '0';
      const num = Number(amountValue);
      return isNaN(num) ? '0' : num.toLocaleString('en-IN');
    } catch (err) {
      return '0';
    }
  };

  const downloadPDF = async () => {
    const element = document.getElementById('receipt-content');
    if (!element) return;

    const toastId = toast.loading('Generating PDF...');

    // Save original getComputedStyle
    const originalGetComputedStyle = window.getComputedStyle;

    // Temporarily patch getComputedStyle to intercept and replace Tailwind v4's oklch colors
    window.getComputedStyle = (el, pseudoElt) => {
      const style = originalGetComputedStyle(el, pseudoElt);
      return new Proxy(style, {
        get(target, prop) {
          if (prop === 'getPropertyValue') {
            return (propertyName: string) => {
              const value = target.getPropertyValue(propertyName);
              if (typeof value === 'string' && value.includes('oklch')) {
                const name = propertyName.toLowerCase();
                if (name.includes('background')) return 'rgb(255, 255, 255)';
                if (name.includes('border') || name.includes('outline')) return 'rgb(226, 232, 240)';
                return 'rgb(30, 41, 59)';
              }
              return value;
            };
          }

          const value = Reflect.get(target, prop);
          if (typeof value === 'string' && value.includes('oklch')) {
            const propStr = String(prop).toLowerCase();
            if (propStr.includes('background')) return 'rgb(255, 255, 255)';
            if (propStr.includes('border') || propStr.includes('outline')) return 'rgb(226, 232, 240)';
            return 'rgb(30, 41, 59)';
          }

          if (typeof value === 'function') {
            return value.bind(target);
          }
          return value;
        }
      }) as any;
    };

    try {
      const canvas = await html2canvas(element, {
        scale: 1.5,
        useCORS: true,
        logging: false,
      });
      const imgData = canvas.toDataURL('image/jpeg', 0.75);
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true,
      });

      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight, undefined, 'FAST');
      pdf.save(`Receipt-${receipt.receiptNumber}.pdf`);
      
      toast.success('PDF downloaded successfully!', { id: toastId });
    } catch (error: any) {
      console.error('PDF generation error:', error);
      toast.error(`Error: ${error.message || 'Failed to generate PDF'}`, { id: toastId });
    } finally {
      // Restore original getComputedStyle immediately
      window.getComputedStyle = originalGetComputedStyle;
    }
  };

  const sendEmail = () => {
    const subject = encodeURIComponent(`Receipt from ${settings.companyName}`);
    const body = encodeURIComponent(
      `Dear ${receipt.studentName},\n\nHere are the details of your recent payment:\n\nCourse/Program: ${receipt.courseName}\nReceipt No: ${receipt.receiptNumber}\nAmount Paid: Rs. ${formatAmount(receipt.amount)}\nDate: ${formatDate(receipt.date, 'MMMM d, yyyy')}\n\nThank you for choosing ${settings.companyName}.\n\nBest regards,\n${settings.companyName} Team`
    );
    const mailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${receipt.email || ''}&su=${subject}&body=${body}`;
    window.open(mailUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm">
      <div className="fixed inset-0 sm:top-[5vh] sm:left-1/2 sm:-translate-x-1/2 w-full sm:w-[90%] sm:max-w-4xl h-full sm:h-[90vh] bg-white rounded-none sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
        {/* Header Actions */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <h3 className="font-bold">Receipt Preview</h3>
          <div className="flex items-center gap-2">
            {onSave && (
              <button 
                onClick={onSave}
                className="px-4 py-2 text-white rounded-lg text-sm font-semibold transition-all shadow-sm hover:brightness-110 mr-2"
                style={{ backgroundColor: settings.primaryColor || '#4f46e5' }}
              >
                Save Receipt
              </button>
            )}
            <button onClick={downloadPDF} className="p-2 bg-white border border-slate-200 rounded-lg text-indigo-600 hover:bg-indigo-50 transition-colors shadow-sm">
              <Download size={20} />
            </button>
            <button onClick={() => window.print()} className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors shadow-sm">
              <Printer size={20} />
            </button>
            <button onClick={sendEmail} title="Send via Gmail" className="p-2 bg-white border border-slate-200 rounded-lg text-red-500 hover:bg-red-50 transition-colors shadow-sm">
              <Mail size={20} />
            </button>
            <button onClick={onClose} className="ml-4 px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium">
              Close
            </button>
          </div>
        </div>

        {/* Receipt Content */}
        <div className="flex-1 overflow-auto min-h-0 p-4 sm:p-8 bg-slate-100">
          <style>{`
            /* CRITICAL: html2canvas crashes on any oklch color. 
               Tailwind v4 globally sets border-color to oklch. We must reset it for ALL elements. */
            #receipt-content, #receipt-content * {
              border-color: #e2e8f0 !important;
              outline-color: #e2e8f0 !important;
              box-shadow: none !important;
            }
            #receipt-content { color: #1e293b !important; background-color: #ffffff !important; }
            #receipt-content .bg-white { background-color: #ffffff !important; }
            #receipt-content .text-slate-800 { color: #1e293b !important; }
            #receipt-content .text-slate-500 { color: #64748b !important; }
            #receipt-content .text-slate-400 { color: #94a3b8 !important; }
            #receipt-content .text-slate-100 { color: #f1f5f9 !important; }
            #receipt-content .bg-slate-50 { background-color: #f8fafc !important; }
            #receipt-content .bg-slate-100 { background-color: #f1f5f9 !important; }
            #receipt-content .border-slate-50 { border-color: #f8fafc !important; }
            #receipt-content .border-slate-100 { border-color: #f1f5f9 !important; }
            #receipt-content .border-slate-200 { border-color: #e2e8f0 !important; }
            #receipt-content .border-slate-300 { border-color: #cbd5e1 !important; }
            #receipt-content .text-indigo-600 { color: #4f46e5 !important; }
          `}</style>
          <div id="receipt-content" className="bg-white mx-auto w-[210mm] min-h-[297mm] p-[20mm] text-slate-800">
            {/* Logo & Header */}
            <div className="flex justify-between items-start mb-12">
              <div>
                <div className="mb-6">
                  {settings.logo ? (
                    <img src={settings.logo} alt="Company Logo" className="h-20 w-auto object-contain aspect-[16/9]" />
                  ) : (
                    <div className="h-20 flex items-center">
                      <img src="/logo.svg" alt="Default Logo" className="h-full w-auto object-contain" />
                    </div>
                  )}
                </div>
                <div className="text-sm text-slate-500 space-y-1">
                  <p className="font-bold text-slate-800">{settings.companyName}</p>
                  <p className="whitespace-pre-line">{settings.companyAddress}</p>
                  <p>Email: {settings.supportEmail}</p>
                  <p>Web: {settings.websiteUrl}</p>
                  {settings.gst && <p>GST: {settings.gst}</p>}
                </div>
              </div>
              <div className="text-right">
                <h2 className="text-4xl font-black text-slate-100 mb-4">RECEIPT</h2>
                <div className="space-y-1">
                  <p className="text-sm font-bold">Receipt #: <span className="text-indigo-600">{receipt.receiptNumber}</span></p>
                  <p className="text-sm">Date: {formatDate(receipt.date, 'MMMM d, yyyy')}</p>
                  <p className="text-sm">Time: {formatDate(receipt.date, 'h:mm a')}</p>
                </div>
              </div>
            </div>

            {/* Student Info */}
            <div className="grid grid-cols-2 gap-8 mb-12 p-6 bg-slate-50 rounded-2xl border border-slate-100">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-2">Student Details</p>
                <p className="font-bold text-lg">{receipt.studentName}</p>
                <p className="text-sm">{receipt.email}</p>
                <p className="text-sm">{receipt.phone}</p>
                {receipt.college && <p className="text-sm mt-1 text-slate-500">{receipt.college}</p>}
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-2">Program Details</p>
                <p className="font-bold text-lg">{receipt.courseName}</p>
                <p className="text-sm">Category: {receipt.category}</p>
                <p className="text-sm">Batch: {receipt.batchName}</p>
                <p className="text-sm">Duration: {receipt.duration}</p>
              </div>
            </div>

            {/* Payment Table */}
            <table className="w-full mb-12">
              <thead>
                <tr className="border-b-2 border-slate-100">
                  <th className="py-4 text-left font-bold text-sm">Description</th>
                  <th className="py-4 text-right font-bold text-sm">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-50">
                  <td className="py-6">
                    <p className="font-bold">{receipt.category} Fees</p>
                    <p className="text-xs text-slate-500 mt-1">Payment Method: {receipt.paymentMethod}</p>
                    {receipt.transactionId && <p className="text-xs text-slate-500">Txn ID: {receipt.transactionId}</p>}
                  </td>
                  <td className="py-6 text-right font-bold text-lg">₹{formatAmount(receipt.amount)}</td>
                </tr>
              </tbody>
              <tfoot>
                <tr>
                  <td className="py-6 text-right font-medium text-slate-500">Total Amount Paid</td>
                  <td className="py-6 text-right font-black text-2xl text-indigo-600">₹{formatAmount(receipt.amount)}</td>
                </tr>
              </tfoot>
            </table>

            {/* Signatures & Footer */}
            <div className="mt-auto pt-12">
              <div className="flex justify-between items-end">
                <div className="max-w-xs">
                  <p className="text-[10px] text-slate-400 leading-relaxed italic">
                    Note: This is a system-generated receipt and does not require a physical signature. For any queries, please contact {settings.supportEmail}
                  </p>
                </div>
                {receipt.includeSignature !== false && (
                  <div className="text-center">
                    {settings.signature ? (
                      <img src={settings.signature} alt="Signature" className="h-16 mx-auto mb-2" />
                    ) : (
                      <div className="h-16 w-32 border-b border-slate-300 mx-auto mb-2"></div>
                    )}
                    <p className="font-bold text-sm">Authorized Signatory</p>
                    <p className="text-xs text-slate-500">{settings.companyName}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Branding Footer */}
            <div className="mt-12 pt-8 border-t border-slate-100 text-center">
              <p className="text-xs font-medium text-slate-400 tracking-widest uppercase">Thank you for choosing {settings.companyName}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceiptTemplate;
