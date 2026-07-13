import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import type { TemplateElement, Template } from '../types';
import { 
  FileText, 
  RotateCcw, 
  Trash2, 
  Plus, 
  Save, 
  ArrowUp, 
  ArrowDown, 
  SlidersHorizontal,
  Layout,
  History
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const TemplateBuilder: React.FC = () => {
  const { currentHospital, templates, updateTemplate, rollbackTemplate, templateVersions } = useApp();
  const [selectedTemplate, setSelectedTemplate] = useState<Template>(templates[0]);
  
  // Custom layout settings
  const [pageSize, setPageSize] = useState<'A4' | 'Letter' | 'Legal'>('A4');
  const [margins, setMargins] = useState<'normal' | 'narrow' | 'wide'>('normal');
  const [showLogo, setShowLogo] = useState(true);
  const [showWatermark, setShowWatermark] = useState(false);
  const [versionNotes, setVersionNotes] = useState('');

  const [elements, setElements] = useState<TemplateElement[]>(selectedTemplate.elements);

  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const temp = templates.find(t => t.id === e.target.value);
    if (temp) {
      setSelectedTemplate(temp);
      setElements(temp.elements);
      setVersionNotes('');
    }
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const list = [...elements];
    const item = list[index];
    list[index] = list[index - 1];
    list[index - 1] = item;
    setElements(list);
  };

  const handleMoveDown = (index: number) => {
    if (index === elements.length - 1) return;
    const list = [...elements];
    const item = list[index];
    list[index] = list[index + 1];
    list[index + 1] = item;
    setElements(list);
  };

  const handleTextChange = (id: string, text: string) => {
    const list = elements.map(el => el.id === id ? { ...el, content: text } : el);
    setElements(list);
  };

  const handleStyleChange = (id: string, styleKey: 'bold' | 'italic' | 'underline') => {
    const list = elements.map(el => {
      if (el.id === id) {
        const styles = el.styles || {};
        return {
          ...el,
          styles: { ...styles, [styleKey]: !styles[styleKey] }
        };
      }
      return el;
    });
    setElements(list);
  };

  const handleDeleteElement = (id: string) => {
    const list = elements.filter(el => el.id !== id);
    setElements(list);
  };

  const handleAddElement = (type: TemplateElement['type']) => {
    const newEl: TemplateElement = {
      id: `el-${Date.now()}`,
      type,
      content: type === 'paragraph' ? 'Click to type paragraph content...' : 
               type === 'header' ? 'SECTION TITLE' : 
               type === 'footer' ? 'Footer details' : 'New Template Block',
      styles: { align: 'left', fontSize: 'base' }
    };
    setElements([...elements, newEl]);
  };

  const handleSave = () => {
    updateTemplate(selectedTemplate.id, elements, versionNotes);
    
    // Refresh current template display
    const updated = templates.find(t => t.id === selectedTemplate.id);
    if (updated) {
      setSelectedTemplate(updated);
    }
    
    confetti({
      particleCount: 50,
      colors: ['#2563eb', '#1d4ed8']
    });

    setVersionNotes('');
    alert(`Template layout saved! Updated to Version ${selectedTemplate.currentVersion + 1}`);
  };

  const handleRollback = (verNum: number) => {
    rollbackTemplate(selectedTemplate.id, verNum);
    const updated = templates.find(t => t.id === selectedTemplate.id);
    if (updated) {
      setSelectedTemplate(updated);
      setElements(updated.elements);
    }
    alert(`Successfully rolled back template to layout from Version ${verNum}`);
  };

  const activeHistory = templateVersions.filter(v => v.templateId === selectedTemplate.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-800">Dynamic Template Builder</h2>
          <p className="text-xs text-slate-400">Design documents visually with headers, watermarks, variables and margins</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Sidebar settings */}
        <div className="lg:col-span-1 space-y-5">
          {/* Document Properties */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b pb-2 flex items-center gap-1.5">
              <SlidersHorizontal size={14} className="text-blue-500" /> Page Settings
            </h3>
            
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Select Template</label>
              <select
                value={selectedTemplate.id}
                onChange={handleTemplateChange}
                className="w-full border border-slate-200 rounded-lg p-2 text-xs"
              >
                {templates.map(t => (
                  <option key={t.id} value={t.id}>{t.name} (V{t.currentVersion})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Page Format</label>
              <div className="grid grid-cols-3 gap-1">
                {(['A4', 'Letter', 'Legal'] as const).map(size => (
                  <button
                    key={size}
                    onClick={() => setPageSize(size)}
                    className={`py-1.5 text-center text-xs font-semibold rounded-lg border transition-all ${
                      pageSize === size
                        ? 'bg-slate-800 text-white border-slate-800'
                        : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Page Margins</label>
              <div className="grid grid-cols-3 gap-1">
                {(['normal', 'narrow', 'wide'] as const).map(m => (
                  <button
                    key={m}
                    onClick={() => setMargins(m)}
                    className={`py-1.5 text-center text-xs font-semibold rounded-lg border capitalize transition-all ${
                      margins === m
                        ? 'bg-slate-800 text-white border-slate-800'
                        : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Layout Toggles */}
            <div className="space-y-3 pt-2">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showLogo}
                  onChange={(e) => setShowLogo(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                />
                Show Hospital Letterhead Logo
              </label>

              <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showWatermark}
                  onChange={(e) => setShowWatermark(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                />
                Apply Secure Watermark
              </label>
            </div>
          </div>

          {/* Add Elements Panel */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b pb-2 flex items-center gap-1.5">
              <Plus size={14} className="text-blue-500" /> Insert Layout Block
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleAddElement('header')}
                className="p-2 border border-slate-100 rounded-lg text-center hover:bg-slate-50 text-[10px] font-bold text-slate-700 flex flex-col items-center gap-1"
              >
                <Layout size={16} className="text-blue-500" /> Header Section
              </button>
              <button
                onClick={() => handleAddElement('paragraph')}
                className="p-2 border border-slate-100 rounded-lg text-center hover:bg-slate-50 text-[10px] font-bold text-slate-700 flex flex-col items-center gap-1"
              >
                <FileText size={16} className="text-teal-500" /> Paragraph Block
              </button>
            </div>
          </div>

          {/* Version history list */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b pb-2 flex items-center gap-1.5">
              <History size={14} className="text-blue-500" /> Version History
            </h3>
            <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
              <div className="p-2 bg-blue-50 border border-blue-100 rounded-lg text-xs space-y-1">
                <div className="flex justify-between items-center font-bold text-blue-800">
                  <span>Version {selectedTemplate.currentVersion} (Active)</span>
                </div>
                <p className="text-[10px] text-slate-500">Modified by {selectedTemplate.modifiedBy}</p>
                <p className="text-[10px] text-slate-400 font-medium">{new Date(selectedTemplate.modifiedAt).toLocaleString()}</p>
              </div>

              {activeHistory.map(ver => (
                <div key={ver.id} className="p-2 bg-slate-50 border border-slate-100 rounded-lg text-xs space-y-1 flex justify-between items-start">
                  <div>
                    <h5 className="font-bold text-slate-700">Version {ver.version}</h5>
                    <p className="text-[9px] text-slate-400">{ver.notes}</p>
                    <p className="text-[9px] text-slate-400">{new Date(ver.modifiedAt).toLocaleString()}</p>
                  </div>
                  <button
                    onClick={() => handleRollback(ver.version)}
                    className="p-1 hover:bg-slate-200 rounded text-slate-500 hover:text-slate-800"
                    title="Rollback to this version"
                  >
                    <RotateCcw size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main template workspace canvas */}
        <div className="lg:col-span-3 space-y-5">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            
            {/* Visual Canvas Area simulating a Page */}
            <div 
              className={`border border-slate-200 rounded-xl relative shadow-md bg-white overflow-hidden mx-auto transition-all ${
                pageSize === 'Letter' ? 'aspect-[8.5/11]' : pageSize === 'Legal' ? 'aspect-[8.5/14]' : 'aspect-[1/1.414]'
              }`}
              style={{
                width: '100%',
                maxWidth: '650px',
                padding: margins === 'narrow' ? '1.5rem' : margins === 'wide' ? '3.5rem' : '2.5rem',
                backgroundImage: showWatermark 
                  ? `repeating-linear-gradient(45deg, #f1f5f9 0px, #f1f5f9 20px, transparent 20px, transparent 40px)` 
                  : 'none'
              }}
            >
              {/* Secure Watermark overlay text */}
              {showWatermark && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] select-none rotate-45">
                  <span className="text-6xl font-extrabold tracking-widest text-slate-900 uppercase">MEDDOCS AI SECURED</span>
                </div>
              )}

              {/* Letterhead Logo Area */}
              {showLogo && (
                currentHospital.headerImage ? (
                  <div className="mb-6 no-print">
                    <img 
                      src={currentHospital.headerImage} 
                      alt="Letterhead Header" 
                      className="w-full max-h-[80px] object-contain border-b pb-2" 
                    />
                  </div>
                ) : (
                  <div className="border-b-2 border-slate-800 pb-4 mb-6 flex justify-between items-center no-print">
                    <div className="flex items-center gap-3">
                      <span className="text-4xl">{currentHospital.logo}</span>
                      <div>
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-wide">{currentHospital.name}</h4>
                        <p className="text-[8px] text-slate-400 font-semibold">{currentHospital.registrationNumber} • NABH CERTIFIED</p>
                      </div>
                    </div>
                    <div className="text-right text-[8px] text-slate-400 space-y-0.5">
                      <p>{currentHospital.address}</p>
                      <p>{currentHospital.phone} • {currentHospital.email}</p>
                    </div>
                  </div>
                )
              )}

              {/* Visual elements container */}
              <div className="space-y-4">
                {elements.map((el, index) => (
                  <div 
                    key={el.id} 
                    className="p-3 border border-dashed border-slate-100 hover:border-slate-300 rounded-xl relative group flex items-start gap-3 transition-colors bg-slate-50/20"
                  >
                    {/* Element details */}
                    <div className="flex-1 space-y-1">
                      <span className="text-[8px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                        {el.type}
                      </span>
                      
                      {el.type === 'patient-vars' ? (
                        <div className="p-3 bg-slate-100 rounded-lg text-[9px] font-bold text-slate-500 border grid grid-cols-2 gap-1.5 uppercase">
                          <div>Patient Name: [Variable]</div>
                          <div>UHID: [Variable]</div>
                          <div>Diagnosis: [Variable]</div>
                          <div>Procedure: [Variable]</div>
                          <div>Laterality: [Variable]</div>
                          <div>Consultant: [Variable]</div>
                        </div>
                      ) : el.type === 'signature-block' ? (
                        <div className="grid grid-cols-2 gap-10 pt-4 text-center text-[9px] font-bold text-slate-400 border-t border-slate-100">
                          <div>Doctor's Signature Block & Stamp</div>
                          <div>Patient / relative Signature Box</div>
                        </div>
                      ) : el.type === 'qr-code' ? (
                        <div className="border border-dashed border-slate-300 p-2 rounded w-20 h-20 flex items-center justify-center mx-auto bg-white">
                          <div className="text-center text-[8px] font-bold text-slate-400 space-y-1">
                            <div className="text-base">QR</div>
                            <div>Verify Copy</div>
                          </div>
                        </div>
                      ) : (
                        <textarea
                          value={el.content}
                          onChange={(e) => handleTextChange(el.id, e.target.value)}
                          rows={el.type === 'paragraph' ? 3 : 1}
                          className={`w-full bg-transparent border-0 outline-none resize-none p-1 text-xs text-slate-800 ${
                            el.styles?.bold ? 'font-bold' : ''
                          }`}
                          style={{
                            fontSize: el.type === 'header' ? '1.1rem' : '0.75rem',
                            textAlign: el.styles?.align || 'left'
                          }}
                        />
                      )}
                    </div>

                    {/* Toolbar controls */}
                    <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 flex items-center gap-1 bg-white border rounded-lg p-1 shadow-sm transition-opacity">
                      <button
                        onClick={() => handleStyleChange(el.id, 'bold')}
                        className={`p-1 rounded hover:bg-slate-100 text-[10px] font-bold ${el.styles?.bold ? 'bg-slate-100 text-blue-600' : 'text-slate-500'}`}
                        title="Toggle Bold"
                      >
                        B
                      </button>
                      <button
                        onClick={() => handleMoveUp(index)}
                        className="p-1 rounded hover:bg-slate-100 text-slate-500"
                        title="Move Up"
                      >
                        <ArrowUp size={11} />
                      </button>
                      <button
                        onClick={() => handleMoveDown(index)}
                        className="p-1 rounded hover:bg-slate-100 text-slate-500"
                        title="Move Down"
                      >
                        <ArrowDown size={11} />
                      </button>
                      <button
                        onClick={() => handleDeleteElement(el.id)}
                        className="p-1 rounded hover:bg-slate-100 text-rose-500"
                        title="Delete Element"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Letterhead Footer Area */}
              {showLogo && currentHospital.footerImage && (
                <div className="mt-6 pt-4 border-t no-print">
                  <img 
                    src={currentHospital.footerImage} 
                    alt="Letterhead Footer" 
                    className="w-full max-h-[60px] object-contain mx-auto" 
                  />
                </div>
              )}

              {/* Form Variables Guide */}
              <div className="mt-8 border-t border-slate-100 pt-4 text-[9px] text-slate-400 no-print flex justify-between items-center">
                <span>Variables accepted: {"{{PatientName}}, {{UHID}}, {{Laterality}}, {{Consultant}}"}</span>
                <span className="font-semibold text-blue-600">Dynamic Variable Mapping Enabled</span>
              </div>
            </div>

            {/* Commit Form details */}
            <div className="p-4 border-t border-slate-50 bg-slate-50/50 flex justify-between items-center">
              <input
                type="text"
                value={versionNotes}
                onChange={(e) => setVersionNotes(e.target.value)}
                placeholder="Enter version modification notes..."
                className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs mr-4 outline-none focus:ring-2 focus:ring-blue-100"
              />
              <button
                onClick={handleSave}
                className="bg-slate-900 text-white font-bold py-2.5 px-5 rounded-xl text-xs flex items-center gap-1.5 hover:bg-slate-800 transition-all shadow-sm"
              >
                <Save size={14} /> Commit Version V{selectedTemplate.currentVersion + 1}
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
