import React from 'react';
import { 
  FileText, 
  Trash2, 
  Plus, 
  Percent,
  Save,
  Landmark
} from 'lucide-react';
import { DocumentData, LineItem, BankAccount } from './types';
import CatalogQuickAdd from './CatalogQuickAdd';

interface DocumentControlsProps {
  data: DocumentData;
  onChange: (updates: Partial<DocumentData>) => void;
  onItemChange: (items: LineItem[]) => void;
  bankAccounts?: BankAccount[];
  onSaveDefaultTemplate?: () => void;
  onResetTemplate?: () => void;
}

export const DocumentControls: React.FC<DocumentControlsProps> = ({
  data,
  onChange,
  onItemChange,
  bankAccounts = [],
  onSaveDefaultTemplate,
  onResetTemplate
}) => {
  // Line Items handling
  const handleAddItem = (preset?: Omit<LineItem, 'id'>) => {
    const newItem: LineItem = {
      id: 'item_' + Date.now() + Math.random().toString(36).substring(2, 6),
      name: preset?.name || '',
      category: preset?.category || 'Service',
      quantity: preset?.quantity || 1,
      rate: preset?.rate || 0,
      amount: preset ? preset.quantity * preset.rate : 0
    };
    onItemChange([...data.items, newItem]);
  };

  const handleUpdateItem = (id: string, updates: Partial<LineItem>) => {
    const updated = data.items.map(item => {
      if (item.id === id) {
        const next = { ...item, ...updates };
        next.amount = (Number(next.quantity) || 0) * (Number(next.rate) || 0);
        return next;
      }
      return item;
    });
    onItemChange(updated);
  };

  const handleRemoveItem = (id: string) => {
    onItemChange(data.items.filter(item => item.id !== id));
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* 1. Document & Client Details Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <FileText size={16} className="text-purple-600" />
            <h3 className="font-bold text-slate-800 text-sm">Document & Client Details</h3>
          </div>
          <span className="text-[10px] font-black text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 uppercase tracking-widest">
            {data.mode}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Document #
            </label>
            <input
              type="text"
              value={data.documentNumber}
              onChange={(e) => onChange({ documentNumber: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 outline-none focus:border-purple-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Issue Date
            </label>
            <input
              type="date"
              value={data.issueDate}
              onChange={(e) => onChange({ issueDate: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 outline-none focus:border-purple-500 focus:bg-white"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Customer / Organization Name
            </label>
            <input
              type="text"
              value={data.customerName}
              onChange={(e) => onChange({ customerName: e.target.value })}
              placeholder="e.g. Acme Robotics Lab / IIT Techfest"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 outline-none focus:border-purple-500 focus:bg-white"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Customer Billing Address
            </label>
            <input
              type="text"
              value={data.customerAddress || ''}
              onChange={(e) => onChange({ customerAddress: e.target.value })}
              placeholder="e.g. Building, Road, City, State, PIN"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 outline-none focus:border-purple-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Event / Due Date
            </label>
            <input
              type="date"
              value={data.dueDate}
              onChange={(e) => onChange({ dueDate: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 outline-none focus:border-purple-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Location / Venue
            </label>
            <input
              type="text"
              value={data.venue}
              onChange={(e) => onChange({ venue: e.target.value })}
              placeholder="e.g. Mumbai, Maharashtra"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 outline-none focus:border-purple-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Client Company / Department
            </label>
            <input
              type="text"
              value={data.customerCompany}
              onChange={(e) => onChange({ customerCompany: e.target.value })}
              placeholder="e.g. Department of AI & Robotics"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 outline-none focus:border-purple-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Client GSTIN / Tax ID
            </label>
            <input
              type="text"
              value={data.customerGst}
              onChange={(e) => onChange({ customerGst: e.target.value })}
              placeholder="e.g. 27AAAAA0000A1Z5 (Optional)"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 outline-none focus:border-purple-500 focus:bg-white"
            />
          </div>
        </div>
      </div>

      {/* 2. Line Items Breakdown Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-slate-800 text-sm">Line Items Breakdown</h3>
            <p className="text-[11px] text-slate-400">Add robots, equipment, software, crew, and custom items</p>
          </div>
          <button
            type="button"
            onClick={() => handleAddItem()}
            className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
          >
            <Plus size={13} /> Add Item Field
          </button>
        </div>

        {/* Quick Add Presets */}
        <CatalogQuickAdd onAddItem={(item) => handleAddItem(item)} />

        {/* Items List */}
        <div className="space-y-3 pt-2">
          {data.items.map((item, index) => (
            <div
              key={item.id}
              className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5 transition-all hover:border-slate-300"
            >
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px] font-black shrink-0">
                  {index + 1}
                </span>
                <input
                  type="text"
                  placeholder="Item / Service description..."
                  value={item.name}
                  onChange={(e) => handleUpdateItem(item.id, { name: e.target.value })}
                  className="flex-1 min-w-0 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 outline-none focus:border-purple-500"
                />
                <input
                  type="text"
                  placeholder="Category"
                  value={item.category}
                  onChange={(e) => handleUpdateItem(item.id, { category: e.target.value })}
                  className="w-20 sm:w-28 shrink-0 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-600 outline-none focus:border-purple-500"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveItem(item.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors shrink-0"
                  title="Remove item"
                >
                  <Trash2 size={15} />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-200/60 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Qty / Days
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => handleUpdateItem(item.id, { quantity: Number(e.target.value) || 0 })}
                    className="w-full px-2.5 py-1 bg-white border border-slate-200 rounded-md text-xs font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Rate (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={item.rate}
                    onChange={(e) => handleUpdateItem(item.id, { rate: Number(e.target.value) || 0 })}
                    className="w-full px-2.5 py-1 bg-white border border-slate-200 rounded-md text-xs font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Line Total
                  </label>
                  <div className="px-2.5 py-1 bg-slate-100 rounded-md text-xs font-black text-slate-800 flex items-center justify-end">
                    ₹{item.amount?.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {data.items.length === 0 && (
            <div className="text-center p-6 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-slate-400 text-xs font-medium">
              No line items added yet. Click &quot;Add Item Field&quot; or choose a catalog preset above.
            </div>
          )}
        </div>
      </div>

      {/* 5. Additional Charges, Taxes & Terms Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
        <h3 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-3 flex items-center gap-2">
          <Percent size={16} className="text-purple-600" />
          <span>Taxes, Logistics & Banking Terms</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Transport & Logistics (₹)
            </label>
            <input
              type="number"
              min="0"
              value={data.transportCharges}
              onChange={(e) => onChange({ transportCharges: Number(e.target.value) || 0 })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 outline-none focus:border-purple-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Discount (₹)
            </label>
            <input
              type="number"
              min="0"
              value={data.discount}
              onChange={(e) => onChange({ discount: Number(e.target.value) || 0 })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 outline-none focus:border-purple-500 focus:bg-white"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              GST Calculation Type
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => onChange({ gstType: 'exempt' })}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all text-center ${
                  data.gstType === 'exempt'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Not Applicable (Exempt / Nil)
              </button>
              <button
                type="button"
                onClick={() => onChange({ gstType: 'cgst_sgst', gstRate: 18 })}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all text-center ${
                  data.gstType === 'cgst_sgst'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                CGST + SGST (9% + 9%)
              </button>
              <button
                type="button"
                onClick={() => onChange({ gstType: 'igst', gstRate: 18 })}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all text-center ${
                  data.gstType === 'igst'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                IGST (18%)
              </button>
            </div>
          </div>
        </div>

        {/* Banking & Terms */}
        <div className="space-y-3.5 pt-2 border-t border-slate-100">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Terms &amp; Conditions
            </label>
            <textarea
              rows={2}
              value={data.termsAndConditions}
              onChange={(e) => onChange({ termsAndConditions: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 outline-none focus:border-purple-500 focus:bg-white resize-none"
            />
          </div>

          {/* Quick Select from Configured Bank Accounts */}
          {bankAccounts && bankAccounts.length > 0 && (
            <div className="space-y-1.5 p-3 bg-purple-50/50 rounded-xl border border-purple-100">
              <div className="flex items-center justify-between">
                <label className="block text-[11px] font-bold text-purple-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Landmark size={13} className="text-purple-600" />
                  <span>Settlement Bank Account</span>
                </label>
                <button
                  type="button"
                  onClick={() => (window as any).setActiveTab?.('settings')}
                  className="text-[10px] font-bold text-purple-600 hover:text-purple-800 hover:underline"
                >
                  + Add in Settings
                </button>
              </div>
              <select
                value={data.bankDetails.id || ''}
                onChange={(e) => {
                  const selectedId = e.target.value;
                  const found = bankAccounts.find(b => b.id === selectedId);
                  if (found) {
                    onChange({
                      bankDetails: {
                        id: found.id,
                        label: found.label,
                        bankName: found.bankName,
                        accountNumber: found.accountNumber,
                        ifsc: found.ifsc,
                        accountHolder: found.accountHolder,
                        upiId: found.upiId
                      }
                    });
                  }
                }}
                className="w-full px-3 py-2 bg-white border border-purple-200 rounded-lg text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-purple-500/20"
              >
                <option value="">Select Settlement Bank Account...</option>
                {bankAccounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.bankName} {acc.label ? `(${acc.label})` : ''} • A/C: {acc.accountNumber} {acc.isDefault ? '★ Default' : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Bank Name
              </label>
              <input
                type="text"
                value={data.bankDetails.bankName}
                onChange={(e) => onChange({
                  bankDetails: { ...data.bankDetails, bankName: e.target.value }
                })}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs font-medium text-slate-800"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Account Number
              </label>
              <input
                type="text"
                value={data.bankDetails.accountNumber}
                onChange={(e) => onChange({
                  bankDetails: { ...data.bankDetails, accountNumber: e.target.value }
                })}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs font-medium text-slate-800"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                IFSC Code
              </label>
              <input
                type="text"
                value={data.bankDetails.ifsc}
                onChange={(e) => onChange({
                  bankDetails: { ...data.bankDetails, ifsc: e.target.value }
                })}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs font-medium text-slate-800 uppercase"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                UPI ID / VPA
              </label>
              <input
                type="text"
                value={data.bankDetails.upiId}
                onChange={(e) => onChange({
                  bankDetails: { ...data.bankDetails, upiId: e.target.value }
                })}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs font-medium text-slate-800"
              />
            </div>
          </div>

          {/* Template Defaults Action Bar */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
            <span className="text-[10px] text-slate-400 font-medium">
              Want these entered details as your future default?
            </span>
            <div className="flex items-center gap-2">
              {onResetTemplate && (
                <button
                  type="button"
                  onClick={onResetTemplate}
                  className="text-[11px] font-bold text-slate-500 hover:text-slate-800 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  Reset Defaults
                </button>
              )}
              {onSaveDefaultTemplate && (
                <button
                  type="button"
                  onClick={onSaveDefaultTemplate}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg text-xs font-bold transition-all shadow-xs"
                >
                  <Save size={12} />
                  <span>Save as Default Template</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default DocumentControls;

