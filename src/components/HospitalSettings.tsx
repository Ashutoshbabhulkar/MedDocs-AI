import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import type { Hospital } from '../types';
import { 
  Building, 
  Palette, 
  Globe, 
  ShieldAlert,
  Save,
  UserPlus
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const HospitalSettings: React.FC = () => {
  const { currentHospital, setCurrentHospital, doctors, addDoctor } = useApp();

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
                <div key={doc.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
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
        </div>

        {/* Right 1/3 - Color Palette Customization */}
        <div className="space-y-6">
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
