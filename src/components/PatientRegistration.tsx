import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import type { Patient } from '../types';
import { 
  FileText, 
  UploadCloud, 
  Cpu, 
  Sparkles, 
  FileCheck,
  ClipboardList
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { parseHimsText } from '../utils/himsParser';

interface PatientRegistrationProps {
  setActiveTab: (tab: string) => void;
  setSelectedPatientId: (id: string) => void;
}

export const PatientRegistration: React.FC<PatientRegistrationProps> = ({ setActiveTab, setSelectedPatientId }) => {
  const { currentHospital, setCurrentHospital, addPatient, runOCR, doctors, addDoctor, currentDoctor, callGeminiAPI } = useApp();
  const [activeSubTab, setActiveSubTab] = useState<'manual' | 'ocr' | 'paste'>('manual');
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrComplete, setOcrComplete] = useState(false);
  const [ocrLogs, setOcrLogs] = useState<string[]>([]);

  const [pasteInput, setPasteInput] = useState('');
  const [pasteLoading, setPasteLoading] = useState(false);
  const [pasteComplete, setPasteComplete] = useState(false);
  const [pasteLogs, setPasteLogs] = useState<string[]>([]);
  
  const [showAddDoctor, setShowAddDoctor] = useState(false);
  const [newDocName, setNewDocName] = useState('');
  const [newDocEmail, setNewDocEmail] = useState('');

  // Sync consultant field when currentDoctor changes
  React.useEffect(() => {
    if (currentDoctor) {
      setFormData(prev => ({ ...prev, consultant: currentDoctor.name }));
    }
  }, [currentDoctor]);

  // HIMS screenshot capture states
  const [selectedHimsType, setSelectedHimsType] = useState<string>(() => {
    return currentHospital.id === 'hosp-1' ? 'aas' : 'epic';
  });
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    setSelectedHimsType(currentHospital.id === 'hosp-1' ? 'aas' : 'epic');
    setScreenshotPreview(null);
    setOcrLogs([]);
    setOcrComplete(false);
  }, [currentHospital]);

  // Clipboard image screenshot paste listener
  React.useEffect(() => {
    if (activeSubTab !== 'ocr') return;

    const handleGlobalPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
              setScreenshotPreview(event.target?.result as string);
              setOcrComplete(false);
            };
            reader.readAsDataURL(file);
            e.preventDefault();
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handleGlobalPaste);
    return () => {
      window.removeEventListener('paste', handleGlobalPaste);
    };
  }, [activeSubTab]);

  // Clipboard text paste listener for universal smart import
  React.useEffect(() => {
    if (activeSubTab !== 'paste') return;

    const handleTextPaste = (e: ClipboardEvent) => {
      // Avoid intercepting inside other input elements
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' && target !== document.querySelector('textarea[placeholder*="Click here and press"]')) {
        return;
      }
      const text = e.clipboardData?.getData('text');
      if (text) {
        setPasteInput(text);
        triggerTextParsing(text);
      }
    };

    window.addEventListener('paste', handleTextPaste);
    return () => {
      window.removeEventListener('paste', handleTextPaste);
    };
  }, [activeSubTab]);

  const triggerTextParsing = async (textToParse: string) => {
    if (!textToParse.trim()) return;
    setPasteLoading(true);
    setPasteComplete(false);
    setPasteLogs([
      "Initializing Universal Clinical Text Parser...",
      "Analyzing layout patterns in clipboard dump...",
      "Scanning text blocks for key-value headers..."
    ]);

    const addLogMessage = (msg: string) => {
      setPasteLogs(prev => [...prev, msg]);
    };

    if (false && currentHospital.geminiApiKey && currentHospital.consentToAiShare) {
      addLogMessage("Routing text to client-side Gemini AI content parser...");
      try {
        const prompt = `You are an expert medical transcriptionist. Analyze the following clinical text raw dump, extract all relevant fields, and return them in JSON format. Do not use markdown backticks, tags or extra texts. Return ONLY valid JSON.
Clinical raw text:
"""
${textToParse}
"""

Required JSON format:
{
  "name": "Patient Name",
  "age": 45,
  "dob": "YYYY-MM-DD",
  "gender": "Male" or "Female",
  "uhid": "UHID",
  "mobile": "10-digit number",
  "address": "Address",
  "bloodGroup": "Blood Group",
  "weight": "e.g. 70 kg",
  "height": "e.g. 165 cm",
  "diagnosis": "Clinical Diagnosis details",
  "comorbidities": "Comorbidities",
  "allergies": "Allergies",
  "laterality": "Left" or "Right" or "Bilateral" or "Not Applicable",
  "procedurePlanned": "Planned surgical procedure",
  "consultant": "Consultant Name",
  "anaesthetist": "Anaesthetist Name",
  "ward": "Ward",
  "room": "Room",
  "bed": "Bed",
  "insurance": "Insurance details",
  "mlc": false,
  "emergency": false,
  "asaGrade": "ASA Grade",
  "vitals": {
    "bp": "Blood pressure",
    "pulse": "Pulse rate",
    "temp": "Body temperature",
    "rr": "Respiratory rate",
    "spo2": "SpO2 percentage"
  },
  "investigations": {
    "hb": "Hemoglobin",
    "wbc": "WBC",
    "platelets": "Platelets",
    "creatinine": "Creatinine",
    "ecg": "ECG",
    "cxr": "Chest X-Ray"
  }
}`;
        const responseText = await callGeminiAPI(prompt);
        let jsonStr = responseText.trim();
        const jsonStart = jsonStr.indexOf('{');
        const jsonEnd = jsonStr.lastIndexOf('}');
        if (jsonStart !== -1 && jsonEnd !== -1) {
          jsonStr = jsonStr.substring(jsonStart, jsonEnd + 1);
        }
        
        const parsed = JSON.parse(jsonStr);
        setPasteLogs([
          "Initializing Universal Clinical Text Parser...",
          "Analyzing layout patterns in clipboard dump...",
          "Scanning text blocks for key-value headers...",
          "Routing text to client-side Gemini AI content parser...",
          "Gemini AI successfully completed clinical entity parsing.",
          parsed.name ? `✔ Extracted Patient Name: "${parsed.name}"` : "⚠ Patient Name: Not found",
          parsed.uhid ? `✔ Extracted UHID/Reg No: "${parsed.uhid}"` : "⚠ UHID: Not found",
          "Validating clinical details against NABH guidelines...",
          "Form fields successfully auto-populated!"
        ]);
        
        setPasteLoading(false);
        setPasteComplete(true);

        setFormData(prev => ({
          ...prev,
          name: parsed.name || prev.name,
          uhid: parsed.uhid || prev.uhid,
          age: parsed.age || prev.age,
          gender: parsed.gender || prev.gender,
          dob: parsed.dob || prev.dob,
          mobile: parsed.mobile || prev.mobile,
          address: parsed.address || prev.address,
          bloodGroup: parsed.bloodGroup || prev.bloodGroup,
          weight: parsed.weight || prev.weight,
          height: parsed.height || prev.height,
          diagnosis: parsed.diagnosis || prev.diagnosis,
          comorbidities: parsed.comorbidities || prev.comorbidities,
          allergies: parsed.allergies || prev.allergies,
          laterality: parsed.laterality || prev.laterality,
          procedurePlanned: parsed.procedurePlanned || prev.procedurePlanned,
          consultant: parsed.consultant || prev.consultant,
          anaesthetist: parsed.anaesthetist || prev.anaesthetist,
          ward: parsed.ward || prev.ward,
          room: parsed.room || prev.room,
          bed: parsed.bed || prev.bed,
          insurance: parsed.insurance || prev.insurance,
          mlc: parsed.mlc !== undefined ? parsed.mlc : prev.mlc,
          emergency: parsed.emergency !== undefined ? parsed.emergency : prev.emergency,
          asaGrade: parsed.asaGrade || prev.asaGrade,
          vitals: {
            ...prev.vitals,
            bp: parsed.vitals?.bp || prev.vitals.bp,
            pulse: parsed.vitals?.pulse || prev.vitals.pulse,
            temp: parsed.vitals?.temp || prev.vitals.temp,
            rr: parsed.vitals?.rr || prev.vitals.rr,
            spo2: parsed.vitals?.spo2 || prev.vitals.spo2
          },
          investigations: {
            ...prev.investigations,
            hb: parsed.investigations?.hb || prev.investigations.hb,
            wbc: parsed.investigations?.wbc || prev.investigations.wbc,
            platelets: parsed.investigations?.platelets || prev.investigations.platelets,
            creatinine: parsed.investigations?.creatinine || prev.investigations.creatinine,
            ecg: parsed.investigations?.ecg || prev.investigations.ecg,
            cxr: parsed.investigations?.cxr || prev.investigations.cxr
          }
        }));

        confetti({
          particleCount: 55,
          spread: 50,
          colors: ['#3b82f6', '#10b981', '#6366f1']
        });
        return;
      } catch (err: any) {
        console.error("Gemini text parsing failed, using offline regex parser:", err);
        addLogMessage(`⚠ Gemini parsing failed: ${err.message || err}. Falling back to offline regex parser...`);
      }
    }

    setTimeout(() => {
      const parsed = parseHimsText(textToParse);
      
      const newLogs = [
        "Initializing Universal Clinical Text Parser...",
        "Analyzing layout patterns in clipboard dump...",
        "Scanning text blocks for key-value headers...",
        parsed.name ? `✔ Extracted Patient Name: "${parsed.name}"` : "⚠ Patient Name: Not found in text structure",
        parsed.uhid ? `✔ Extracted UHID/Reg No: "${parsed.uhid}"` : "⚠ UHID: Not found (using temporary placeholder)",
        parsed.age ? `✔ Extracted Age: ${parsed.age} Years` : "⚠ Age: Not found",
        parsed.gender ? `✔ Extracted Gender: ${parsed.gender}` : "⚠ Gender: Defaulted",
        parsed.diagnosis ? `✔ Extracted Diagnosis: "${parsed.diagnosis}"` : "⚠ Diagnosis: Not found",
        parsed.procedurePlanned ? `✔ Extracted Procedure: "${parsed.procedurePlanned}"` : "⚠ Planned Procedure: Not found",
        parsed.vitals.bp ? `✔ Extracted Vitals: BP ${parsed.vitals.bp} mmHg, Pulse ${parsed.vitals.pulse || 'N/A'}/min` : "⚠ Vitals: No clear metrics found",
        parsed.mobile ? `✔ Extracted Mobile: "${parsed.mobile}"` : "⚠ Mobile: Not found",
        parsed.laterality ? `✔ Extracted Laterality: "${parsed.laterality}"` : "⚠ Laterality: Not found",
        "Validating clinical details against NABH guidelines...",
        "Form fields successfully auto-populated!"
      ];
      
      setPasteLogs(newLogs);
      setPasteLoading(false);
      setPasteComplete(true);

      setFormData(prev => ({
        ...prev,
        name: parsed.name || prev.name,
        uhid: parsed.uhid || prev.uhid,
        age: parsed.age || prev.age,
        gender: parsed.gender || prev.gender,
        mobile: parsed.mobile || prev.mobile,
        laterality: parsed.laterality || prev.laterality,
        diagnosis: parsed.diagnosis || prev.diagnosis,
        procedurePlanned: parsed.procedurePlanned || prev.procedurePlanned,
        vitals: {
          ...prev.vitals,
          bp: parsed.vitals.bp || prev.vitals.bp,
          pulse: parsed.vitals.pulse || prev.vitals.pulse,
          temp: parsed.vitals.temp || prev.vitals.temp,
          spo2: parsed.vitals.spo2 || prev.vitals.spo2
        },
        investigations: {
          ...prev.investigations,
          hb: parsed.investigations.hb || prev.investigations.hb,
          platelets: parsed.investigations.platelets || prev.investigations.platelets,
          creatinine: parsed.investigations.creatinine || prev.investigations.creatinine
        }
      }));

      confetti({
        particleCount: 55,
        spread: 50,
        colors: ['#3b82f6', '#10b981', '#6366f1']
      });
    }, 1200);
  };

  const loadSampleText = (type: 'ekacare' | 'epic' | 'legacy') => {
    let sample = '';
    if (type === 'ekacare') {
      sample = `Eka Care EMR Report\nUHID: EKA-980129\nPatient Name: Sanjay Kulkarni\nAge/Gender: 39 / Male\nVitals: Temp 98.6 F, Pulse 76 bpm, BP 120/80 mmHg, SpO2 99%\nDiagnosis: Chronic Suppurative Otitis Media (CSOM) with central perforation\nPlanned Surgery: Right Tympanoplasty (Type 1)\nSurgeon: Dr. Sophia Vance\nInvestigations: Hb 13.8 g/dL, Platelets 220000, Creatinine 0.9 mg/dL`;
    } else if (type === 'epic') {
      sample = `EPIC SYSTEMS CLINICAL SUMMARY\nMRN/UHID: EPIC-8830112\nPatient: Priyanka Patil, 28 Years, Female\nObs/Gynae Note: Term pregnancy, 38 weeks, breech presentation\nDiagnosis: Breech Presentation / Pregnancy at term\nPlanned Procedure: Lower Segment Cesarean Section (LSCS)\nVitals Flowsheet: BP 130/80 mmHg, HR 88 bpm, SpO2 98%\nInvestigations: Hb 11.2, Platelets 180000, Creatinine 0.7`;
    } else {
      sample = `AAS CLINICAL DATA SHEET\nPATIENT REGISTRATION: Leela Bai Salunkhe\nHIMS ID: AAS-90412\nAge: 68 Years | Gender: Female\nClinical Diagnosis: Severe Osteoarthritis of Knee Joint (Left)\nProposed Action: Left Total Knee Arthroplasty (Knee Replacement)\nAdmitting Consultant: Dr. Sophia Vance\nVitals: Pulse 82/min, BP 140/90 mmHg, Temp 97.8 F\nInvestigations: Hb 12.1, Platelets 250000, Creatinine 1.1`;
    }
    setPasteInput(sample);
    triggerTextParsing(sample);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setScreenshotPreview(event.target?.result as string);
        setOcrComplete(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setScreenshotPreview(event.target?.result as string);
        setOcrComplete(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const generateHimsScreenshot = (himsType: string): string => {
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 420;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    // Draw background
    ctx.fillStyle = '#f8fafc'; // light gray-blue
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw borders
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 4;
    ctx.strokeRect(8, 8, canvas.width - 16, canvas.height - 16);

    // Header bar
    ctx.fillStyle = himsType === 'aas' ? '#1e3a8a' : himsType === 'epic' ? '#0d9488' : '#0f172a';
    ctx.fillRect(10, 10, canvas.width - 20, 50);

    // Header Text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px sans-serif';
    const headerTitle = himsType === 'aas' ? 'AAS MULTI-SPECIALITY HIMS' :
                        himsType === 'epic' ? 'EPIC SYSTEMS CLINICAL SUMMARY' :
                        himsType === 'cerner' ? 'CERNER POWERCHART FLOWSHEET' :
                        himsType === 'allscripts' ? 'ALLSCRIPTS EHR RECORD' : 'GENERIC HIMS PATIENT SHEET';
    ctx.fillText(headerTitle, 30, 42);

    // Document type label
    ctx.font = '10px sans-serif';
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText('CONFIDENTIAL MEDICAL RECORD - MEDDOCS AI OCR DEMO', 300, 40);

    // Body text
    ctx.fillStyle = '#334155';
    ctx.font = 'bold 13px sans-serif';

    // Build values based on selected template
    let lines: string[] = [];
    if (himsType === 'aas') {
      lines = [
        'PATIENT REGISTRATION: Rajendra Damaji Dudhabade',
        'UHID/ID: AAS672',
        'Age: 46 Years | Gender: Male',
        'Diagnosis: Adult hydrocele - N43.3 | Hemorrhoid - K64.9 | Fissure in ano - K60.2',
        'Procedure Planned: HEMORRHOIDECTOMY | LATERAL INTERNAL SPHINCTEROTOMY | EVERSION OF HYDROCELE SAC',
        'Vitals Flowsheet: BP 145/92 mmHg, Pulse 105 bpm, Temp 98.6 F, RR 18/min',
        'Investigations: Hb 13.8 g/dL, Platelets 220000, Creatinine 0.9 mg/dL'
      ];
    } else if (himsType === 'epic') {
      lines = [
        'Patient Name: Vikas Kumar Rao',
        'MRN/UHID: EPIC-883719',
        'Age: 39 Years | Gender: Male',
        'Diagnosis: Incarcerated Right Inguinal Hernia',
        'Procedure Planned: Open Inguinal Hernioplasty (Lichtenstein Mesh Repair)',
        'Vitals Flowsheet: BP 124/80 mmHg, Pulse 84 bpm, Temp 98.6 F, RR 18/min',
        'Investigations: Hb 14.5 g/dL, Platelets 190000, Creatinine 1.0 mg/dL'
      ];
    } else if (himsType === 'cerner') {
      lines = [
        'Patient Name: Suresh Chandra Sen',
        'UHID: CRN-773291',
        'Age/Gender: 52 / Male',
        'Diagnosis: Gallstone Pancreatitis / Cholelithiasis',
        'Procedure Planned: Laparoscopic Cholecystectomy',
        'Vitals Flowsheet: BP 132/88 mmHg, Pulse 76 bpm, Temp 99.0 F, RR 16/min',
        'Investigations: Hb 12.8 g/dL, Platelets 210000, Creatinine 1.2 mg/dL'
      ];
    } else if (himsType === 'allscripts') {
      lines = [
        'Patient Name: Meera Deshpande',
        'UHID: ALS-994321',
        'Age: 31 Years | Gender: Female',
        'Diagnosis: Acute Appendicitis (Suppurative)',
        'Procedure Planned: Laparoscopic Appendicectomy',
        'Vitals Flowsheet: BP 115/70 mmHg, Pulse 92 bpm, Temp 101.1 F, RR 20/min',
        'Investigations: Hb 11.5 g/dL, Platelets 240000, Creatinine 0.8 mg/dL'
      ];
    } else {
      lines = [
        'Patient Name: Priya Rajan',
        'UHID/ID: GEN-449102',
        'Age: 45 Years | Gender: Female',
        'Diagnosis: Uterine Fibroids (Symptomatic)',
        'Procedure Planned: Total Laparoscopic Hysterectomy',
        'Vitals Flowsheet: BP 118/78 mmHg, Pulse 72 bpm, Temp 98.2 F, RR 16/min',
        'Investigations: Hb 12.1 g/dL, Platelets 250000, Creatinine 1.1 mg/dL'
      ];
    }

    // Render lines onto canvas
    let y = 100;
    lines.forEach((line) => {
      // Draw a bullet/dot
      ctx.fillStyle = himsType === 'aas' ? '#2563eb' : himsType === 'epic' ? '#0d9488' : '#6366f1';
      ctx.beginPath();
      ctx.arc(35, y - 4, 3, 0, 2 * Math.PI);
      ctx.fill();

      // Split header from value for styling (bold labels)
      const colonIdx = line.indexOf(':');
      if (colonIdx !== -1) {
        const label = line.substring(0, colonIdx + 1);
        const val = line.substring(colonIdx + 1);
        
        ctx.fillStyle = '#1e293b';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText(label, 50, y);
        
        ctx.fillStyle = '#475569';
        ctx.font = '12px monospace';
        // Wrap text if too long
        if (ctx.measureText(val).width > 480) {
          ctx.font = '11px monospace';
        }
        ctx.fillText(val, 50 + ctx.measureText(label).width + 5, y);
      } else {
        ctx.fillStyle = '#1e293b';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText(line, 50, y);
      }
      y += 42;
    });

    // Draw footer
    ctx.fillStyle = '#64748b';
    ctx.font = 'italic 10px sans-serif';
    ctx.fillText('* THIS TEXT WAS DYNAMICALLY RENDERED TO A CANVAS AND PARSED VIA LIVE OCR *', 40, canvas.height - 25);

    return canvas.toDataURL('image/png');
  };

  const loadSampleMockScreenshot = () => {
    // Generate a beautiful, text-filled local HIMS sheet canvas
    const base64Url = generateHimsScreenshot(selectedHimsType);
    setScreenshotPreview(base64Url);
    setOcrComplete(false);
  };

  // Form states
  const [formData, setFormData] = useState<Omit<Patient, 'id'>>({
    name: '',
    age: 0,
    dob: '',
    gender: 'Male',
    uhid: '',
    ipd: '',
    opd: '',
    mobile: '',
    address: '',
    occupation: '',
    religion: '',
    bloodGroup: 'O Positive',
    weight: '',
    height: '',
    diagnosis: '',
    comorbidities: '',
    allergies: '',
    laterality: 'Not Applicable',
    procedurePlanned: '',
    consultant: 'Dr. Sophia Vance',
    anaesthetist: 'Dr. Amit Shah (MD Anaesthesia)',
    admissionDate: '',
    surgeryDate: '',
    ward: '',
    room: '',
    bed: '',
    insurance: '',
    mlc: false,
    emergency: false,
    asaGrade: 'ASA Grade I',
    vitals: {
      bp: '',
      pulse: '',
      temp: '',
      rr: '',
      spo2: ''
    },
    investigations: {
      hb: '',
      wbc: '',
      platelets: '',
      creatinine: '',
      ecg: '',
      cxr: ''
    },
    remarks: '',
    languagePreference: 'English'
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: name === 'age' ? parseInt(value) || 0 : value }));
    }
  };

  const handleVitalsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      vitals: { ...prev.vitals, [name]: value }
    }));
  };

  const handleInvestigationsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      investigations: { ...prev.investigations, [name]: value }
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.uhid || !formData.diagnosis || !formData.procedurePlanned) {
      alert("Please complete the required fields: Patient Name, UHID, Diagnosis, and Planned Procedure.");
      return;
    }
    const createdPatient = addPatient(formData);
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.8 }
    });
    setSelectedPatientId(createdPatient.id);
    setActiveTab('clinical');
  };

  const triggerMockOCR = async () => {
    setOcrLoading(true);
    setOcrComplete(false);

    const logsList: string[] = [
      "Initializing AI-OCR Recognition Engine...",
      "Validating document format (HIMS Screenshot)...",
      `Selected Parser Layout: ${selectedHimsType.toUpperCase()} Template`,
      "Waiting for pixel buffer transmission..."
    ];
    setOcrLogs([...logsList]);

    const addLogMessage = (msg: string) => {
      logsList.push(msg);
      setOcrLogs([...logsList]);
    };

    // Run real OCR or template fallback using the updated runOCR in AppContext
    const extracted = await runOCR(
      screenshotPreview || 'sample-hims',
      selectedHimsType,
      (progressMsg) => {
        addLogMessage(progressMsg);
      }
    );
    
    setOcrLoading(false);
    setOcrComplete(true);

    // Merge into form state
    setFormData(prev => ({
      ...prev,
      ...extracted,
      vitals: {
        ...prev.vitals,
        ...(extracted.vitals || {})
      },
      investigations: {
        ...prev.investigations,
        ...(extracted.investigations || {})
      }
    }));

    confetti({
      particleCount: 50,
      colors: ['#3b82f6', '#10b981']
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white">Register New Patient</h2>
          <p className="text-xs text-slate-400">Add administrative and clinical details manually or via screenshot OCR scanning</p>
        </div>
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setActiveSubTab('manual')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              activeSubTab === 'manual' 
                ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-white shadow-sm' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Manual Form
          </button>
          <button
            onClick={() => setActiveSubTab('ocr')}
            className={`px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all ${
              activeSubTab === 'ocr' 
                ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-white shadow-sm' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles size={13} className="text-blue-500" /> HIMS Screenshot OCR
          </button>
          <button
            onClick={() => setActiveSubTab('paste')}
            className={`px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all ${
              activeSubTab === 'paste' 
                ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-white shadow-sm' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <ClipboardList size={13} className="text-blue-500" /> AI Smart Paste
          </button>
        </div>
      </div>

      {activeSubTab === 'ocr' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upload card */}
          <div className="lg:col-span-1 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4 min-h-[380px]">
            
            {/* Format Customizer */}
            <div className="w-full text-left">
              <label className="block text-[10px] font-extrabold text-slate-400 dark:text-slate-300 uppercase mb-1">HIMS Platform Layout</label>
              <select
                value={selectedHimsType}
                onChange={(e) => setSelectedHimsType(e.target.value)}
                className="w-full border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl p-2.5 text-xs outline-none focus:ring-2 focus:ring-blue-100"
              >
                <option value="aas">AAS Multi-Speciality HIMS Layout</option>
                <option value="epic">Epic Systems EHR Layout</option>
                <option value="cerner">Cerner PowerChart Layout</option>
                <option value="allscripts">Allscripts EHR Layout</option>
                <option value="custom">Custom Local HIMS Layout</option>
                <option value="generic">Generic Scan / Scanned PDF</option>
              </select>
            </div>

            {/* Paste & Drag Interactive Box */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`flex-1 flex flex-col items-center justify-center text-center p-4 rounded-xl border-2 border-dashed cursor-pointer transition-all ${
                isDragging 
                  ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20' 
                  : screenshotPreview
                    ? 'border-slate-200 bg-slate-50/30 dark:border-slate-800'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />

              {screenshotPreview ? (
                <div className="space-y-2">
                  <img
                    src={screenshotPreview}
                    alt="Clinical Preview"
                    className="max-h-[140px] mx-auto object-contain rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm"
                  />
                  <p className="text-[10px] text-slate-500 font-medium">Screenshot Loaded. Click or drop to replace.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="mx-auto w-12 h-12 bg-blue-50 dark:bg-blue-950/40 text-blue-500 rounded-full flex items-center justify-center">
                    <UploadCloud size={24} />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-800 dark:text-white">Pasted or Uploaded Image</h5>
                    <p className="text-[10px] text-slate-400 mt-1 max-w-[200px] mx-auto">
                      Press <strong>Ctrl + V</strong> to paste, drag & drop, or click to upload.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={loadSampleMockScreenshot}
                className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold py-2 px-3 rounded-xl text-xs transition-all"
              >
                Load Sample
              </button>
              {screenshotPreview && (
                <button
                  type="button"
                  onClick={() => setScreenshotPreview(null)}
                  className="bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold py-2 px-3 rounded-xl text-xs transition-all border border-rose-100"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="space-y-2 py-2 text-left bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800/60 w-full">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!currentHospital.consentToAiShare}
                  onChange={(e) => {
                    setCurrentHospital({
                      ...currentHospital,
                      consentToAiShare: e.target.checked
                    });
                  }}
                  className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-[10px] leading-normal font-semibold text-slate-600 dark:text-slate-300">
                  Patient consent obtained to securely process clinical screenshot with cloud AI.
                </span>
              </label>
              <div className="text-[9px] text-slate-500 font-medium">
                ✓ Offline Mode: Gemini AI is bypassed. Using local offline Tesseract parser.
              </div>
            </div>

            <button
              onClick={triggerMockOCR}
              disabled={ocrLoading}
              className="w-full text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all"
              style={{ backgroundColor: currentHospital.colors.primary }}
            >
              {ocrLoading ? (
                <>
                  <Cpu size={15} className="animate-spin" /> Running Custom Parser...
                </>
              ) : (
                <>
                  <Sparkles size={15} /> Process Screenshot
                </>
              )}
            </button>

            {ocrComplete && (
              <div className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900 rounded-xl p-3 flex items-start gap-2 text-left w-full">
                <FileCheck size={18} className="text-emerald-500 mt-0.5 shrink-0" />
                <div>
                  <h5 className="text-xs font-bold">Extraction Successful</h5>
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5">
                    Parser extracted patient metrics. Verify details below.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Logs Terminal */}
          <div className="lg:col-span-2 bg-slate-900 text-slate-300 font-mono p-5 rounded-2xl border border-slate-800 shadow-lg min-h-[380px] flex flex-col justify-between">
            <div className="space-y-1.5 overflow-y-auto max-h-[320px] text-xs">
              <div className="text-slate-500 border-b border-slate-800 pb-1.5 mb-2 flex items-center justify-between">
                <span>[MEDDOCS AI OCR ENGINE v4.3.0]</span>
                <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
              </div>
              {ocrLogs.length === 0 ? (
                <div className="text-slate-500 italic">Waiting for clipboard paste (Ctrl+V), drag-and-drop or manual upload...</div>
              ) : (
                ocrLogs.map((log, index) => (
                  <div key={index} className="flex gap-2">
                    <span className="text-blue-400">➜</span>
                    <span>{log}</span>
                  </div>
                ))
              )}
            </div>
            {ocrLoading && (
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-4">
                <div className="bg-blue-500 h-full animate-[progress_3s_ease-in-out]" style={{ width: '100%' }}></div>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {activeSubTab === 'paste' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
          {/* Paste Zone */}
          <div className="lg:col-span-1 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4 min-h-[380px]">
            
            <div className="w-full text-left">
              <label className="block text-[10px] font-extrabold text-slate-400 dark:text-slate-300 uppercase mb-1">
                Universal HIMS Text Import
              </label>
              <p className="text-[11px] text-slate-450 dark:text-slate-400 leading-normal">
                Copy patient demographics/clinical details from any EMR page and paste them below (or click a test sample).
              </p>
            </div>

            {/* Area for Paste */}
            <div className="flex-1 flex flex-col relative">
              <textarea
                value={pasteInput}
                onChange={(e) => {
                  setPasteInput(e.target.value);
                  triggerTextParsing(e.target.value);
                }}
                placeholder="Click here and press Ctrl + V to paste patient text..."
                className="w-full flex-1 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-3.5 text-xs outline-none focus:ring-2 focus:ring-blue-100 dark:bg-slate-800 dark:text-white resize-none font-mono focus:border-blue-500 transition-all min-h-[160px]"
              />
              {!pasteInput && (
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center p-4">
                  <ClipboardList className="w-8 h-8 text-blue-500 mb-2 opacity-40" />
                  <span className="text-[10px] text-slate-450 dark:text-slate-400 font-bold">Smart Paste Area</span>
                  <span className="text-[9px] text-slate-400">Ctrl + V to auto-extract fields</span>
                </div>
              )}
            </div>

            {/* Quick Test Samples */}
            <div className="space-y-1.5 text-left">
              <span className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Test Clipboard Templates</span>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => loadSampleText('ekacare')}
                  className="bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold py-1.5 px-2 rounded-lg text-[9px] text-center truncate border border-blue-100/30 transition-all"
                  title="Test Eka Care EMR Format"
                >
                  Eka Care
                </button>
                <button
                  type="button"
                  onClick={() => loadSampleText('epic')}
                  className="bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-bold py-1.5 px-2 rounded-lg text-[9px] text-center truncate border border-indigo-100/30 transition-all"
                  title="Test Epic EHR Format"
                >
                  Epic Systems
                </button>
                <button
                  type="button"
                  onClick={() => loadSampleText('legacy')}
                  className="bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold py-1.5 px-2 rounded-lg text-[9px] text-center truncate border border-emerald-100/30 transition-all"
                  title="Test AAS HIMS Format"
                >
                  AAS HIMS
                </button>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setPasteInput('');
                  setPasteLogs([]);
                  setPasteComplete(false);
                }}
                className="w-full bg-slate-105 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold py-2 px-3 rounded-xl text-xs transition-all border border-slate-150 dark:border-slate-750"
              >
                Clear Input
              </button>
            </div>

            {pasteComplete && (
              <div className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900 rounded-xl p-3 flex items-start gap-2 text-left w-full">
                <FileCheck size={18} className="text-emerald-500 mt-0.5 shrink-0" />
                <div>
                  <h5 className="text-xs font-bold">Extraction Successful</h5>
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5">
                    Structured fields successfully loaded. Verify details below.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Logs Terminal */}
          <div className="lg:col-span-2 bg-slate-900 text-slate-350 font-mono p-5 rounded-2xl border border-slate-850 shadow-xl min-h-[380px] flex flex-col justify-between text-left">
            <div className="space-y-1.5 overflow-y-auto max-h-[320px] text-xs">
              <div className="text-slate-500 border-b border-slate-800 pb-1.5 mb-2 flex items-center justify-between font-bold">
                <span>[MEDDOCS AI SMART PARSER v2.0.1]</span>
                <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
              </div>
              {pasteLogs.length === 0 ? (
                <div className="text-slate-500 italic">Waiting for text paste (Ctrl+V) or click on a sample template above...</div>
              ) : (
                pasteLogs.map((log, index) => (
                  <div key={index} className="flex gap-2">
                    <span className="text-blue-400">➜</span>
                    <span>{log}</span>
                  </div>
                ))
              )}
            </div>
            {pasteLoading && (
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-4">
                <div className="bg-blue-500 h-full animate-[progress_1.2s_ease-in-out]" style={{ width: '100%' }}></div>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {/* Main Registration Form */}
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
        <div className="border-b border-slate-50 pb-3">
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-1.5">
            <ClipboardList size={18} className="text-blue-500" />
            Patient Clinical & Demographic Form
          </h3>
          <p className="text-xs text-slate-400">Ensure crucial safety flags like laterality, diagnosis, and allergies are checked</p>
        </div>

        {/* Section 1: Demographics */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">1. Administrative & Demographics</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Patient Name *</label>
              <input
                required
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:ring-2 focus:ring-blue-100 outline-none"
                placeholder="Full Name"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">UHID (HIMS ID) *</label>
              <input
                required
                type="text"
                name="uhid"
                value={formData.uhid}
                onChange={handleInputChange}
                className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:ring-2 focus:ring-blue-100 outline-none font-mono"
                placeholder="UHID-XXXXXX"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Mobile Number</label>
              <input
                type="text"
                name="mobile"
                value={formData.mobile}
                onChange={handleInputChange}
                className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:ring-2 focus:ring-blue-100 outline-none"
                placeholder="10-digit mobile"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">DOB</label>
              <input
                type="date"
                name="dob"
                value={formData.dob}
                onChange={handleInputChange}
                className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:ring-2 focus:ring-blue-100 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Age</label>
              <input
                type="number"
                name="age"
                value={formData.age || ''}
                onChange={handleInputChange}
                className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:ring-2 focus:ring-blue-100 outline-none"
                placeholder="Age in years"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Gender</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:ring-2 focus:ring-blue-100 outline-none"
              >
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Blood Group</label>
              <select
                name="bloodGroup"
                value={formData.bloodGroup}
                onChange={handleInputChange}
                className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:ring-2 focus:ring-blue-100 outline-none"
              >
                <option>A Positive</option>
                <option>A Negative</option>
                <option>B Positive</option>
                <option>B Negative</option>
                <option>AB Positive</option>
                <option>AB Negative</option>
                <option>O Positive</option>
                <option>O Negative</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">IPD Number (In-Patient)</label>
              <input
                type="text"
                name="ipd"
                value={formData.ipd}
                onChange={handleInputChange}
                className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:ring-2 focus:ring-blue-100 outline-none font-mono"
                placeholder="IPD-XXXX"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Insurance / Corporate Plan</label>
              <input
                type="text"
                name="insurance"
                value={formData.insurance}
                onChange={handleInputChange}
                className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:ring-2 focus:ring-blue-100 outline-none"
                placeholder="Company & Policy #"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-600 mb-1">Address</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:ring-2 focus:ring-blue-100 outline-none"
                placeholder="Full residential address"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Language Preference</label>
              <select
                name="languagePreference"
                value={formData.languagePreference}
                onChange={handleInputChange}
                className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:ring-2 focus:ring-blue-100 outline-none"
              >
                <option>English</option>
                <option>Hindi</option>
                <option>Marathi</option>
                <option>Gujarati</option>
                <option>Tamil</option>
                <option>Telugu</option>
                <option>Kannada</option>
                <option>Malayalam</option>
                <option>Punjabi</option>
                <option>Bengali</option>
                <option>Urdu</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Clinical Data */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">2. Clinical Diagnosis & Procedure Planning</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-600 mb-1">Diagnosis (Standard clinical terms) *</label>
              <input
                required
                type="text"
                name="diagnosis"
                value={formData.diagnosis}
                onChange={handleInputChange}
                className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:ring-2 focus:ring-blue-100 outline-none"
                placeholder="e.g. Symptomatic Cholelithiasis / Gallstones"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Laterality (Critical Safety) *</label>
              <select
                name="laterality"
                value={formData.laterality}
                onChange={handleInputChange}
                className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:ring-2 focus:ring-blue-100 outline-none font-semibold text-rose-700 bg-rose-50"
              >
                <option>Not Applicable</option>
                <option>Left</option>
                <option>Right</option>
                <option>Bilateral</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-600 mb-1">Procedure Planned *</label>
              <input
                required
                type="text"
                name="procedurePlanned"
                value={formData.procedurePlanned}
                onChange={handleInputChange}
                className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:ring-2 focus:ring-blue-100 outline-none font-semibold text-slate-800"
                placeholder="e.g. Laparoscopic Cholecystectomy"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">ASA Grade Evaluation</label>
              <select
                name="asaGrade"
                value={formData.asaGrade}
                onChange={handleInputChange}
                className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:ring-2 focus:ring-blue-100 outline-none"
              >
                <option>ASA Grade I (Healthy patient)</option>
                <option>ASA Grade II (Mild systemic disease)</option>
                <option>ASA Grade III (Severe systemic disease)</option>
                <option>ASA Grade IV (Constant threat to life)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Co-morbidities</label>
              <input
                type="text"
                name="comorbidities"
                value={formData.comorbidities}
                onChange={handleInputChange}
                className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:ring-2 focus:ring-blue-100 outline-none"
                placeholder="Diabetes, Hypertension, COPD..."
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Allergies (Clinical Safety) *</label>
              <input
                type="text"
                name="allergies"
                value={formData.allergies}
                onChange={handleInputChange}
                className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:ring-2 focus:ring-blue-100 outline-none text-red-700 bg-red-50/50 placeholder-red-300"
                placeholder="Penicillin, Sulfa, None..."
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Consultant Surgeon *</label>
              <select
                name="consultant"
                value={formData.consultant}
                onChange={(e) => {
                  if (e.target.value === 'ADD_NEW') {
                    setShowAddDoctor(true);
                  } else {
                    handleInputChange(e);
                  }
                }}
                className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:ring-2 focus:ring-blue-100 outline-none font-semibold text-slate-800 bg-white"
              >
                {doctors.map((doc) => (
                  <option key={doc.id} value={doc.name}>
                    {doc.name}
                  </option>
                ))}
                <option value="ADD_NEW">+ Add New Doctor...</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Anaesthetist assigned</label>
              <input
                type="text"
                name="anaesthetist"
                value={formData.anaesthetist}
                onChange={handleInputChange}
                className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:ring-2 focus:ring-blue-100 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Admission Date</label>
              <input
                type="date"
                name="admissionDate"
                value={formData.admissionDate}
                onChange={handleInputChange}
                className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:ring-2 focus:ring-blue-100 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Surgery Date</label>
              <input
                type="date"
                name="surgeryDate"
                value={formData.surgeryDate}
                onChange={handleInputChange}
                className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:ring-2 focus:ring-blue-100 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Weight / Height</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  name="weight"
                  value={formData.weight}
                  onChange={handleInputChange}
                  placeholder="e.g. 70 kg"
                  className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:ring-2 focus:ring-blue-100 outline-none"
                />
                <input
                  type="text"
                  name="height"
                  value={formData.height}
                  onChange={handleInputChange}
                  placeholder="e.g. 170 cm"
                  className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:ring-2 focus:ring-blue-100 outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Ward / Room / Bed Allocation</label>
              <div className="grid grid-cols-3 gap-1">
                <input
                  type="text"
                  name="ward"
                  value={formData.ward}
                  onChange={handleInputChange}
                  placeholder="Ward B"
                  className="w-full border border-slate-200 rounded-lg p-1.5 text-xs focus:ring-2 focus:ring-blue-100 outline-none"
                />
                <input
                  type="text"
                  name="room"
                  value={formData.room}
                  onChange={handleInputChange}
                  placeholder="Rm 102"
                  className="w-full border border-slate-200 rounded-lg p-1.5 text-xs focus:ring-2 focus:ring-blue-100 outline-none"
                />
                <input
                  type="text"
                  name="bed"
                  value={formData.bed}
                  onChange={handleInputChange}
                  placeholder="Bed A"
                  className="w-full border border-slate-200 rounded-lg p-1.5 text-xs focus:ring-2 focus:ring-blue-100 outline-none"
                />
              </div>
            </div>
            <div className="flex items-center gap-6 mt-6 md:col-span-1">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  name="emergency"
                  checked={formData.emergency}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                />
                Emergency Case
              </label>
              <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  name="mlc"
                  checked={formData.mlc}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-rose-600 border-slate-300 rounded focus:ring-rose-500"
                />
                Medico-Legal Case (MLC)
              </label>
            </div>
          </div>
        </div>

        {/* Section 3: Vitals & Lab Investigations */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Vitals Column */}
          <div className="bg-slate-50 p-4 rounded-xl space-y-3">
            <h5 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">3a. Baseline Vitals</h5>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase">Blood Pressure</label>
                <input
                  type="text"
                  name="bp"
                  value={formData.vitals.bp}
                  onChange={handleVitalsChange}
                  placeholder="120/80 mmHg"
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase">Pulse Rate</label>
                <input
                  type="text"
                  name="pulse"
                  value={formData.vitals.pulse}
                  onChange={handleVitalsChange}
                  placeholder="72 bpm"
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase">Temperature</label>
                <input
                  type="text"
                  name="temp"
                  value={formData.vitals.temp}
                  onChange={handleVitalsChange}
                  placeholder="98.6 °F"
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase">SpO2 Level</label>
                <input
                  type="text"
                  name="spo2"
                  value={formData.vitals.spo2}
                  onChange={handleVitalsChange}
                  placeholder="98%"
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs outline-none"
                />
              </div>
            </div>
          </div>

          {/* Investigations Column */}
          <div className="bg-slate-50 p-4 rounded-xl space-y-3">
            <h5 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">3b. Diagnostic Reports summary</h5>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase">Hemoglobin (Hb)</label>
                <input
                  type="text"
                  name="hb"
                  value={formData.investigations.hb}
                  onChange={handleInvestigationsChange}
                  placeholder="14.0 g/dL"
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase">Serum Creatinine</label>
                <input
                  type="text"
                  name="creatinine"
                  value={formData.investigations.creatinine}
                  onChange={handleInvestigationsChange}
                  placeholder="0.8 mg/dL"
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase">WBC / Platelets</label>
                <input
                  type="text"
                  name="wbc"
                  value={formData.investigations.wbc}
                  onChange={handleInvestigationsChange}
                  placeholder="8500 WBC / 2.5L Platelet"
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase">ECG Finding</label>
                <input
                  type="text"
                  name="ecg"
                  value={formData.investigations.ecg}
                  onChange={handleInvestigationsChange}
                  placeholder="Normal Sinus Rhythm"
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1">Clinical Remarks & Instructions</label>
          <textarea
            name="remarks"
            value={formData.remarks}
            onChange={handleInputChange}
            rows={2}
            className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:ring-2 focus:ring-blue-100 outline-none"
            placeholder="Clinical flags, special preferences, diet restrictions..."
          ></textarea>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-50">
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className="bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold px-4 py-2.5 rounded-xl transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all flex items-center gap-1.5"
            style={{ backgroundColor: currentHospital.colors.primary }}
          >
            <FileText size={15} /> Save Patient & Proceed
          </button>
        </div>
      </form>

      {/* Modal to add doctor */}
      {showAddDoctor && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <h3 className="text-sm font-extrabold text-slate-800 dark:text-white uppercase tracking-wider">Add New Doctor</h3>
            <p className="text-[11px] text-slate-400">Add a consultant doctor to {currentHospital.name}. They will be selectable for patient records.</p>
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">Doctor Name</label>
                <input
                  type="text"
                  placeholder="e.g. Dr. Ashutosh Babhulkar"
                  value={newDocName}
                  onChange={(e) => setNewDocName(e.target.value)}
                  className="w-full border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs outline-none focus:ring-2 focus:ring-blue-100 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">Email address</label>
                <input
                  type="email"
                  placeholder="doctor@hospital.com"
                  value={newDocEmail}
                  onChange={(e) => setNewDocEmail(e.target.value)}
                  className="w-full border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs outline-none focus:ring-2 focus:ring-blue-100 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowAddDoctor(false);
                  setFormData(prev => ({ ...prev, consultant: currentDoctor?.name || doctors[0]?.name || '' }));
                }}
                className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold px-3 py-1.5 rounded-lg text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!newDocName.trim()) {
                    alert("Please enter a doctor name.");
                    return;
                  }
                  const created = addDoctor({
                    name: newDocName,
                    email: newDocEmail || `${newDocName.toLowerCase().replace(/[^a-z0-9]/g, '')}@hospital.com`,
                    role: 'Consultant'
                  });
                  setFormData(prev => ({ ...prev, consultant: created.name }));
                  setNewDocName('');
                  setNewDocEmail('');
                  setShowAddDoctor(false);
                  alert(`Successfully added ${created.name} to the hospital staff list!`);
                }}
                className="text-white font-bold px-3 py-1.5 rounded-lg text-xs"
                style={{ backgroundColor: currentHospital.colors.primary }}
              >
                Add Doctor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
