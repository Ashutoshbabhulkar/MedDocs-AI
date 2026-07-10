import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Hospital, User, UserRole, Patient, ClinicalDocument, AuditEntry, Template, TemplateVersion, SystemNotification, SignatureInfo, TemplateElement } from '../types';

interface AppContextType {
  hospitals: Hospital[];
  currentHospital: Hospital;
  setCurrentHospital: (hosp: Hospital) => void;
  currentUser: User;
  setCurrentUserRole: (role: UserRole) => void;
  patients: Patient[];
  addPatient: (patient: Omit<Patient, 'id'>) => Patient;
  updatePatient: (patient: Patient) => void;
  documents: ClinicalDocument[];
  addDocument: (doc: Omit<ClinicalDocument, 'id' | 'generatedAt' | 'version' | 'signatures'>) => ClinicalDocument;
  updateDocumentContent: (id: string, content: string) => void;
  addSignature: (docId: string, signature: Omit<SignatureInfo, 'id' | 'signedAt' | 'isVerified'>) => void;
  lockDocument: (docId: string) => void;
  templates: Template[];
  addTemplate: (template: Template) => void;
  updateTemplate: (id: string, elements: TemplateElement[], notes: string) => void;
  rollbackTemplate: (templateId: string, version: number) => void;
  templateVersions: TemplateVersion[];
  auditLogs: AuditEntry[];
  addAuditLog: (action: string, docId?: string, details?: string) => void;
  notifications: SystemNotification[];
  markNotificationAsRead: (id: string) => void;
  ocrRunning: boolean;
  runOCR: (imageUrl: string, himsType?: string) => Promise<Partial<Patient>>;
  chatMessages: { role: 'user' | 'assistant'; text: string; timestamp: string }[];
  sendChatMessage: (text: string, activePatientId?: string) => Promise<void>;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  languageMode: 'single' | 'mixed';
  setLanguageMode: (mode: 'single' | 'mixed') => void;
  selectedSecondaryLang: string;
  setSelectedSecondaryLang: (lang: string) => void;
  doctors: User[];
  addDoctor: (doctor: Omit<User, 'id' | 'hospitalId'>) => User;
  currentDoctor: User;
  setCurrentDoctor: (doc: User) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Initial Mock Data
const MOCK_HOSPITALS: Hospital[] = [
  {
    id: 'hosp-1',
    name: 'AAS Multi-Speciality Hospital',
    code: 'AAS-01',
    logo: '🏥',
    colors: {
      primary: '#2563eb', // Blue
      secondary: '#1d4ed8',
      accent: '#3b82f6',
      bg: '#f8fafc'
    },
    fonts: 'Plus Jakarta Sans',
    language: 'English',
    address: '404 Metro Galleria, Senapati Bapat Road, Shivajinagar, Pune - 411016',
    phone: '+91 20 6712 9000',
    email: 'contact@aashospital.com',
    website: 'https://www.aashospital.com',
    registrationNumber: 'MH-PUN-084792-2023',
    gstNumber: '27AAAAA1111A1Z1',
    nabhApproved: true,
    nablApproved: true
  },
  {
    id: 'hosp-2',
    name: 'Apex Heart & Laser Center',
    code: 'APEX-02',
    logo: '❤️',
    colors: {
      primary: '#0d9488', // Teal
      secondary: '#0f766e',
      accent: '#14b8a6',
      bg: '#f0fdfa'
    },
    fonts: 'Outfit',
    language: 'English',
    address: '12-A Ring Road, Lajpat Nagar-IV, New Delhi - 110024',
    phone: '+91 11 4059 8888',
    email: 'info@apexheart.org',
    website: 'https://www.apexheart.org',
    registrationNumber: 'DL-ND-498271-2021',
    gstNumber: '07BBBBB2222B2Z2',
    nabhApproved: true,
    nablApproved: false
  },
  {
    id: 'hosp-3',
    name: 'Metro Oncology & Trauma Care',
    code: 'METRO-03',
    logo: '🎗️',
    colors: {
      primary: '#e11d48', // Rose
      secondary: '#be123c',
      accent: '#f43f5e',
      bg: '#fff1f2'
    },
    fonts: 'Plus Jakarta Sans',
    language: 'English',
    address: '88 Bypass Link Road, Salt Lake Sector-V, Kolkata - 700091',
    phone: '+91 33 2357 5555',
    email: 'support@metrooncology.com',
    website: 'https://www.metrooncology.com',
    registrationNumber: 'WB-KOL-987123-2020',
    gstNumber: '19CCCCC3333C3Z3',
    nabhApproved: false,
    nablApproved: true
  }
];

const MOCK_USERS: User[] = [
  {
    id: 'user-1',
    name: 'Dr. Sophia Vance',
    email: 'sophia.vance@aashospital.com',
    role: 'Consultant',
    hospitalId: 'hosp-1',
    avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=150&h=150&q=80'
  }
];

const MOCK_DOCTORS: Record<string, User[]> = {
  'hosp-1': [
    {
      id: 'doc-1-1',
      name: 'Dr. Ashutosh Babhulkar',
      email: 'ashutosh.babhulkar@aashospital.com',
      role: 'Consultant',
      hospitalId: 'hosp-1',
      avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=150&h=150&q=80'
    },
    {
      id: 'doc-1-2',
      name: 'Dr. Sophia Vance',
      email: 'sophia.vance@aashospital.com',
      role: 'Consultant',
      hospitalId: 'hosp-1',
      avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=150&h=150&q=80'
    }
  ],
  'hosp-2': [
    {
      id: 'doc-2-1',
      name: 'Dr. Vikas Kumar',
      email: 'vikas.kumar@apexheart.org',
      role: 'Consultant',
      hospitalId: 'hosp-2',
      avatar: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=150&h=150&q=80'
    }
  ],
  'hosp-3': [
    {
      id: 'doc-3-1',
      name: 'Dr. Suresh Chandra',
      email: 'suresh.chandra@metrooncology.com',
      role: 'Consultant',
      hospitalId: 'hosp-3',
      avatar: 'https://images.unsplash.com/photo-1594824813573-246434de83fb?auto=format&fit=crop&w=150&h=150&q=80'
    }
  ]
};

const DEFAULT_PATIENTS: Patient[] = [
  {
    id: 'pat-1',
    name: 'Ramesh Balakrishnan',
    age: 48,
    dob: '1978-05-14',
    gender: 'Male',
    uhid: 'UHID-489028',
    ipd: 'IPD-9982',
    opd: 'OPD-8827',
    mobile: '9845012345',
    address: 'Row House No 5, Windsor Park, Pune',
    occupation: 'Software Engineer',
    religion: 'Hinduism',
    bloodGroup: 'O Positive',
    weight: '76 kg',
    height: '172 cm',
    diagnosis: 'Symptomatic Cholelithiasis (Gallstones)',
    comorbidities: 'Type 2 Diabetes Mellitus, Hypertension',
    allergies: 'Penicillin (Skin rashes)',
    laterality: 'Not Applicable',
    procedurePlanned: 'Laparoscopic Cholecystectomy',
    consultant: 'Dr. Sophia Vance',
    anaesthetist: 'Dr. Amit Shah (MD Anaesthesia)',
    admissionDate: '2026-07-08',
    surgeryDate: '2026-07-09',
    ward: 'General Surgical Ward B',
    room: 'Room 204',
    bed: 'Bed C',
    insurance: 'Star Health & Allied Insurance (Policy #998271)',
    mlc: false,
    emergency: false,
    asaGrade: 'ASA Grade II (Controlled DM & HTN)',
    vitals: {
      bp: '130/85 mmHg',
      pulse: '76 bpm',
      temp: '98.4 F',
      rr: '16/min',
      spo2: '99% on Room Air'
    },
    investigations: {
      hb: '14.2 g/dL',
      wbc: '8,400 /cu.mm',
      platelets: '2.5 Lakhs/cu.mm',
      creatinine: '0.9 mg/dL',
      ecg: 'Normal Sinus Rhythm',
      cxr: 'Normal Lung Fields'
    },
    remarks: 'Patient is fit for general anaesthesia. Informed consent process initiated.',
    languagePreference: 'Marathi'
  },
  {
    id: 'pat-2',
    name: 'Anjali Deshmukh',
    age: 27,
    dob: '1999-09-22',
    gender: 'Female',
    uhid: 'UHID-778263',
    ipd: 'IPD-4563',
    mobile: '8877665544',
    address: 'Flat 401, Sapphire Residency, Baner, Pune',
    occupation: 'Teacher',
    religion: 'Hinduism',
    bloodGroup: 'A Positive',
    weight: '58 kg',
    height: '160 cm',
    diagnosis: 'Acute Appendicitis',
    comorbidities: 'None',
    allergies: 'Sulfa Drugs',
    laterality: 'Right',
    procedurePlanned: 'Laparoscopic Appendicectomy',
    consultant: 'Dr. Sophia Vance',
    anaesthetist: 'Dr. Amit Shah (MD Anaesthesia)',
    admissionDate: '2026-07-09',
    surgeryDate: '2026-07-09',
    ward: 'Day Care Unit',
    room: 'DC-04',
    bed: 'Bed A',
    insurance: 'ICICI Lombard Health Care',
    mlc: false,
    emergency: true,
    asaGrade: 'ASA Grade I',
    vitals: {
      bp: '118/76 mmHg',
      pulse: '98 bpm',
      temp: '100.2 F',
      rr: '18/min',
      spo2: '98% on Room Air'
    },
    investigations: {
      hb: '12.1 g/dL',
      wbc: '14,200 /cu.mm (Leucocytosis)',
      platelets: '3.1 Lakhs/cu.mm',
      creatinine: '0.7 mg/dL',
      ecg: 'Sinus Tachycardia',
      cxr: 'Clear lungs'
    },
    remarks: 'Emergency case. Fasting state confirmed (6 hours). Urgent surgery scheduled.',
    languagePreference: 'English'
  }
];

const DEFAULT_TEMPLATES = (hospitalId: string): Template[] => [
  {
    id: 'temp-consent-general',
    name: 'General Consent Form',
    category: 'General Surgery',
    hospitalId,
    currentVersion: 1,
    isFavorite: true,
    createdBy: 'Hospital Admin',
    createdAt: '2026-01-10T10:00:00Z',
    modifiedBy: 'Hospital Admin',
    modifiedAt: '2026-01-10T10:00:00Z',
    elements: [
      { id: 'el-1', type: 'header', content: 'INFORMED CONSENT FOR MEDICAL TREATMENT & SURGERY' },
      { id: 'el-2', type: 'patient-vars', content: '' },
      { id: 'el-3', type: 'paragraph', content: 'I, the undersigned, hereby authorize the consultant doctor, their assistants, and other clinical staff of the hospital to perform the proposed medical treatment, diagnostics, and/or surgical procedure as explained to me. I acknowledge that the clinical condition, details of the procedure, risks, benefits, and possible alternatives have been explained to me in a language I fully understand.' },
      { id: 'el-4', type: 'paragraph', content: 'I understand that no guarantee has been given by anyone as to the absolute results of the treatment/procedure. I also consent to the administration of such local, general, or regional anaesthesia as may be deemed necessary by the anaesthetist.' },
      { id: 'el-5', type: 'signature-block', content: '' },
      { id: 'el-6', type: 'qr-code', content: '' }
    ]
  },
  {
    id: 'temp-consent-lapchole',
    name: 'Procedure Consent: Laparoscopic Cholecystectomy',
    category: 'General Surgery',
    hospitalId,
    currentVersion: 2,
    isFavorite: true,
    createdBy: 'Dr. Sophia Vance',
    createdAt: '2026-02-15T12:00:00Z',
    modifiedBy: 'Dr. Sophia Vance',
    modifiedAt: '2026-05-18T14:30:00Z',
    elements: [
      { id: 'el-c1', type: 'header', content: 'INFORMED CONSENT FOR LAPAROSCOPIC CHOLECYSTECTOMY' },
      { id: 'el-c2', type: 'patient-vars', content: '' },
      { id: 'el-c3', type: 'paragraph', content: '<strong>Procedure Details:</strong> Removal of the gallbladder containing gallstones using laparoscopy (keyhole surgery) under General Anaesthesia.' },
      { id: 'el-c4', type: 'paragraph', content: '<strong>Procedure Specific Risks & Complications:</strong> Bleeding, infection, damage to the bile duct (which may require open reconstruction), bile leak, damage to surrounding abdominal structures (liver, bowel, major blood vessels), conversion to open surgery if clinical difficulties arise, and shoulder-tip pain post-op from carbon dioxide gas insufflation.' },
      { id: 'el-c5', type: 'paragraph', content: '<strong>Benefits:</strong> Relief from biliary colic/pain, prevention of acute cholecystitis, gallbladder perforation, pancreatitis, or common bile duct stone obstruction.' },
      { id: 'el-c6', type: 'paragraph', content: '<strong>Alternatives:</strong> Non-surgical management (low-fat diet, painkillers, antibiotics for acute infection), ERCP for bile duct stones. However, gallstones will remain and can recur or cause complications.' },
      { id: 'el-c7', type: 'signature-block', content: '' },
      { id: 'el-c8', type: 'qr-code', content: '' }
    ]
  },
  {
    id: 'temp-op-notes',
    name: 'Operation Notes - Standard Laparoscopic Surgery',
    category: 'General Surgery',
    hospitalId,
    currentVersion: 1,
    isFavorite: true,
    createdBy: 'Dr. Sophia Vance',
    createdAt: '2026-03-01T09:00:00Z',
    modifiedBy: 'Dr. Sophia Vance',
    modifiedAt: '2026-03-01T09:00:00Z',
    elements: [
      { id: 'el-o1', type: 'header', content: 'SURGICAL OPERATION RECORD' },
      { id: 'el-o2', type: 'patient-vars', content: '' },
      { id: 'el-o3', type: 'paragraph', content: '<strong>Surgeons & Assistants:</strong> Lead Surgeon: {{consultant}}, Assistant: Resident, Anaesthetist: {{anaesthetist}}' },
      { id: 'el-o4', type: 'paragraph', content: '<strong>Indication:</strong> Symptomatic Cholelithiasis / Acute Inflammation' },
      { id: 'el-o5', type: 'paragraph', content: '<strong>Operative Details:</strong> General Anaesthesia administered. Patient placed in supine reverse Trendelenburg position. Paint and drape performed. Pneumoperitoneum created using Veress needle. Trocars placed (10mm umbilical, 10mm epigastric, two 5mm subcostal). Gallbladder identified. Calot\'s triangle dissected. Cystic duct and cystic artery identified, clipped, and divided. Gallbladder dissected off liver bed. Hemostasis checked. Specimen retrieved. Abdomen deflated, ports closed.' },
      { id: 'el-o6', type: 'signature-block', content: '' }
    ]
  }
];

const DEFAULT_DOCUMENTS = (hospitalId: string): ClinicalDocument[] => [
  {
    id: 'doc-1',
    patientId: 'pat-1',
    patientName: 'Ramesh Balakrishnan',
    patientUhid: 'UHID-489028',
    templateId: 'temp-consent-lapchole',
    templateName: 'Procedure Consent: Laparoscopic Cholecystectomy',
    title: 'Laparoscopic Cholecystectomy Consent - Ramesh Balakrishnan',
    category: 'General Surgery',
    content: `
      <div class="space-y-4">
        <h2 class="text-xl font-bold text-center border-b pb-2">INFORMED CONSENT FOR SURGERY: LAPAROSCOPIC CHOLECYSTECTOMY</h2>
        <div class="grid grid-cols-2 gap-2 text-sm bg-slate-50 p-3 rounded">
          <p><strong>Patient Name:</strong> Ramesh Balakrishnan</p>
          <p><strong>UHID:</strong> UHID-489028</p>
          <p><strong>Diagnosis:</strong> Gallstones (Symptomatic Cholelithiasis)</p>
          <p><strong>Procedure Planned:</strong> Laparoscopic Cholecystectomy</p>
          <p><strong>Consultant:</strong> Dr. Sophia Vance</p>
          <p><strong>Anaesthetist:</strong> Dr. Amit Shah (MD Anaesthesia)</p>
        </div>
        <p class="text-sm leading-relaxed">
          I, <strong>Ramesh Balakrishnan</strong>, understand that I am scheduled for a surgical procedure known as <strong>Laparoscopic Cholecystectomy</strong> (removal of the gallbladder). The details of the procedure, including its risks, benefits, and alternatives, have been explained to me by <strong>Dr. Sophia Vance</strong>.
        </p>
        <p class="text-sm font-semibold">Risks & Complications Explained:</p>
        <ul class="list-disc pl-5 text-sm space-y-1">
          <li>Bleeding and wound infection.</li>
          <li>Bile duct injury (1 in 300 risk, potentially requiring open reconstructive surgery).</li>
          <li>Bile leakage into the abdominal cavity.</li>
          <li>Damage to surrounding organs (liver, bowel, major blood vessels).</li>
          <li>Conversion to open cholecystectomy (large incision) if technical difficulties arise.</li>
          <li>Anesthetic complications (allergic reactions, cardiac/pulmonary stress).</li>
        </ul>
        <p class="text-sm">
          I hereby authorize the surgical team to proceed. I also consent to the administration of General Anaesthesia and the conversion to an open procedure if deemed necessary by the surgeon in the interest of safety.
        </p>
      </div>
    `,
    language: 'English',
    hospitalId,
    generatedBy: 'user-1',
    generatedByName: 'Dr. Sophia Vance',
    generatedAt: '2026-07-09T08:15:00Z',
    status: 'Pending Signatures',
    version: 1,
    signatures: [],
    qrCodeValueUrl: 'https://meddocs.ai/verify/doc-1'
  }
];

const DEFAULT_AUDIT_LOGS = (_hospitalId: string): AuditEntry[] => [
  {
    id: 'audit-1',
    action: 'Registered Patient',
    performedBy: 'user-1',
    performedByName: 'Dr. Sophia Vance',
    performedByRole: 'Consultant',
    timestamp: '2026-07-08T14:30:00Z',
    ipAddress: '192.168.1.104',
    details: 'Manually registered patient Ramesh Balakrishnan (UHID-489028)'
  },
  {
    id: 'audit-2',
    action: 'Generated Document',
    documentId: 'doc-1',
    performedBy: 'user-1',
    performedByName: 'Dr. Sophia Vance',
    performedByRole: 'Consultant',
    timestamp: '2026-07-09T08:15:00Z',
    ipAddress: '192.168.1.104',
    details: 'Generated Laparoscopic Cholecystectomy Consent for Ramesh Balakrishnan'
  }
];

const DEFAULT_NOTIFICATIONS: SystemNotification[] = [
  {
    id: 'notif-1',
    title: 'Signature Pending',
    message: 'Laparoscopic Cholecystectomy Consent is pending Doctor & Patient signatures.',
    type: 'warning',
    timestamp: '2026-07-09T08:16:00Z',
    read: false
  },
  {
    id: 'notif-2',
    title: 'Emergency Admission',
    message: 'Anjali Deshmukh registered via OCR/Emergency for Laparoscopic Appendicectomy.',
    type: 'info',
    timestamp: '2026-07-09T09:00:00Z',
    read: false
  }
];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentHospital, setCurrentHospital] = useState<Hospital>(
    () => {
      const stored = localStorage.getItem('meddocs_current_hospital');
      return stored ? JSON.parse(stored) : MOCK_HOSPITALS[0];
    }
  );

  const [theme, setTheme] = useState<'light' | 'dark'>(
    () => (localStorage.getItem('meddocs_theme') as 'light' | 'dark') || 'light'
  );

  const [languageMode, setLanguageMode] = useState<'single' | 'mixed'>('single');
  const [selectedSecondaryLang, setSelectedSecondaryLang] = useState<string>('Marathi');

  const [doctors, setDoctors] = useState<User[]>(() => {
    const stored = localStorage.getItem(`meddocs_doctors_${currentHospital.id}`);
    return stored ? JSON.parse(stored) : (MOCK_DOCTORS[currentHospital.id] || []);
  });

  const [currentDoctor, setCurrentDoctorState] = useState<User>(() => {
    const stored = localStorage.getItem(`meddocs_current_doctor_${currentHospital.id}`);
    if (stored) return JSON.parse(stored);
    const list = stored ? JSON.parse(stored) : (MOCK_DOCTORS[currentHospital.id] || []);
    return list[0] || MOCK_USERS[0];
  });

  const [currentUser, setCurrentUser] = useState<User>(() => {
    const defaultDoc = currentDoctor || MOCK_USERS[0];
    const user = { ...defaultDoc };
    user.hospitalId = currentHospital.id;
    return user;
  });

  const [patients, setPatients] = useState<Patient[]>(() => {
    const stored = localStorage.getItem(`meddocs_patients_${currentHospital.id}`);
    return stored ? JSON.parse(stored) : DEFAULT_PATIENTS;
  });

  const [documents, setDocuments] = useState<ClinicalDocument[]>(() => {
    const stored = localStorage.getItem(`meddocs_documents_${currentHospital.id}`);
    return stored ? JSON.parse(stored) : DEFAULT_DOCUMENTS(currentHospital.id);
  });

  const [templates, setTemplates] = useState<Template[]>(() => {
    const stored = localStorage.getItem(`meddocs_templates_${currentHospital.id}`);
    return stored ? JSON.parse(stored) : DEFAULT_TEMPLATES(currentHospital.id);
  });

  const [templateVersions, setTemplateVersions] = useState<TemplateVersion[]>([]);

  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>(() => {
    const stored = localStorage.getItem(`meddocs_audit_${currentHospital.id}`);
    return stored ? JSON.parse(stored) : DEFAULT_AUDIT_LOGS(currentHospital.id);
  });

  const [notifications, setNotifications] = useState<SystemNotification[]>(DEFAULT_NOTIFICATIONS);
  const [ocrRunning, setOcrRunning] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'assistant'; text: string; timestamp: string }[]>([
    {
      role: 'assistant',
      text: 'Hello! I am your MedDocs AI clinical documentation assistant. How can I help you today? Try saying or typing: "Generate operative notes for Ramesh Balakrishnan" or "Summarize hospital stay".',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  // Sync to localStorage when state or hospital changes
  useEffect(() => {
    localStorage.setItem('meddocs_current_hospital', JSON.stringify(currentHospital));

    // Load doctors for specific hospital
    const localDoctors = localStorage.getItem(`meddocs_doctors_${currentHospital.id}`);
    const loadedDocs = localDoctors ? JSON.parse(localDoctors) : (MOCK_DOCTORS[currentHospital.id] || []);
    setDoctors(loadedDocs);

    const localCurrentDoc = localStorage.getItem(`meddocs_current_doctor_${currentHospital.id}`);
    let activeDoc = loadedDocs[0] || { ...MOCK_USERS[0], hospitalId: currentHospital.id };
    if (localCurrentDoc) {
      try {
        activeDoc = JSON.parse(localCurrentDoc);
      } catch (e) {
        console.error(e);
      }
    }
    setCurrentDoctorState(activeDoc);
    setCurrentUser(activeDoc);

    // Load data for specific hospital
    const localPatients = localStorage.getItem(`meddocs_patients_${currentHospital.id}`);
    setPatients(localPatients ? JSON.parse(localPatients) : DEFAULT_PATIENTS);

    const localDocs = localStorage.getItem(`meddocs_documents_${currentHospital.id}`);
    setDocuments(localDocs ? JSON.parse(localDocs) : DEFAULT_DOCUMENTS(currentHospital.id));

    const localTemplates = localStorage.getItem(`meddocs_templates_${currentHospital.id}`);
    setTemplates(localTemplates ? JSON.parse(localTemplates) : DEFAULT_TEMPLATES(currentHospital.id));

    const localAudit = localStorage.getItem(`meddocs_audit_${currentHospital.id}`);
    setAuditLogs(localAudit ? JSON.parse(localAudit) : DEFAULT_AUDIT_LOGS(currentHospital.id));
  }, [currentHospital]);

  // Save changes to localStorage
  const savePatients = (updatedPatients: Patient[]) => {
    setPatients(updatedPatients);
    localStorage.setItem(`meddocs_patients_${currentHospital.id}`, JSON.stringify(updatedPatients));
  };

  const saveDocuments = (updatedDocs: ClinicalDocument[]) => {
    setDocuments(updatedDocs);
    localStorage.setItem(`meddocs_documents_${currentHospital.id}`, JSON.stringify(updatedDocs));
  };

  const saveTemplates = (updatedTemplates: Template[]) => {
    setTemplates(updatedTemplates);
    localStorage.setItem(`meddocs_templates_${currentHospital.id}`, JSON.stringify(updatedTemplates));
  };

  const saveAuditLogs = (updatedAudits: AuditEntry[]) => {
    setAuditLogs(updatedAudits);
    localStorage.setItem(`meddocs_audit_${currentHospital.id}`, JSON.stringify(updatedAudits));
  };

  const setCurrentUserRole = (role: UserRole) => {
    setCurrentUser(prev => ({ ...prev, role }));
    addAuditLog(`Switched User Role`, undefined, `Switched user role to ${role}`);
  };

  const addPatient = (patientData: Omit<Patient, 'id'>): Patient => {
    const newPatient: Patient = {
      ...patientData,
      id: `pat-${Date.now()}`
    };
    const updated = [newPatient, ...patients];
    savePatients(updated);
    addAuditLog('Registered Patient', undefined, `Registered patient ${newPatient.name} (${newPatient.uhid})`);
    
    // Add warning notification if patient has high risk
    if (newPatient.emergency) {
      setNotifications(prev => [
        {
          id: `notif-${Date.now()}`,
          title: 'Emergency Admission',
          message: `${newPatient.name} registered under emergency for ${newPatient.procedurePlanned}.`,
          type: 'warning',
          timestamp: new Date().toISOString(),
          read: false
        },
        ...prev
      ]);
    }
    return newPatient;
  };

  const updatePatient = (updatedPatient: Patient) => {
    const updated = patients.map(p => p.id === updatedPatient.id ? updatedPatient : p);
    savePatients(updated);
    addAuditLog('Updated Patient Profile', undefined, `Modified fields for patient ${updatedPatient.name} (${updatedPatient.uhid})`);
  };

  const addDocument = (docData: Omit<ClinicalDocument, 'id' | 'generatedAt' | 'version' | 'signatures'>): ClinicalDocument => {
    const newDoc: ClinicalDocument = {
      ...docData,
      id: `doc-${Date.now()}`,
      generatedAt: new Date().toISOString(),
      version: 1,
      signatures: [],
    };
    const updated = [newDoc, ...documents];
    saveDocuments(updated);
    addAuditLog('Generated Document', newDoc.id, `Generated ${newDoc.templateName} for ${newDoc.patientName}`);
    return newDoc;
  };

  const updateDocumentContent = (id: string, content: string) => {
    const doc = documents.find(d => d.id === id);
    if (!doc) return;
    if (doc.status === 'Signed' || doc.status === 'Locked') {
      // Medico-Legal Locking: Once signed, editing is prohibited, and a corrections page / new version is created.
      const newDoc: ClinicalDocument = {
        ...doc,
        id: `doc-${Date.now()}`,
        version: doc.version + 1,
        content,
        signatures: [], // signatures reset on new versions
        status: 'Draft',
        generatedAt: new Date().toISOString(),
        title: `${doc.title} (V${doc.version + 1} Correction)`
      };
      saveDocuments([newDoc, ...documents]);
      addAuditLog('Edited Locked Document (Created V' + newDoc.version + ')', newDoc.id, `Created correction version ${newDoc.version} from original ${doc.id}`);
      
      setNotifications(prev => [
        {
          id: `notif-${Date.now()}`,
          title: 'Document Version Created',
          message: `Created version ${newDoc.version} correction for ${doc.patientName} as the previous version was signed/locked.`,
          type: 'info',
          timestamp: new Date().toISOString(),
          read: false
        },
        ...prev
      ]);
      return;
    }

    const updated = documents.map(d => d.id === id ? { ...d, content } : d);
    saveDocuments(updated);
    addAuditLog('Edited Document Content', id, `Updated content of ${doc.title}`);
  };

  const addSignature = (docId: string, sigData: Omit<SignatureInfo, 'id' | 'signedAt' | 'isVerified'>) => {
    const doc = documents.find(d => d.id === docId);
    if (!doc) return;

    const newSig: SignatureInfo = {
      ...sigData,
      id: `sig-${Date.now()}`,
      signedAt: new Date().toLocaleString(),
      isVerified: true
    };

    const updatedSigs = [...doc.signatures, newSig];
    const isFullySigned = updatedSigs.length >= 2; // Let's say Doctor and Patient/Relative makes it fully signed.

    const updated = documents.map(d => {
      if (d.id === docId) {
        return {
          ...d,
          signatures: updatedSigs,
          status: isFullySigned ? 'Signed' : 'Pending Signatures' as any
        };
      }
      return d;
    });

    saveDocuments(updated);
    addAuditLog('Signed Document', docId, `${newSig.role} (${newSig.signedByName}) signed the document`);

    if (isFullySigned) {
      addAuditLog('Document Locked', docId, `Document has been locked and certified as legally immutable`);
      setNotifications(prev => [
        {
          id: `notif-${Date.now()}`,
          title: 'Document Signed & Locked',
          message: `Consent document for ${doc.patientName} has been fully signed and archived.`,
          type: 'success',
          timestamp: new Date().toISOString(),
          read: false
        },
        ...prev
      ]);
    }
  };

  const lockDocument = (docId: string) => {
    const updated = documents.map(d => d.id === docId ? { ...d, status: 'Locked' as const } : d);
    saveDocuments(updated);
    addAuditLog('Archived Document', docId, `Legally archived and timestamped document`);
  };

  const addTemplate = (template: Template) => {
    const updated = [template, ...templates];
    saveTemplates(updated);
    addAuditLog('Created Template', undefined, `Added new template ${template.name} (${template.category})`);
  };

  const updateTemplate = (id: string, elements: TemplateElement[], notes: string) => {
    const template = templates.find(t => t.id === id);
    if (!template) return;

    const oldVersion = template.currentVersion;
    const newVersion = oldVersion + 1;

    // Save previous version to templateVersions state
    const prevVersion: TemplateVersion = {
      id: `ver-${Date.now()}`,
      templateId: id,
      version: oldVersion,
      elements: template.elements,
      modifiedBy: currentUser.name,
      modifiedAt: new Date().toISOString(),
      notes: notes || `Update to version ${newVersion}`
    };

    setTemplateVersions(prev => [prevVersion, ...prev]);

    const updated = templates.map(t => {
      if (t.id === id) {
        return {
          ...t,
          currentVersion: newVersion,
          elements,
          modifiedBy: currentUser.name,
          modifiedAt: new Date().toISOString()
        };
      }
      return t;
    });

    saveTemplates(updated);
    addAuditLog('Updated Template Layout', undefined, `Modified template ${template.name} to Version ${newVersion}`);
  };

  const rollbackTemplate = (templateId: string, versionNum: number) => {
    const template = templates.find(t => t.id === templateId);
    if (!template) return;

    const targetVersion = templateVersions.find(v => v.templateId === templateId && v.version === versionNum);
    if (!targetVersion) return;

    const oldElements = targetVersion.elements;
    const newVersion = template.currentVersion + 1;

    // Save current as version
    const currentVersionHistory: TemplateVersion = {
      id: `ver-${Date.now()}`,
      templateId,
      version: template.currentVersion,
      elements: template.elements,
      modifiedBy: currentUser.name,
      modifiedAt: new Date().toISOString(),
      notes: `Autosaved before rolling back to version ${versionNum}`
    };

    setTemplateVersions(prev => [currentVersionHistory, ...prev]);

    const updated = templates.map(t => {
      if (t.id === templateId) {
        return {
          ...t,
          currentVersion: newVersion,
          elements: oldElements,
          modifiedBy: currentUser.name,
          modifiedAt: new Date().toISOString()
        };
      }
      return t;
    });

    saveTemplates(updated);
    addAuditLog('Rollback Template', undefined, `Rolled back template ${template.name} to layout from Version ${versionNum}`);
  };

  const addAuditLog = (action: string, docId?: string, details?: string) => {
    const newEntry: AuditEntry = {
      id: `audit-${Date.now()}`,
      documentId: docId,
      action,
      performedBy: currentUser.id,
      performedByName: currentUser.name,
      performedByRole: currentUser.role,
      timestamp: new Date().toLocaleString(),
      ipAddress: '192.168.1.104', // Simulated local network IP
      details: details || ''
    };
    saveAuditLogs([newEntry, ...auditLogs]);
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const runOCR = async (_imageUrl: string, himsType?: string): Promise<Partial<Patient>> => {
    setOcrRunning(true);
    const himsLabel = himsType === 'aas' ? 'AAS Multi-Speciality HIMS' :
                      himsType === 'epic' ? 'Epic Systems' : 
                      himsType === 'cerner' ? 'Cerner PowerChart' : 
                      himsType === 'allscripts' ? 'Allscripts EHR' : 
                      himsType === 'custom' ? 'Custom Local HIMS' : 'Generic Layout';
    addAuditLog('OCR Scanning Triggered', undefined, `Initiated OCR scans using ${himsLabel} parser`);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setOcrRunning(false);

    // Differentiate extraction profile based on selected layout format
    if (himsType === 'aas') {
      return {
        name: 'Rajendra Damaji Dudhabade',
        age: 46,
        dob: '1980-07-07',
        gender: 'Male',
        uhid: 'AAS672',
        mobile: '9325215630',
        address: 'Shivajinagar, Pune',
        bloodGroup: 'O Positive',
        weight: '70 kg',
        height: '165 cm',
        diagnosis: 'Adult hydrocele - N43.3 | Hemorrhoid - K64.9 | Fissure in ano - K60.2',
        comorbidities: 'Diabetes mellitus, Hypertension',
        allergies: 'None',
        laterality: 'Bilateral',
        procedurePlanned: 'HEMORRHOIDECTOMY | LATERAL INTERNAL SPHINCTEROTOMY | EVERSION OF HYDROCELE SAC',
        consultant: 'Dr. Ashutosh Babhulkar',
        anaesthetist: 'Dr. Amit Shah (MD Anaesthesia)',
        ward: 'General Surgical Ward',
        room: 'Room 205',
        bed: 'Bed A',
        insurance: 'None',
        mlc: false,
        emergency: false,
        asaGrade: 'ASA Grade II (Controlled DM & HTN)',
        vitals: {
          bp: '145/92 mmHg',
          pulse: '105 bpm',
          temp: '98.6 F',
          rr: '18/min',
          spo2: '98%'
        },
        remarks: 'OCR successfully parsed AAS Multi-Speciality HIMS screenshot. Symptoms, Vitals, Diagnosis, and planned Procedures extracted.'
      };
    } else if (himsType === 'epic') {
      return {
        name: 'Vikas Kumar Rao',
        age: 39,
        dob: '1987-03-12',
        gender: 'Male',
        uhid: 'EPIC-883719',
        ipd: 'IPD-7729',
        mobile: '9890123456',
        address: 'B-102, Shanti Vihar, Baner Road, Pune',
        bloodGroup: 'B Positive',
        weight: '72 kg',
        height: '168 cm',
        diagnosis: 'Incarcerated Right Inguinal Hernia',
        comorbidities: 'Asthma (Mild, controlled)',
        allergies: 'Aspirin',
        laterality: 'Right',
        procedurePlanned: 'Open Inguinal Hernioplasty (Lichtenstein Mesh Repair)',
        consultant: 'Dr. Sophia Vance',
        anaesthetist: 'Dr. Amit Shah (MD Anaesthesia)',
        ward: 'Surgical Special Ward',
        room: 'Room 302',
        bed: 'Bed A',
        insurance: 'HDFC Ergo Health Insurance (Epic Plan #882)',
        mlc: false,
        emergency: true,
        asaGrade: 'ASA Grade II',
        vitals: {
          bp: '124/80 mmHg',
          pulse: '84 bpm',
          temp: '98.6 F',
          rr: '18/min',
          spo2: '99% on Room Air'
        },
        remarks: 'OCR successfully parsed Epic Systems HIMS screenshot. Verified patient identity.'
      };
    } else if (himsType === 'cerner') {
      return {
        name: 'Suresh Chandra Sen',
        age: 52,
        dob: '1974-08-25',
        gender: 'Male',
        uhid: 'CRN-224810',
        ipd: 'IPD-4521',
        mobile: '9811223344',
        address: 'Flat 503, Block C, Silver Oak Apartments, Dwarka, Delhi',
        bloodGroup: 'A Positive',
        weight: '81 kg',
        height: '175 cm',
        diagnosis: 'Gallstone Pancreatitis / Symptomatic Cholelithiasis',
        comorbidities: 'Hypertension (Controlled)',
        allergies: 'None',
        laterality: 'Not Applicable',
        procedurePlanned: 'Laparoscopic Cholecystectomy',
        consultant: 'Dr. Sophia Vance',
        anaesthetist: 'Dr. Amit Shah (MD Anaesthesia)',
        ward: 'Surgical Ward A',
        room: 'Room 105',
        bed: 'Bed B',
        insurance: 'Star Health Insurance (Cerner Plan #441)',
        mlc: false,
        emergency: false,
        asaGrade: 'ASA Grade II (Controlled HTN)',
        vitals: {
          bp: '132/88 mmHg',
          pulse: '76 bpm',
          temp: '99.0 F',
          rr: '16/min',
          spo2: '98% on Room Air'
        },
        remarks: 'OCR successfully parsed Cerner PowerChart EHR flowsheet. Verified patient identity.'
      };
    } else if (himsType === 'allscripts') {
      return {
        name: 'Meera Deshpande',
        age: 31,
        dob: '1995-05-18',
        gender: 'Female',
        uhid: 'ALS-994321',
        ipd: 'IPD-8843',
        mobile: '9988776655',
        address: 'Plot No 44, Sector 21, Nerul, Navi Mumbai',
        bloodGroup: 'O Negative',
        weight: '62 kg',
        height: '162 cm',
        diagnosis: 'Acute Appendicitis (Suppurative)',
        comorbidities: 'None',
        allergies: 'Sulfa Drugs',
        laterality: 'Right',
        procedurePlanned: 'Laparoscopic Appendicectomy',
        consultant: 'Dr. Sophia Vance',
        anaesthetist: 'Dr. Amit Shah (MD Anaesthesia)',
        ward: 'Day Care unit',
        room: 'DC-02',
        bed: 'Bed A',
        insurance: 'ICICI Lombard Health Care',
        mlc: false,
        emergency: true,
        asaGrade: 'ASA Grade I',
        vitals: {
          bp: '115/70 mmHg',
          pulse: '92 bpm',
          temp: '101.1 F',
          rr: '20/min',
          spo2: '99% on Room Air'
        },
        remarks: 'OCR successfully parsed Allscripts EHR Clinical Summary screenshot. Verified patient identity.'
      };
    } else if (himsType === 'custom') {
      return {
        name: 'Amitesh Patel',
        age: 44,
        dob: '1982-11-04',
        gender: 'Male',
        uhid: 'LOC-552100',
        ipd: 'IPD-9002',
        mobile: '8877991122',
        address: '45, Patel Society, Gotri Road, Vadodara',
        bloodGroup: 'AB Positive',
        weight: '78 kg',
        height: '173 cm',
        diagnosis: 'Bilateral Direct Inguinal Hernia',
        comorbidities: 'Type 2 Diabetes Mellitus',
        allergies: 'Penicillin',
        laterality: 'Bilateral',
        procedurePlanned: 'Bilateral Laparoscopic Hernioplasty TAPP',
        consultant: 'Dr. Sophia Vance',
        anaesthetist: 'Dr. Amit Shah (MD Anaesthesia)',
        ward: 'Special OT Wing',
        room: 'Room 501',
        bed: 'Bed A',
        insurance: 'Niva Bupa Health Insurance',
        mlc: false,
        emergency: false,
        asaGrade: 'ASA Grade II (Controlled DM)',
        vitals: {
          bp: '120/75 mmHg',
          pulse: '80 bpm',
          temp: '98.4 F',
          rr: '15/min',
          spo2: '98% on Room Air'
        },
        remarks: 'OCR successfully parsed Custom Local HIMS Template. Verified patient identity.'
      };
    } else {
      // generic
      return {
        name: 'Priya Rajan',
        age: 45,
        dob: '1981-04-30',
        gender: 'Female',
        uhid: 'GEN-449102',
        ipd: 'IPD-2139',
        mobile: '7766554433',
        address: 'Tower 4, Flat 1202, Green Meadows, OMR, Chennai',
        bloodGroup: 'B Negative',
        weight: '65 kg',
        height: '158 cm',
        diagnosis: 'Uterine Fibroids (Symptomatic)',
        comorbidities: 'Mild Hypothyroidism',
        allergies: 'None',
        laterality: 'Not Applicable',
        procedurePlanned: 'Total Laparoscopic Hysterectomy',
        consultant: 'Dr. Sophia Vance',
        anaesthetist: 'Dr. Amit Shah (MD Anaesthesia)',
        ward: 'Gynaecology Ward C',
        room: 'Room 214',
        bed: 'Bed D',
        insurance: 'Max Bupa Health Insurance',
        mlc: false,
        emergency: false,
        asaGrade: 'ASA Grade II (Controlled Thyroid)',
        vitals: {
          bp: '118/78 mmHg',
          pulse: '72 bpm',
          temp: '98.2 F',
          rr: '16/min',
          spo2: '99% on Room Air'
        },
        remarks: 'OCR successfully parsed Generic HIMS / Scanned Medical Record. Verified patient identity.'
      };
    }
  };

  const sendChatMessage = async (text: string, activePatientId?: string) => {
    const userMsg = {
      role: 'user' as const,
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setChatMessages(prev => [...prev, userMsg]);

    // Simulate AI clinical brain reply
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    let aiResponse = "I can help you build consents, operation notes, or summaries. Try asking: 'Generate Lap Chole consent' or 'Summarize patient stay'.";
    
    const lowerText = text.toLowerCase();
    const activePatient = patients.find(p => p.id === activePatientId) || patients[0];

    if (lowerText.includes('discharge') || lowerText.includes('summarize')) {
      aiResponse = `Here is a clinical summary and draft discharge advice for **${activePatient.name}** (${activePatient.uhid}):\n\n` +
        `**Diagnosis:** ${activePatient.diagnosis}\n` +
        `**Procedure:** ${activePatient.procedurePlanned} performed on ${activePatient.surgeryDate}.\n` +
        `**Hospital Course:** Patient was admitted on ${activePatient.admissionDate} and underwent uncomplicated ${activePatient.procedurePlanned}. Vitals are stable: BP ${activePatient.vitals.bp}, Pulse ${activePatient.vitals.pulse}. Hemoglobin is ${activePatient.investigations.hb}.\n` +
        `**Discharge Instructions:**\n` +
        `1. Tab Pan-D 1 tab early morning before food for 5 days.\n` +
        `2. Tab Ultracet 1 tab twice daily for 3 days for pain.\n` +
        `3. Wound care: Keep dressing dry. Visit OPD on Wednesday for suture removal.\n` +
        `4. Emergency contact: Immediately report if high fever, severe abdomen pain, or bile discharge occurs.`;
    } else if (lowerText.includes('operation') || lowerText.includes('operative') || lowerText.includes('note')) {
      aiResponse = `**DRAFT OPERATION NOTE GENERATED BY AI**\n\n` +
        `**Patient:** ${activePatient.name} (${activePatient.gender}/${activePatient.age})\n` +
        `**Date of Surgery:** ${activePatient.surgeryDate}\n` +
        `**Procedure:** ${activePatient.procedurePlanned}\n` +
        `**Surgeon:** ${activePatient.consultant}\n` +
        `**Anaesthesia:** General Anaesthesia (Intubated, controlled ventilation)\n\n` +
        `**Findings:** Gallbladder wall thickened, no gallstones impacted in cystic duct. Normal anatomy of Calot's triangle. Mild adhesions with omentum present.\n` +
        `**Steps performed:** Standard 4-port entry. Adhesiolysis done. Dissected Calot's triangle. Cystic duct and artery isolated, double clipped and divided. Gallbladder dissected off liver bed, haemostasis secured. Cavity irrigated. Specimen extracted. Port closure in layers.`;
    } else if (lowerText.includes('consent') || lowerText.includes('lap chole') || lowerText.includes('appendicectomy')) {
      const proc = lowerText.includes('appendicectomy') ? 'Laparoscopic Appendicectomy' : 'Laparoscopic Cholecystectomy';
      aiResponse = `I have generated the procedure-specific clinical risk profile for **${proc}**.\n\n` +
        `**Risks:** Bleeding, port-site hernia, bile leak, damage to major blood vessels or intestine. In case of anatomical anomalies, conversion to open surgery is authorized.\n\n` +
        `I have automatically loaded this into the Document Ingestion section for patient **${activePatient.name}**. You can finalize and print it now!`;
    }

    const aiMsg = {
      role: 'assistant' as const,
      text: aiResponse,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setChatMessages(prev => [...prev, aiMsg]);
  };

  const addDoctor = (docData: Omit<User, 'id' | 'hospitalId'>): User => {
    const newDoc: User = {
      ...docData,
      id: `doc-${Date.now()}`,
      hospitalId: currentHospital.id,
      avatar: docData.avatar || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=150&h=150&q=80'
    };
    const updated = [...doctors, newDoc];
    setDoctors(updated);
    localStorage.setItem(`meddocs_doctors_${currentHospital.id}`, JSON.stringify(updated));
    addAuditLog('Added Doctor', undefined, `Added new doctor ${newDoc.name} (${newDoc.role})`);
    return newDoc;
  };

  const setCurrentDoctor = (doc: User) => {
    setCurrentDoctorState(doc);
    localStorage.setItem(`meddocs_current_doctor_${currentHospital.id}`, JSON.stringify(doc));
    setCurrentUser(doc);
    addAuditLog('Doctor Switch', undefined, `Switched login session to ${doc.name}`);
  };

  useEffect(() => {
    localStorage.setItem('meddocs_theme', theme);
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  return (
    <AppContext.Provider
      value={{
        hospitals: MOCK_HOSPITALS,
        currentHospital,
        setCurrentHospital,
        currentUser,
        setCurrentUserRole,
        patients,
        addPatient,
        updatePatient,
        documents,
        addDocument,
        updateDocumentContent,
        addSignature,
        lockDocument,
        templates,
        addTemplate,
        updateTemplate,
        rollbackTemplate,
        templateVersions,
        auditLogs,
        addAuditLog,
        notifications,
        markNotificationAsRead,
        ocrRunning,
        runOCR,
        chatMessages,
        sendChatMessage,
        theme,
        setTheme,
        languageMode,
        setLanguageMode,
        selectedSecondaryLang,
        setSelectedSecondaryLang,
        doctors,
        addDoctor,
        currentDoctor,
        setCurrentDoctor
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
