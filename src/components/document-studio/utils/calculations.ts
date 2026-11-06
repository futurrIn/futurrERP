import { DocumentData } from '../types';

export interface CalculationResult {
  subtotal: number;
  transportCharges: number;
  discount: number;
  taxableAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalTax: number;
  grandTotal: number;
}

export function calculateDocumentTotals(data: DocumentData): CalculationResult {
  const subtotal = (data.items || []).reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const transportCharges = Number(data.transportCharges) || 0;
  const discount = Number(data.discount) || 0;
  
  const taxableAmount = Math.max(0, subtotal + transportCharges - discount);
  
  let cgst = 0;
  let sgst = 0;
  let igst = 0;
  
  if (data.gstType === 'cgst_sgst') {
    const halfRate = (Number(data.gstRate) || 18) / 2;
    cgst = Math.round((taxableAmount * halfRate) / 100);
    sgst = Math.round((taxableAmount * halfRate) / 100);
  } else if (data.gstType === 'igst') {
    const rate = Number(data.gstRate) || 18;
    igst = Math.round((taxableAmount * rate) / 100);
  }
  
  const totalTax = cgst + sgst + igst;
  const grandTotal = taxableAmount + totalTax;
  
  return {
    subtotal,
    transportCharges,
    discount,
    taxableAmount,
    cgst,
    sgst,
    igst,
    totalTax,
    grandTotal
  };
}

export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0
  }).format(Math.round(amount || 0));
}

