import React from 'react';
import { MapPin, ShieldCheck } from 'lucide-react';
import { DocumentData } from './types';
import { calculateDocumentTotals, formatINR } from './utils/calculations';
import { paginateDocumentItems } from './utils/pagination';

interface DocumentA4PreviewProps {
  data: DocumentData;
  scale?: number;
}

export const DocumentA4Preview: React.FC<DocumentA4PreviewProps> = ({ data, scale = 1 }) => {
  const totals = calculateDocumentTotals(data);
  const pages = paginateDocumentItems(data.items);
  const totalPages = pages.length;
  const pageGapPx = 32;
  const unscaledHeight = totalPages * 1123 + (totalPages - 1) * pageGapPx;
  const unscaledWidth = 794;

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
      <div
        id="document-a4-outer-container"
        className="relative mx-auto transition-all duration-150"
        style={{
          width: `${Math.round(unscaledWidth * scale)}px`,
          height: `${Math.round(unscaledHeight * scale)}px`,
          maxWidth: '100%',
        }}
      >
        <div 
          id="document-a4-scale-wrapper"
          style={{ 
            transform: scale !== 1 ? `scale(${scale})` : undefined, 
            transformOrigin: 'top left',
            width: `${unscaledWidth}px`,
            height: `${unscaledHeight}px`,
            transition: 'transform 0.15s ease-out'
          }}
        >
          {pages.map((page) => (
            <div
              key={`a4-page-${page.pageNumber}`}
              id={page.pageNumber === 1 ? 'document-a4-sheet' : `document-a4-sheet-p${page.pageNumber}`}
              className="document-a4-page w-[794px] h-[1123px] min-h-[1123px] max-h-[1123px] bg-white text-slate-800 shadow-2xl rounded-sm flex flex-col justify-between select-text overflow-hidden relative"
              style={{
                fontFamily: '"Segoe UI", -apple-system, Roboto, BlinkMacSystemFont, Arial, sans-serif',
                letterSpacing: '0.012em',
                wordSpacing: '0.04em',
                fontKerning: 'normal',
                color: '#0f172a',
                backgroundColor: '#ffffff',
                boxSizing: 'border-box',
                marginBottom: page.isLastPage ? '0px' : `${pageGapPx}px`
              }}
            >
              {/* Top Content Area */}
              <div className="flex-1 flex flex-col justify-start">
                {page.isFirstPage ? (
                  <>
                    {/* Header Banner on Page 1 */}
                    <div
                      id="document-header-banner"
                      className="px-7 py-5 flex items-center justify-between"
                      style={{
                        background: 'linear-gradient(135deg, #180928 0%, #2b0c57 55%, #151030 100%)',
                        borderBottom: '3px solid #8b5cf6',
                        color: '#ffffff'
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
                            <div className="font-black text-2xl" style={{ color: '#ffffff' }}>F</div>
                          )}
                        </div>

                        <div>
                          <h1 className="text-2xl font-black m-0 leading-tight" style={{ color: '#ffffff', letterSpacing: '0.02em', wordSpacing: '0.08em' }}>
                            {data.companyName || 'Futurr Innovations and Research'}
                          </h1>
                          <p className="text-xs font-medium mt-1 leading-snug" style={{ color: '#f3e8ff', letterSpacing: '0.01em', wordSpacing: '0.06em' }}>
                            {data.companyTagline || 'Advanced Humanoid & Quadruped Robotics, High-Tech Stage Deployments & Automation'}
                          </p>
                          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider mt-1" style={{ color: '#e9d5ff' }}>
                            <span style={{ color: '#e9d5ff' }}>Pan-India Deployments</span>
                            <span style={{ color: '#c084fc' }}>•</span>
                            <span style={{ color: '#e9d5ff' }}>R&amp;D Operations</span>
                          </div>
                          {data.companyAddress && (
                            <div className="flex items-start gap-1 text-[9.5px] font-medium mt-1.5 leading-snug max-w-md" style={{ color: '#e9d5ff' }}>
                              <MapPin size={11} style={{ color: '#c084fc' }} className="shrink-0 mt-0.5" />
                              <span>{data.companyAddress}</span>
                            </div>
                          )}
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
                        <div className="text-xl font-black tracking-wide" style={{ color: '#ffffff' }}>
                          {data.documentNumber || 'QUO-FUT-001'}
                        </div>
                        <div className="text-xs font-medium mt-1" style={{ color: '#f3e8ff' }}>
                          Date:&nbsp;<span className="font-bold" style={{ color: '#ffffff' }}>{data.issueDate || 'YYYY-MM-DD'}</span>
                        </div>
                        <div className="text-xs font-medium" style={{ color: '#f3e8ff' }}>
                          Event / Due:&nbsp;<span className="font-bold" style={{ color: '#ffffff' }}>{data.dueDate || 'YYYY-MM-DD'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Client & Booking Metadata Section */}
                    <div
                      className="px-7 py-3.5 grid grid-cols-2 gap-8"
                      style={{
                        backgroundColor: '#f8fafc',
                        borderBottom: '1px solid #e2e8f0',
                        color: '#0f172a'
                      }}
                    >
                      {/* Left: Billed / Quoted To */}
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-widest block mb-1.5" style={{ color: '#64748b' }}>
                          {data.mode === 'invoice' ? 'BILLED TO:' : data.mode === 'receipt' ? 'RECEIVED FROM:' : 'BILLED / QUOTED TO:'}
                        </span>
                        <div className="text-base font-black leading-tight" style={{ color: '#0f172a', wordSpacing: '0.06em' }}>
                          {data.customerName || 'Contact not recorded'}
                        </div>
                        {data.customerCompany && (
                          <div className="text-xs font-semibold mt-0.5" style={{ color: '#475569', wordSpacing: '0.06em' }}>
                            {data.customerCompany}
                          </div>
                        )}
                        {data.customerAddress ? (
                          <div className="flex items-start gap-1.5 text-xs font-medium mt-1 leading-relaxed" style={{ color: '#475569', wordSpacing: '0.05em' }}>
                            <MapPin size={13} style={{ color: '#7c3aed' }} className="shrink-0 mt-0.5" />
                            <span>{data.customerAddress}</span>
                          </div>
                        ) : data.venue ? (
                          <div className="flex items-center gap-1.5 text-xs font-medium mt-1" style={{ color: '#475569', wordSpacing: '0.06em' }}>
                            <MapPin size={13} style={{ color: '#7c3aed' }} className="shrink-0" />
                            <span>{data.venue}</span>
                          </div>
                        ) : null}
                        {data.customerGst && (
                          <div className="text-[11px] font-mono mt-1" style={{ color: '#64748b' }}>
                            GSTIN:&nbsp;<span className="font-bold" style={{ color: '#0f172a' }}>{data.customerGst}</span>
                          </div>
                        )}
                      </div>

                      {/* Right: Booking & Dispatch Reference */}
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-widest block mb-1.5" style={{ color: '#64748b' }}>
                          BOOKING &amp; DISPATCH REFERENCE:
                        </span>
                        <div className="text-xs space-y-1" style={{ color: '#475569', wordSpacing: '0.05em' }}>
                          <div>
                            Event Date:&nbsp;<span className="font-bold" style={{ color: '#0f172a' }}>{data.dueDate || 'N/A'}</span>
                          </div>
                          <div>
                            CRM Inq ID:&nbsp;<span className="font-bold" style={{ color: '#6d28d9' }}>{data.bookingRef || data.documentNumber}</span>
                          </div>
                          <div>
                            Venue:&nbsp;<span className="font-bold" style={{ color: '#0f172a' }}>{data.venue || 'On-site'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  /* Running Header Banner for Pages 2+ */
                  <div
                    className="px-7 py-4 flex items-center justify-between"
                    style={{
                      background: 'linear-gradient(135deg, #180928 0%, #2b0c57 55%, #151030 100%)',
                      borderBottom: '3px solid #8b5cf6',
                      color: '#ffffff'
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center p-1.5 overflow-hidden shadow shrink-0"
                        style={{
                          background: 'rgba(255, 255, 255, 0.08)',
                          border: '1px solid rgba(255, 255, 255, 0.2)'
                        }}
                      >
                        {data.logoUrl ? (
                          <img src={data.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                        ) : (
                          <div className="font-black text-lg" style={{ color: '#ffffff' }}>F</div>
                        )}
                      </div>
                      <div>
                        <h2 className="text-base font-black m-0 leading-tight" style={{ color: '#ffffff', letterSpacing: '0.02em', wordSpacing: '0.06em' }}>
                          {data.companyName || 'Futurr Innovations and Research'}
                        </h2>
                        <div className="flex items-center gap-2 text-[9.5px] font-bold uppercase tracking-wider mt-0.5" style={{ color: '#e9d5ff' }}>
                          <span>Pan-India Deployments</span>
                          <span style={{ color: '#c084fc' }}>•</span>
                          <span>R&amp;D Operations</span>
                          {data.customerName && (
                            <>
                              <span style={{ color: '#c084fc' }}>•</span>
                              <span style={{ color: '#f3e8ff' }}>Client: {data.customerName}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0 flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm font-black tracking-wide" style={{ color: '#ffffff' }}>
                          {data.documentNumber || 'QUO-FUT-001'}
                        </div>
                        <div className="text-[10px] font-medium" style={{ color: '#f3e8ff' }}>
                          Date:&nbsp;<span className="font-bold" style={{ color: '#ffffff' }}>{data.issueDate || 'YYYY-MM-DD'}</span>
                        </div>
                      </div>
                      <div
                        className="px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-wider shadow-sm"
                        style={{
                          backgroundColor: badge.bgColor,
                          color: badge.textColor
                        }}
                      >
                        {badge.title}
                      </div>
                    </div>
                  </div>
                )}

                {/* Line Items Table */}
                <div className="px-7 pt-3 pb-1">
                  <table className="w-full text-left" style={{ borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #0f172a' }}>
                        <th className="py-2 px-3 text-[10px] font-black uppercase tracking-wider w-10 text-center" style={{ color: '#475569' }}>
                          #
                        </th>
                        <th className="py-2 px-3 text-[10px] font-black uppercase tracking-wider" style={{ color: '#475569' }}>
                          Item / Service
                        </th>
                        <th className="py-2 px-3 text-[10px] font-black uppercase tracking-wider text-center w-32" style={{ color: '#475569' }}>
                          Category
                        </th>
                        <th className="py-2 px-3 text-[10px] font-black uppercase tracking-wider text-center w-20" style={{ color: '#475569' }}>
                          Qty / Days
                        </th>
                        <th className="py-2 px-3 text-[10px] font-black uppercase tracking-wider text-right w-28" style={{ color: '#475569' }}>
                          Unit Rate (₹)
                        </th>
                        <th className="py-2 px-3 text-[10px] font-black uppercase tracking-wider text-right w-32" style={{ color: '#475569' }}>
                          Amount (₹)
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {page.items.map((item, idx) => {
                        const globalIndex = page.startIndex + idx + 1;
                        return (
                          <tr
                            key={item.id || `${page.pageNumber}-${idx}`}
                            style={{
                              borderBottom: '1px solid #f1f5f9',
                              backgroundColor: idx % 2 === 0 ? '#ffffff' : '#fafafa'
                            }}
                          >
                            <td className="py-2.5 px-3 text-xs font-bold text-center" style={{ color: '#94a3b8' }}>
                              {globalIndex}
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="text-xs font-bold leading-snug" style={{ color: '#0f172a', wordSpacing: '0.06em' }}>
                                {item.name || 'Untitled Service'}
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span
                                className="inline-block px-2.5 py-0.5 rounded text-[10px] font-semibold"
                                style={{
                                  backgroundColor: '#f1f5f9',
                                  border: '1px solid #e2e8f0',
                                  color: '#475569',
                                  wordSpacing: '0.05em'
                                }}
                              >
                                {item.category || 'Service'}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-xs font-bold text-center" style={{ color: '#0f172a' }}>
                              {item.quantity}
                            </td>
                            <td className="py-2.5 px-3 text-xs font-medium text-right font-mono" style={{ color: '#334155' }}>
                              ₹{formatINR(item.rate)}
                            </td>
                            <td className="py-2.5 px-3 text-xs font-black text-right font-mono" style={{ color: '#0f172a' }}>
                              ₹{formatINR(item.amount)}
                            </td>
                          </tr>
                        );
                      })}

                      {page.items.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-xs italic" style={{ color: '#94a3b8' }}>
                            No line items on this page.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Terms & Totals Split Grid - STRICTLY RENDERED ON LAST PAGE ONLY */}
                {page.isLastPage && (
                  <div className="px-7 pt-3 pb-3 grid grid-cols-12 gap-6">
                    {/* Left Column: Terms & Banking Details (7 cols) */}
                    <div className="col-span-7 space-y-2">
                      <div>
                        <span className="text-[11px] font-black uppercase tracking-wider block mb-1" style={{ color: '#0f172a' }}>
                          Terms &amp; Banking Details:
                        </span>
                        <p className="text-[10.5px] leading-relaxed" style={{ color: '#475569', wordSpacing: '0.06em' }}>
                          {data.termsAndConditions || 'Bank transfer / NEFT / UPI settlement prior to dispatch. All bookings subject to operator safety clearance and technical verification.'}
                        </p>
                      </div>

                      {data.bankDetails && (
                        <div
                          className="p-2.5 rounded-xl space-y-1 text-[10.5px]"
                          style={{
                            backgroundColor: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            wordSpacing: '0.04em'
                          }}
                        >
                          <div className="text-[9.5px] font-bold uppercase tracking-wider mb-0.5" style={{ color: '#64748b' }}>
                            Direct Settlement Account
                          </div>
                          <div style={{ color: '#334155' }}>
                            Bank:&nbsp;<span className="font-bold" style={{ color: '#0f172a' }}>{data.bankDetails.bankName || 'HDFC Bank Ltd'}</span>&nbsp;•&nbsp;A/C:&nbsp;<span className="font-bold font-mono" style={{ color: '#0f172a' }}>{data.bankDetails.accountNumber || '50200088921044'}</span>
                          </div>
                          <div style={{ color: '#334155' }}>
                            IFSC:&nbsp;<span className="font-bold font-mono" style={{ color: '#0f172a' }}>{data.bankDetails.ifsc || 'HDFC0001234'}</span>&nbsp;•&nbsp;UPI:&nbsp;<span className="font-bold font-mono" style={{ color: '#7c3aed' }}>{data.bankDetails.upiId || 'futurr@upi'}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right Column: Financial Summary Box (5 cols) */}
                    <div className="col-span-5">
                      <div
                        className="rounded-xl p-3 space-y-1.5"
                        style={{
                          backgroundColor: '#ffffff',
                          border: '1px solid #e2e8f0',
                          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)'
                        }}
                      >
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-medium" style={{ color: '#64748b', wordSpacing: '0.04em' }}>Items Subtotal:</span>
                          <span className="font-bold font-mono" style={{ color: '#0f172a' }}>₹{formatINR(totals.subtotal)}</span>
                        </div>

                        {totals.transportCharges > 0 && (
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-medium" style={{ color: '#64748b', wordSpacing: '0.04em' }}>Transport &amp; Logistics:</span>
                            <span className="font-bold font-mono" style={{ color: '#0f172a' }}>₹{formatINR(totals.transportCharges)}</span>
                          </div>
                        )}

                        {totals.discount > 0 && (
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-medium" style={{ color: '#059669', wordSpacing: '0.04em' }}>Discount:</span>
                            <span className="font-bold font-mono" style={{ color: '#059669' }}>-₹{formatINR(totals.discount)}</span>
                          </div>
                        )}

                        <div className="flex justify-between items-center text-xs">
                          <span className="font-medium" style={{ color: '#64748b' }}>GST:</span>
                          {data.gstType === 'exempt' ? (
                            <span
                              className="text-[10px] font-bold px-2 py-0.5 rounded"
                              style={{ backgroundColor: '#f1f5f9', border: '1px solid #e2e8f0', color: '#475569', wordSpacing: '0.05em' }}
                            >
                              Not Applicable
                            </span>
                          ) : (
                            <span className="font-bold font-mono" style={{ color: '#0f172a' }}>₹{formatINR(totals.totalTax)}</span>
                          )}
                        </div>

                        <div
                          className="pt-2 flex justify-between items-baseline"
                          style={{ borderTop: '2px solid #0f172a' }}
                        >
                          <span className="text-sm font-black" style={{ color: '#0f172a', wordSpacing: '0.04em' }}>Grand Total:</span>
                          <span
                            className="text-xl font-black font-mono"
                            style={{ color: '#1e0b36' }}
                          >
                            ₹{formatINR(totals.grandTotal)}
                          </span>
                        </div>

                        <div className="text-[9.5px] text-center italic mt-0.5" style={{ color: '#94a3b8', wordSpacing: '0.04em' }}>
                          {data.gstType === 'exempt'
                            ? '* GST Not Applicable (Exempt / Nil)'
                            : '* Inclusive of 18% Applicable GST'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Section: Legal Footer on Every Page */}
              <div
                className="px-7 py-3 flex items-end justify-between shrink-0"
                style={{
                  borderTop: '1px solid #e2e8f0',
                  backgroundColor: '#ffffff'
                }}
              >
                {/* Left Legal Division */}
                <div className="space-y-1 max-w-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black tracking-wide" style={{ color: '#0f172a', wordSpacing: '0.04em' }}>
                      {data.companyName || 'Futurr Innovations and Research'}
                    </span>
                    <span
                      className="px-2 py-0.5 text-[9px] font-bold rounded"
                      style={{ backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0' }}
                    >
                      Page {page.pageNumber} of {page.totalPages}
                    </span>
                  </div>
                  <div className="text-[11px] font-semibold" style={{ color: '#6d28d9', wordSpacing: '0.04em' }}>
                    Advanced Robotics &amp; Autonomous Systems Division
                  </div>
                  {data.companyAddress && (
                    <div className="text-[9.5px] font-medium leading-snug flex items-start gap-1 line-clamp-2" style={{ color: '#64748b', wordSpacing: '0.03em' }}>
                      <MapPin size={11} className="shrink-0 mt-0.5" style={{ color: '#7c3aed' }} />
                      <span>{data.companyAddress}</span>
                    </div>
                  )}
                  <div className="text-[10px]" style={{ color: '#94a3b8', wordSpacing: '0.04em' }}>
                    GST Status:&nbsp;{data.gstType === 'exempt' ? 'Not Applicable (Exempt / Nil)' : `Registered (${data.customerGst || 'Standard'})`}
                  </div>
                </div>

                {/* Right: Signature Slot on Last Page OR Continuation Notice on Earlier Pages */}
                {page.isLastPage ? (
                  <div
                    className="w-64 p-2.5 rounded-xl text-center space-y-1 shrink-0"
                    style={{
                      backgroundColor: '#faf5ff',
                      border: '1px dashed #c084fc'
                    }}
                  >
                    <div className="text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-1" style={{ color: '#7c3aed' }}>
                      <ShieldCheck size={11} /> DIGITAL SIGNATURE SLOT
                    </div>

                    {/* Signature Render */}
                    <div className="h-10 flex items-center justify-center">
                      {data.signatureDataUrl ? (
                        <img
                          src={data.signatureDataUrl}
                          alt="Signature"
                          className="max-h-full max-w-full object-contain"
                        />
                      ) : (
                        <span className="text-xs font-serif italic font-bold" style={{ color: '#1e1b4b' }}>
                          {data.signatoryName || 'Authorized Signatory'}
                        </span>
                      )}
                    </div>

                    <div
                      className="pt-1"
                      style={{ borderTop: '1px solid #e9d5ff' }}
                    >
                      <div className="text-xs font-black" style={{ color: '#0f172a' }}>
                        {data.signatoryName || 'Authorized Signatory'}
                      </div>
                      <div className="text-[10px] font-medium" style={{ color: '#64748b' }}>
                        {data.signatoryDesignation || 'Authorized Signatory, Futurr Innovations and Research'}
                      </div>
                      <div className="text-[8px] font-mono tracking-wider mt-0.5" style={{ color: '#94a3b8' }}>
                        ISO-256-M SHA1-PAD ELECTRONIC STAMP
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    className="w-64 p-2.5 rounded-xl text-center flex flex-col items-center justify-center space-y-1 shrink-0"
                    style={{
                      backgroundColor: '#f8fafc',
                      border: '1px dashed #cbd5e1'
                    }}
                  >
                    <span className="text-[11px] font-black uppercase tracking-wider" style={{ color: '#475569' }}>
                      Continued on Page {page.pageNumber + 1} &rarr;
                    </span>
                    <span className="text-[9px] font-medium" style={{ color: '#94a3b8' }}>
                      Financial Summary &amp; Digital Authorization on Final Page
                    </span>
                    <span className="text-[8px] font-mono font-bold" style={{ color: '#6d28d9' }}>
                      {data.documentNumber} &bull; Page {page.pageNumber} of {page.totalPages}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DocumentA4Preview;
