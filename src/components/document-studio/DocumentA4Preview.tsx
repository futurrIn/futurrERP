import React from 'react';
import { MapPin, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { DocumentData } from './types';
import { calculateDocumentTotals, formatINR } from './utils/calculations';

interface DocumentA4PreviewProps {
  data: DocumentData;
}

export const DocumentA4Preview: React.FC<DocumentA4PreviewProps> = ({ data }) => {
  const totals = calculateDocumentTotals(data);

  const getModeBadge = () => {
    switch (data.mode) {
      case 'invoice':
        return {
          title: 'TAX INVOICE',
          bgColor: '#34d399',
          textColor: '#064e3b'
        };
      case 'receipt':
        return {
          title: 'OFFICIAL RECEIPT',
          bgColor: '#818cf8',
          textColor: '#1e1b4b'
        };
      default:
        return {
          title: 'OFFICIAL QUOTATION',
          bgColor: '#fbbf24',
          textColor: '#451a03'
        };
    }
  };

  const badge = getModeBadge();

  return (
    <div className="w-full flex justify-center py-2 px-1 overflow-x-auto">
      {/* 
        Strict ISO A4 Proportion Container
        Standard A4 at 96 DPI: ~794px width x 1123px height
      */}
      <div
        id="document-a4-sheet"
        className="w-[794px] min-h-[1123px] bg-white text-slate-800 shadow-2xl rounded-sm flex flex-col justify-between select-text"
        style={{
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          color: '#1e293b',
          backgroundColor: '#ffffff',
          boxSizing: 'border-box'
        }}
      >
        {/* Top Content Area */}
        <div>
          {/* Header Banner */}
          <div
            className="p-7 text-white flex items-center justify-between"
            style={{
              background: 'linear-gradient(135deg, #180928 0%, #2b0c57 55%, #151030 100%)',
              borderBottom: '3px solid #8b5cf6'
            }}
          >
            {/* Company Info Left */}
            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center p-2.5 overflow-hidden shadow-lg shrink-0"
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.2)'
                }}
              >
                {data.logoUrl ? (
                  <img src={data.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <div className="text-white font-black text-xl">F</div>
                )}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-black tracking-tight text-white m-0">
                    FUTURR INNOVATIONS
                  </h1>
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded tracking-widest text-purple-200"
                    style={{ border: '1px solid rgba(216, 180, 254, 0.4)' }}
                  >
                    PVT LTD
                  </span>
                </div>
                <p className="text-xs text-purple-200 font-medium mt-1 leading-snug">
                  Advanced Humanoid &amp; Quadruped Robotics, High-Tech Stage Deployments &amp; Automation
                </p>
                <div className="flex items-center gap-2 text-[10px] text-purple-300 font-bold uppercase tracking-wider mt-1">
                  <span>Pan-India Deployments</span>
                  <span>•</span>
                  <span>R&amp;D Operations</span>
                </div>
              </div>
            </div>

            {/* Document Reference & Badge Right */}
            <div className="text-right shrink-0">
              <div
                className="inline-block px-3 py-1 rounded-md text-[11px] font-black uppercase tracking-wider shadow-sm mb-2"
                style={{
                  backgroundColor: badge.bgColor,
                  color: badge.textColor
                }}
              >
                {badge.title}
              </div>
              <div className="text-xl font-black tracking-wide text-white">
                {data.documentNumber || 'QUO-FUT-001'}
              </div>
              <div className="text-xs text-purple-200 font-medium mt-1">
                Date: <span className="font-bold text-white">{data.issueDate || 'YYYY-MM-DD'}</span>
              </div>
              <div className="text-xs text-purple-200 font-medium">
                Event / Due: <span className="font-bold text-white">{data.dueDate || 'YYYY-MM-DD'}</span>
              </div>
            </div>
          </div>

          {/* Client & Booking Metadata Section */}
          <div
            className="p-7 grid grid-cols-2 gap-8"
            style={{
              backgroundColor: '#f8fafc',
              borderBottom: '1px solid #e2e8f0'
            }}
          >
            {/* Left: Billed / Quoted To */}
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest block text-slate-400 mb-1.5">
                {data.mode === 'invoice' ? 'BILLED TO:' : data.mode === 'receipt' ? 'RECEIVED FROM:' : 'BILLED / QUOTED TO:'}
              </span>
              <div className="text-base font-black text-slate-900 leading-tight">
                {data.customerName || 'Contact not recorded'}
              </div>
              {data.customerCompany && (
                <div className="text-xs font-semibold text-slate-600 mt-0.5">
                  {data.customerCompany}
                </div>
              )}
              {data.venue && (
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mt-1">
                  <MapPin size={13} className="text-purple-600 shrink-0" />
                  <span>{data.venue}</span>
                </div>
              )}
              {data.customerGst && (
                <div className="text-[11px] font-mono text-slate-500 mt-1">
                  GSTIN: <span className="font-bold text-slate-700">{data.customerGst}</span>
                </div>
              )}
            </div>

            {/* Right: Booking & Dispatch Reference */}
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest block text-slate-400 mb-1.5">
                BOOKING &amp; DISPATCH REFERENCE:
              </span>
              <div className="text-xs text-slate-600 space-y-1">
                <div>
                  Event Date: <span className="font-bold text-slate-800">{data.dueDate || 'N/A'}</span>
                </div>
                <div>
                  CRM Inq ID: <span className="font-bold text-purple-700">{data.bookingRef || data.documentNumber}</span>
                </div>
                <div>
                  Venue: <span className="font-bold text-slate-800">{data.venue || 'On-site'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="p-7">
            <table className="w-full text-left" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #0f172a' }}>
                  <th className="py-2.5 px-3 text-[10px] font-black uppercase tracking-wider text-slate-500 w-10 text-center">
                    #
                  </th>
                  <th className="py-2.5 px-3 text-[10px] font-black uppercase tracking-wider text-slate-500">
                    Item / Service
                  </th>
                  <th className="py-2.5 px-3 text-[10px] font-black uppercase tracking-wider text-slate-500 text-center w-32">
                    Category
                  </th>
                  <th className="py-2.5 px-3 text-[10px] font-black uppercase tracking-wider text-slate-500 text-center w-20">
                    Qty / Days
                  </th>
                  <th className="py-2.5 px-3 text-[10px] font-black uppercase tracking-wider text-slate-500 text-right w-28">
                    Unit Rate (₹)
                  </th>
                  <th className="py-2.5 px-3 text-[10px] font-black uppercase tracking-wider text-slate-500 text-right w-32">
                    Amount (₹)
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((item, idx) => (
                  <tr
                    key={item.id || idx}
                    style={{
                      borderBottom: '1px solid #f1f5f9',
                      backgroundColor: idx % 2 === 0 ? '#ffffff' : '#fafafa'
                    }}
                  >
                    <td className="py-3.5 px-3 text-xs font-bold text-slate-400 text-center">
                      {idx + 1}
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="text-xs font-bold text-slate-800">{item.name || 'Untitled Service'}</div>
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <span
                        className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold text-slate-600"
                        style={{
                          backgroundColor: '#f1f5f9',
                          border: '1px solid #e2e8f0'
                        }}
                      >
                        {item.category || 'Service'}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-xs font-bold text-slate-700 text-center">
                      {item.quantity}
                    </td>
                    <td className="py-3.5 px-3 text-xs font-medium text-slate-700 text-right font-mono">
                      ₹{formatINR(item.rate)}
                    </td>
                    <td className="py-3.5 px-3 text-xs font-black text-slate-900 text-right font-mono">
                      ₹{formatINR(item.amount)}
                    </td>
                  </tr>
                ))}

                {data.items.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 text-xs italic">
                      No line items specified.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Terms & Totals Split Grid */}
          <div className="px-7 pb-6 grid grid-cols-12 gap-8">
            {/* Left Column: Terms & Banking Details (7 cols) */}
            <div className="col-span-7 space-y-3">
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-700 block mb-1">
                  Terms &amp; Banking Details:
                </span>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  {data.termsAndConditions || 'Bank transfer / NEFT / UPI settlement prior to dispatch. All bookings subject to operator safety clearance and technical verification.'}
                </p>
              </div>

              {data.bankDetails && (
                <div
                  className="p-3 rounded-xl space-y-1 text-[11px]"
                  style={{
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0'
                  }}
                >
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Direct Settlement Account
                  </div>
                  <div className="text-slate-700">
                    Bank: <span className="font-bold text-slate-900">{data.bankDetails.bankName || 'HDFC Bank'}</span> • A/C: <span className="font-bold font-mono text-slate-900">{data.bankDetails.accountNumber || '50200088921044'}</span>
                  </div>
                  <div className="text-slate-700">
                    IFSC: <span className="font-bold font-mono text-slate-900">{data.bankDetails.ifsc || 'HDFC0001234'}</span> • UPI: <span className="font-bold font-mono text-purple-700">{data.bankDetails.upiId || 'futurr@upi'}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Financial Summary Box (5 cols) */}
            <div className="col-span-5">
              <div
                className="rounded-xl p-4 space-y-2.5"
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)'
                }}
              >
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-medium">Items Subtotal:</span>
                  <span className="font-bold text-slate-800 font-mono">₹{formatINR(totals.subtotal)}</span>
                </div>

                {totals.transportCharges > 0 && (
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-medium">Transport &amp; Logistics:</span>
                    <span className="font-bold text-slate-800 font-mono">₹{formatINR(totals.transportCharges)}</span>
                  </div>
                )}

                {totals.discount > 0 && (
                  <div className="flex justify-between items-center text-xs text-emerald-600">
                    <span className="font-medium">Discount:</span>
                    <span className="font-bold font-mono">-₹{formatINR(totals.discount)}</span>
                  </div>
                )}

                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-medium">GST:</span>
                  {data.gstType === 'exempt' ? (
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded text-slate-600"
                      style={{ backgroundColor: '#f1f5f9', border: '1px solid #e2e8f0' }}
                    >
                      Not Applicable
                    </span>
                  ) : (
                    <span className="font-bold text-slate-800 font-mono">₹{formatINR(totals.totalTax)}</span>
                  )}
                </div>

                <div
                  className="pt-2.5 flex justify-between items-baseline"
                  style={{ borderTop: '2px solid #0f172a' }}
                >
                  <span className="text-sm font-black text-slate-900 tracking-tight">Grand Total:</span>
                  <span
                    className="text-xl font-black font-mono tracking-tight"
                    style={{ color: '#1e0b36' }}
                  >
                    ₹{formatINR(totals.grandTotal)}
                  </span>
                </div>

                <div className="text-[10px] text-slate-400 text-center italic mt-1">
                  {data.gstType === 'exempt'
                    ? '* GST Not Applicable (Exempt / Nil)'
                    : '* Inclusive of 18% Applicable GST'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section: Legal Footer & Authenticated Signature Slot */}
        <div
          className="p-7 flex items-end justify-between"
          style={{
            borderTop: '1px solid #e2e8f0',
            backgroundColor: '#ffffff'
          }}
        >
          {/* Left Legal Division */}
          <div className="space-y-1">
            <div className="text-xs font-black text-slate-800 tracking-wide">
              Futurr Innovations
            </div>
            <div className="text-[11px] text-slate-500 font-medium">
              Advanced Robotics &amp; Autonomous Systems Division
            </div>
            <div className="text-[10px] text-slate-400">
              GST Status: {data.gstType === 'exempt' ? 'Not Applicable (Exempt/Nil)' : `Registered (${data.customerGst || 'Standard'})`}
            </div>
          </div>

          {/* Right Signature Block */}
          <div
            className="w-64 p-3 rounded-xl text-center space-y-1"
            style={{
              backgroundColor: '#faf5ff',
              border: '1px dashed #c084fc'
            }}
          >
            <div className="text-[9px] font-black text-purple-700 uppercase tracking-widest flex items-center justify-center gap-1">
              <ShieldCheck size={11} /> DIGITAL SIGNATURE SLOT
            </div>

            {/* Signature Render */}
            <div className="h-12 flex items-center justify-center">
              {data.signatureDataUrl ? (
                <img
                  src={data.signatureDataUrl}
                  alt="Signature"
                  className="max-h-full max-w-full object-contain"
                />
              ) : (
                <span className="text-xs font-serif italic text-purple-900 font-bold">
                  {data.signatoryName || 'Albin - Operations Lead'}
                </span>
              )}
            </div>

            <div
              className="pt-1"
              style={{ borderTop: '1px solid #e9d5ff' }}
            >
              <div className="text-xs font-black text-slate-800">
                {data.signatoryName || 'Albin - Operations Lead'}
              </div>
              <div className="text-[10px] text-slate-500 font-medium">
                {data.signatoryDesignation || 'Authorized Signatory, Futurr Innovations'}
              </div>
              <div className="text-[8px] text-slate-400 font-mono tracking-wider mt-0.5">
                ISO-256-M SHA1-PAD ELECTRONIC STAMP
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default DocumentA4Preview;

