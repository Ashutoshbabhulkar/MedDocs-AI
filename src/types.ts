export type UserRole =
  | 'Super Admin'
  | 'Hospital Admin'
  | 'Consultant'
  | 'Resident'
  | 'Medical Officer'
  | 'Nurse'
  | 'Receptionist'
  | 'Viewer';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  hospitalId: string;
  avatar?: string;
}

export interface Hospital {
  id: string;
  name: string;
  code: string;
  logo: string;
  colors: {
    primary: string; // e.g. '#3b82f6'
    secondary: string; // e.g. '#1e3a8a'
    accent: string;
    bg: string;
  };
  fonts: string;
  language: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  registrationNumber: string;
  gstNumber: string;
  nabhApproved: boolean;
  nablApproved: boolean;
}

export interface Vitals {
  bp: string;
  pulse: string;
  temp: string;
  rr: string;
  spo2: string;
}

export interface Investigations {
  hb: string;
  wbc: string;
  platelets: string;
  creatinine: string;
  ecg: string;
  cxr: string;
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  dob: string;
  gender: string;
  uhid: string; // Unique Hospital ID
  ipd?: string;
  opd?: string;
  mobile: string;
  address: string;
  occupation: string;
  religion: string;
  bloodGroup: string;
  weight: string;
  height: string;
  diagnosis: string;
  comorbidities: string;
  allergies: string;
  laterality: 'Left' | 'Right' | 'Bilateral' | 'Not Applicable';
  procedurePlanned: string;
  consultant: string;
  anaesthetist: string;
  admissionDate: string;
  surgeryDate: string;
  ward: string;
  room: string;
  bed: string;
  insurance: string;
  mlc: boolean; // Medico-Legal Case
  emergency: boolean;
  asaGrade: string; // ASA I, II, III, IV
  vitals: Vitals;
  investigations: Investigations;
  remarks: string;
  languagePreference: string;
}

export interface SignatureInfo {
  id: string;
  role: UserRole | 'Patient' | 'Relative' | 'Witness';
  signedBy: string;
  signedByName: string;
  signedAt: string;
  signatureType: 'draw' | 'image' | 'digital';
  signatureData: string; // canvas png data URL or image path
  isVerified: boolean;
}

export interface AuditEntry {
  id: string;
  documentId?: string;
  action: string; // 'create' | 'edit' | 'sign' | 'print' | 'export' | 'delete' | 'restore'
  performedBy: string;
  performedByName: string;
  performedByRole: UserRole;
  timestamp: string;
  ipAddress: string;
  details: string;
}

export interface TemplateElement {
  id: string;
  type: 'paragraph' | 'header' | 'footer' | 'table' | 'signature-block' | 'qr-code' | 'patient-vars' | 'image' | 'watermark';
  content: string;
  styles?: {
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    align?: 'left' | 'center' | 'right' | 'justify';
    fontSize?: 'sm' | 'base' | 'lg' | 'xl' | '2xl';
    textColor?: string;
    backgroundColor?: string;
    border?: boolean;
  };
}

export interface Template {
  id: string;
  name: string;
  category: string;
  hospitalId: string;
  currentVersion: number;
  isFavorite: boolean;
  createdBy: string;
  createdAt: string;
  modifiedBy: string;
  modifiedAt: string;
  elements: TemplateElement[];
}

export interface TemplateVersion {
  id: string;
  templateId: string;
  version: number;
  elements: TemplateElement[];
  modifiedBy: string;
  modifiedAt: string;
  notes: string;
}

export interface ClinicalDocument {
  id: string;
  patientId: string;
  patientName: string;
  patientUhid: string;
  templateId: string;
  templateName: string;
  title: string;
  category: string;
  content: string; // HTML content, fully editable
  language: string; // Mixed or single
  hospitalId: string;
  generatedBy: string;
  generatedByName: string;
  generatedAt: string;
  status: 'Draft' | 'Pending Signatures' | 'Signed' | 'Locked';
  version: number;
  signatures: SignatureInfo[];
  qrCodeValueUrl: string;
}

export interface SystemNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  timestamp: string;
  read: boolean;
}
