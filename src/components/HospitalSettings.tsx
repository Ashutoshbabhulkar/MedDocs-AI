import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import type { Hospital } from '../types';
import { 
  Building, 
  Palette, 
  Globe, 
  ShieldAlert,
  Save,
  UserPlus,
  Upload,
  Download,
  Database,
  Sparkles,
  CheckCircle,
  Trash2
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const HospitalSettings: React.FC = () => {
  const { currentHospital, setCurrentHospital, doctors, addDoctor, deleteDoctor } = useApp();

  const [formData, setFormData] = useState<Hospital>({ ...currentHospital });
  const [newDocName, setNewDocName] = useState('');
  const [newDocEmail, setNewDocEmail] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (name: 'nabhApproved' | 'nablApproved', checked: boolean) => {
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleColorChange = (key: 'primary' | 'secondary' | 'accent' | 'bg', value: string) => {
    setFormData(prev => ({
      ...prev,
      colors: { ...prev.colors, [key]: value }
    }));
  };

  // Image compressor helper
  const compressAndSetImage = (file: File, field: 'headerImage' | 'footerImage') => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 200;
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }
        if (height > MAX_HEIGHT) {
          width = Math.round((width * MAX_HEIGHT) / height);
          height = MAX_HEIGHT;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
          setFormData(prev => ({ ...prev, [field]: compressedBase64 }));
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // DB Export / Import
  const handleExportDB = () => {
    const backupData: Record<string, string> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('meddocs_') || key === 'meddocs_current_hospital_id')) {
        backupData[key] = localStorage.getItem(key) || '';
      }
    }
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `meddocs_backup_${currentHospital.code}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportDB = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (typeof imported !== 'object' || Array.isArray(imported)) {
          throw new Error("Invalid backup format");
        }
        
        if (confirm("Importing this backup will overwrite your current local database data. Do you want to proceed?")) {
          Object.entries(imported).forEach(([key, val]) => {
            if (typeof val === 'string') {
              localStorage.setItem(key, val);
            }
          });
          alert("Database imported successfully! The page will now reload.");
          window.location.reload();
        }
      } catch (err) {
        alert("Failed to import database backup. Ensure the file is a valid MedDocs backup JSON.");
      }
    };
    reader.readAsText(file);
  };

  // Local storage usage
  const getLocalStorageUsage = () => {
    let total = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        total += (localStorage.getItem(key) || '').length * 2;
      }
    }
    const kbUsed = Math.round(total / 1024);
    const percent = Math.min(100, Math.round((kbUsed / 5120) * 100)); // 5MB limit
    return { kbUsed, percent };
  };

  const { kbUsed, percent: storagePercent } = getLocalStorageUsage();

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentHospital(formData);
    confetti({
      particleCount: 50,
      colors: [formData.colors.primary, formData.colors.secondary]
    });
    alert("Hospital branding and tenant settings updated successfully!");
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold text-slate-800">Hospital Settings & Branding</h2>
        <p className="text-xs text-slate-400">Configure tenant specific branding, styling colors, letterhead variables, and registration IDs</p>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2/3 - Profile info & Accreditation */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
          {/* General hospital info */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b pb-2 flex items-center gap-1.5">
              <Building size={16} className="text-blue-500" /> Hospital Details
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Hospital Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full border border-slate-200 rounded-lg p-2.5 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Hospital Code</label>
                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleInputChange}
                  className="w-full border border-slate-200 rounded-lg p-2.5 outline-none font-mono"
                  disabled
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Hospital Logo Emoji / Symbol</label>
                <input
                  type="text"
                  name="logo"
                  value={formData.logo}
                  onChange={handleInputChange}
                  className="w-full border border-slate-200 rounded-lg p-2.5 outline-none text-lg text-center"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Registration number</label>
                <input
                  type="text"
                  name="registrationNumber"
                  value={formData.registrationNumber}
                  onChange={handleInputChange}
                  className="w-full border border-slate-200 rounded-lg p-2.5 outline-none font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">GST Identification Number</label>
                <input
                  type="text"
                  name="gstNumber"
                  value={formData.gstNumber}
                  onChange={handleInputChange}
                  className="w-full border border-slate-200 rounded-lg p-2.5 outline-none font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Website URL</label>
                <input
                  type="text"
                  name="website"
                  value={formData.website}
                  onChange={handleInputChange}
                  className="w-full border border-slate-200 rounded-lg p-2.5 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Hospital Email</label>
                <input
                  type="text"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full border border-slate-200 rounded-lg p-2.5 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Contact Phone</label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full border border-slate-200 rounded-lg p-2.5 outline-none"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-600 mb-1">Hospital Address (Letterhead copy)</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="w-full border border-slate-200 rounded-lg p-2.5 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Accreditation checklists */}
          <div className="space-y-3 pt-2">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b pb-2 flex items-center gap-1.5">
              <Globe size={16} className="text-blue-500" /> Accreditation Badges
            </h3>
            
            <div className="flex gap-6 text-xs font-semibold text-slate-700">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.nabhApproved}
                  onChange={(e) => handleCheckboxChange('nabhApproved', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                />
                NABH Accreditation Approved (Show Badge in templates)
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.nablApproved}
                  onChange={(e) => handleCheckboxChange('nablApproved', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                />
                NABL Lab Accreditation Approved (Show Badge in templates)
              </label>
            </div>
          </div>

          {/* Medical Staff & Clinicians Section */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b pb-2 flex items-center gap-1.5">
              <UserPlus size={16} className="text-blue-500" /> Medical Staff & Clinicians
            </h3>
            
            {/* List of current doctors */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {doctors.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-3">
                    <img
                      src={doc.avatar || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=100&h=100&q=80'}
                      alt={doc.name}
                      className="w-10 h-10 rounded-full object-cover border border-white"
                    />
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">{doc.name}</h4>
                      <p className="text-[10px] text-slate-400">{doc.email}</p>
                      <span className="inline-block text-[9px] bg-blue-50 text-blue-600 px-1 rounded mt-0.5 font-bold uppercase">{doc.role}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Are you sure you want to delete ${doc.name}?`)) {
                        deleteDoctor(doc.id);
                      }
                    }}
                    className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition"
                    title="Delete Staff Member"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>

            {/* Quick add doctor form */}
            <div className="bg-slate-50/50 p-4 rounded-xl border border-dashed border-slate-200 space-y-3">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Quick Add Clinician</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Doctor Name (e.g. Dr. John Doe)"
                  value={newDocName}
                  onChange={(e) => setNewDocName(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg p-2 text-xs outline-none focus:ring-2 focus:ring-blue-100"
                />
                <input
                  type="email"
                  placeholder="Email address (doctor@hospital.com)"
                  value={newDocEmail}
                  onChange={(e) => setNewDocEmail(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg p-2 text-xs outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!newDocName.trim()) {
                    alert("Please enter a doctor name.");
                    return;
                  }
                  addDoctor({
                    name: newDocName,
                    email: newDocEmail || `${newDocName.toLowerCase().replace(/[^a-z0-9]/g, '')}@hospital.com`,
                    role: 'Consultant'
                  });
                  setNewDocName('');
                  setNewDocEmail('');
                  alert("Clinician successfully added to staff list!");
                }}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2 rounded-lg text-xs transition-all shadow-sm flex items-center gap-1.5"
              >
                <UserPlus size={14} /> Add Staff Member
              </button>
            </div>
          </div>

          {/* Custom Letterhead Layout Images */}
          <div className="space-y-4 pt-4 border-t border-slate-100 text-left">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b pb-2 flex items-center gap-1.5">
              <Upload size={16} className="text-blue-500" /> Letterhead & Document Templates
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              {/* Header Image */}
              <div className="space-y-2">
                <label className="block font-bold text-slate-650">Header Letterhead Image (Max 800x200px)</label>
                <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 hover:bg-slate-50 p-4 rounded-xl cursor-pointer relative min-h-[120px]">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) compressAndSetImage(file, 'headerImage');
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  {formData.headerImage ? (
                    <div className="w-full text-center space-y-2">
                      <img src={formData.headerImage} alt="Header Preview" className="max-h-[60px] mx-auto object-contain rounded border border-slate-200" />
                      <span className="text-[10px] text-emerald-600 font-bold block flex items-center justify-center gap-1"><CheckCircle size={12} /> Header Loaded & Compressed</span>
                    </div>
                  ) : (
                    <div className="text-center text-slate-400">
                      <Upload size={20} className="mx-auto mb-1 text-slate-350" />
                      <span>Click to upload Header Image</span>
                    </div>
                  )}
                </div>
                {formData.headerImage && (
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, headerImage: undefined }))}
                    className="text-[10px] font-bold text-rose-600 hover:underline"
                  >
                    Clear Header Image
                  </button>
                )}
              </div>

              {/* Footer Image */}
              <div className="space-y-2">
                <label className="block font-bold text-slate-655">Footer Letterhead Image (Max 800x200px)</label>
                <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 hover:bg-slate-50 p-4 rounded-xl cursor-pointer relative min-h-[120px]">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) compressAndSetImage(file, 'footerImage');
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  {formData.footerImage ? (
                    <div className="w-full text-center space-y-2">
                      <img src={formData.footerImage} alt="Footer Preview" className="max-h-[60px] mx-auto object-contain rounded border border-slate-200" />
                      <span className="text-[10px] text-emerald-600 font-bold block flex items-center justify-center gap-1"><CheckCircle size={12} /> Footer Loaded & Compressed</span>
                    </div>
                  ) : (
                    <div className="text-center text-slate-400">
                      <Upload size={20} className="mx-auto mb-1 text-slate-350" />
                      <span>Click to upload Footer Image</span>
                    </div>
                  )}
                </div>
                {formData.footerImage && (
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, footerImage: undefined }))}
                    className="text-[10px] font-bold text-rose-600 hover:underline"
                  >
                    Clear Footer Image
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right 1/3 - Settings panels */}
        <div className="space-y-6">
          {/* AI Configuration */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4 text-left">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b pb-2 flex items-center gap-1.5">
              <Sparkles size={16} className="text-blue-500" /> Gemini AI Configuration
            </h3>
            
            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Gemini API Key</label>
                <input
                  type="password"
                  name="geminiApiKey"
                  value={formData.geminiApiKey || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, geminiApiKey: e.target.value }))}
                  placeholder="Enter Gemini API Key"
                  className="w-full border border-slate-200 rounded-lg p-2.5 outline-none font-mono focus:ring-2 focus:ring-blue-100"
                />
                <span className="text-[9px] text-slate-400 mt-1 block">Your API Key is kept strictly client-side in secure local storage.</span>
              </div>

              <div>
                <label className="flex items-start gap-2 cursor-pointer font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={!!formData.consentToAiShare}
                    onChange={(e) => setFormData(prev => ({ ...prev, consentToAiShare: e.target.checked }))}
                    className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Enable clinical patient data processing with Gemini API</span>
                </label>
                <span className="text-[9px] text-slate-400 mt-1 block ml-6">Required to enable intelligent OCR, text extraction, and voice assistant responses.</span>
              </div>
            </div>
          </div>

          {/* Maintenance & backups */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4 text-left">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b pb-2 flex items-center gap-1.5">
              <Database size={16} className="text-blue-500" /> Maintenance & Storage
            </h3>

            <div className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <div className="flex justify-between font-bold text-slate-650">
                  <span>Local Storage Used</span>
                  <span>{kbUsed} KB / 5120 KB</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-300 ${storagePercent > 80 ? 'bg-rose-500' : 'bg-blue-600'}`} 
                    style={{ width: `${storagePercent}%` }}
                  ></div>
                </div>
                <span className="text-[9px] text-slate-400 block">Quota is shared across all patient records, audits, and custom letterheads.</span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleExportDB}
                  className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold py-2 px-3 rounded-lg text-xs flex items-center justify-center gap-1 shadow-sm transition"
                >
                  <Download size={13} /> Export DB
                </button>
                <div className="relative">
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportDB}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <button
                    type="button"
                    className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold py-2 px-3 rounded-lg text-xs flex items-center justify-center gap-1 shadow-sm transition"
                  >
                    <Upload size={13} /> Import DB
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Palette Selector */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b pb-2 flex items-center gap-1.5">
              <Palette size={16} className="text-blue-500" /> Style Customization
            </h3>

            <div className="space-y-4">
              {/* Primary Color */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1 flex justify-between">
                  <span>Primary Theme Color</span>
                  <span className="font-mono text-slate-400">{formData.colors.primary}</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={formData.colors.primary}
                    onChange={(e) => handleColorChange('primary', e.target.value)}
                    className="w-8 h-8 rounded-lg border-0 cursor-pointer overflow-hidden"
                  />
                  <input
                    type="text"
                    value={formData.colors.primary}
                    onChange={(e) => handleColorChange('primary', e.target.value)}
                    className="flex-1 border border-slate-200 rounded-lg p-1.5 text-xs outline-none font-mono"
                  />
                </div>
              </div>

              {/* Secondary Color */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1 flex justify-between">
                  <span>Secondary Theme Color</span>
                  <span className="font-mono text-slate-400">{formData.colors.secondary}</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={formData.colors.secondary}
                    onChange={(e) => handleColorChange('secondary', e.target.value)}
                    className="w-8 h-8 rounded-lg border-0 cursor-pointer overflow-hidden"
                  />
                  <input
                    type="text"
                    value={formData.colors.secondary}
                    onChange={(e) => handleColorChange('secondary', e.target.value)}
                    className="flex-1 border border-slate-200 rounded-lg p-1.5 text-xs outline-none font-mono"
                  />
                </div>
              </div>

              {/* Preview Box */}
              <div className="p-4 rounded-xl border border-slate-100 space-y-2 text-center" style={{ backgroundColor: formData.colors.bg }}>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Interactive Preview</span>
                <button
                  type="button"
                  className="w-full text-white text-xs font-bold py-2 rounded-lg"
                  style={{ backgroundColor: formData.colors.primary }}
                >
                  Primary Action Button
                </button>
                <button
                  type="button"
                  className="w-full text-xs font-bold py-2 rounded-lg border bg-white"
                  style={{ color: formData.colors.secondary, borderColor: formData.colors.primary }}
                >
                  Secondary Action Button
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm"
              style={{ backgroundColor: formData.colors.primary }}
            >
              <Save size={14} /> Commit Brand Changes
            </button>
          </div>

          {/* Security details info */}
          <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex items-start gap-3">
            <ShieldAlert size={18} className="text-amber-500 mt-0.5 shrink-0" />
            <div className="text-xs text-slate-500 leading-relaxed">
              <h5 className="font-bold text-slate-700">Data Isolation Lock</h5>
              <p className="mt-0.5">
                Modifications here only affect the <strong>{formData.code}</strong> tenant partition. Users and data from other hospitals remain strictly isolated.
              </p>
            </div>
          </div>
        </div>

      </form>
    </div>
  );
};
