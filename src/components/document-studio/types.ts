export type DocumentMode = 'quotation' | 'invoice' | 'receipt';

export interface LineItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface BankDetails {
  bankName: string;
  accountNumber: string;
  ifsc: string;
  accountHolder: string;
  upiId: string;
}

export interface DocumentData {
  mode: DocumentMode;
  documentNumber: string;
  issueDate: string;
  dueDate: string;
  
  // Client & Dispatch Details
  customerId?: number | null;
  customerName: string;
  customerCompany: string;
  customerAddress: string;
  customerEmail: string;
  customerPhone: string;
  customerGst: string;
  venue: string;
  bookingRef: string;
  
  // Line items & Financials
  items: LineItem[];
  transportCharges: number;
  discount: number;
  gstType: 'exempt' | 'cgst_sgst' | 'igst';
  gstRate: number; // e.g. 18
  
  // Branding & Signatures
  logoUrl: string;
  companyName: string;
  companyTagline: string;
  brandPreset: 'Neo-Core' | 'Quantum AI' | 'Humanoid' | 'Cyber Shield';
  badgeBg: 'dark' | 'white' | 'clear';
  signatoryName: string;
  signatoryDesignation: string;
  signatureDataUrl?: string;
  
  // Terms & Bank Details
  termsAndConditions: string;
  bankDetails: BankDetails;
}

