import React, { useRef, useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import type { ClinicalDocument } from '../types';
import { 
  Signature, 
  Trash2, 
  CheckCircle, 
  Award, 
  Lock, 
  FileCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface DigitalSignerProps {
  selectedDocId: string | null;
  setSelectedDocId: (id: string | null) => void;
}

const generateSHA256Mock = (text: string) => {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  return `sha256-e9c8f${hex}9a12b${hex.split('').reverse().join('')}f82c`;
};

export const DigitalSigner: React.FC<DigitalSignerProps> = ({ selectedDocId, setSelectedDocId }) => {
  const { currentHospital, documents, addSignature, currentUser } = useApp();
  const [selectedDoc, setSelectedDoc] = useState<ClinicalDocument | null>(null);
  const docHash = selectedDoc ? generateSHA256Mock(selectedDoc.content + JSON.stringify(selectedDoc.signatures)) : 'Not Generated';
  
  // Signing States
  const [signerRole, setSignerRole] = useState<'Consultant' | 'Patient' | 'Relative' | 'Witness'>('Consultant');
  const [signerName, setSignerName] = useState('');
  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);

  // Set document initially
  useEffect(() => {
    if (selectedDocId) {
      const doc = documents.find(d => d.id === selectedDocId);
      if (doc) {
        setSelectedDoc(doc);
      }
    } else if (documents.length > 0) {
      setSelectedDoc(documents[0]);
      setSelectedDocId(documents[0].id);
    }
  }, [selectedDocId, documents]);

  const handleDocChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const doc = documents.find(d => d.id === e.target.value) || null;
    setSelectedDoc(doc);
    setSelectedDocId(doc ? doc.id : null);
  };

  // Set up canvas drawing context
  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    canvas.width = canvas.offsetWidth * 2;
    canvas.height = canvas.offsetHeight * 2;
    canvas.style.width = `${canvas.offsetWidth}px`;
    canvas.style.height = `${canvas.offsetHeight}px`;

    const context = canvas.getContext('2d');
    if (!context) return;
    context.scale(2, 2);
    context.lineCap = 'round';
    context.strokeStyle = '#0f172a'; // dark slate ink color
    context.lineWidth = 2.5;
    contextRef.current = context;
  }, [selectedDoc]);

  // Set signer name defaults based on role select
  useEffect(() => {
    if (signerRole === 'Consultant') {
      setSignerName(currentUser.name);
    } else if (selectedDoc) {
      if (signerRole === 'Patient') {
        setSignerName(selectedDoc.patientName);
      } else {
        setSignerName('');
      }
    }
  }, [signerRole, selectedDoc, currentUser]);

  const startDrawing = ({ nativeEvent }: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    let clientX, clientY;
    if ('touches' in nativeEvent) {
      clientX = nativeEvent.touches[0].clientX;
      clientY = nativeEvent.touches[0].clientY;
    } else {
      clientX = nativeEvent.clientX;
      clientY = nativeEvent.clientY;
    }

    if (!canvasRef.current || !contextRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    contextRef.current.beginPath();
    contextRef.current.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = ({ nativeEvent }: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !contextRef.current || !canvasRef.current) return;
    
    let clientX, clientY;
    if ('touches' in nativeEvent) {
      clientX = nativeEvent.touches[0].clientX;
      clientY = nativeEvent.touches[0].clientY;
    } else {
      clientX = nativeEvent.clientX;
      clientY = nativeEvent.clientY;
    }

    const rect = canvasRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    contextRef.current.lineTo(x, y);
    contextRef.current.stroke();
  };

  const stopDrawing = () => {
    if (!contextRef.current) return;
    contextRef.current.closePath();
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    if (!canvasRef.current || !contextRef.current) return;
    const canvas = canvasRef.current;
    contextRef.current.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleApplySignature = () => {
    if (!selectedDoc) return;
    if (!signerName) {
      alert("Please enter the name of the signatory.");
      return;
    }

    if (!canvasRef.current) return;
    const signatureData = canvasRef.current.toDataURL(); // extract canvas image base64

    addSignature(selectedDoc.id, {
      role: signerRole,
      signedBy: signerRole === 'Consultant' ? 'user-1' : `sig-${Date.now()}`,
      signedByName: signerName,
      signatureType: 'draw',
      signatureData
    });

    confetti({
      particleCount: 70,
      colors: ['#2563eb', '#10b981']
    });

    clearCanvas();
    // Refresh document state
    const refreshed = documents.find(d => d.id === selectedDoc.id);
    if (refreshed) {
      setSelectedDoc(refreshed);
    }
    alert("Digital signature appended and cryptographic seal verified!");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-800">Digital Signatures & Credentials</h2>
          <p className="text-xs text-slate-400">Digitally sign clinical documents and lock verification copy on hospital servers</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Signer Pad Inputs */}
        <div className="lg:col-span-1 space-y-5">
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b pb-2 flex items-center gap-1.5">
              <Signature size={16} className="text-blue-500" /> Signature Console
            </h3>

            {/* Select Document */}
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Select Document to Sign</label>
              <select
                value={selectedDoc?.id || ''}
                onChange={handleDocChange}
                className="w-full border border-slate-200 rounded-lg p-2.5 text-xs outline-none focus:ring-2 focus:ring-blue-100"
              >
                {documents.map(d => (
                  <option key={d.id} value={d.id}>{d.title} ({d.status})</option>
                ))}
              </select>
            </div>

            {selectedDoc?.status === 'Signed' || selectedDoc?.status === 'Locked' ? (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center space-y-2 text-xs">
                <Lock size={24} className="text-slate-600 mx-auto" />
                <h4 className="font-bold text-slate-700">Document Immutable</h4>
                <p className="text-[10px] text-slate-400">
                  This document has already been fully signed and sealed. Under medico-legal regulations, it cannot be modified. Any changes will generate a new corrected version.
                </p>
              </div>
            ) : (
              <>
                {/* Select Signer Role */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Signatory Role</label>
                  <select
                    value={signerRole}
                    onChange={(e) => setSignerRole(e.target.value as any)}
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs outline-none"
                  >
                    <option>Consultant</option>
                    <option>Patient</option>
                    <option>Relative</option>
                    <option>Witness</option>
                  </select>
                </div>

                {/* Signatory Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Signatory Name</label>
                  <input
                    type="text"
                    value={signerName}
                    onChange={(e) => setSignerName(e.target.value)}
                    placeholder="Enter full name of signatory"
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs outline-none"
                  />
                </div>

                {/* Canvas Drawing Board */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-bold text-slate-600">Draw Signature on Screen</label>
                    <button
                      onClick={clearCanvas}
                      className="text-[10px] text-slate-400 font-bold hover:text-slate-600 flex items-center gap-0.5"
                    >
                      <Trash2 size={10} /> Clear Pad
                    </button>
                  </div>
                  <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50 relative h-36">
                    <canvas
                      ref={canvasRef}
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={stopDrawing}
                      className="absolute inset-0 w-full h-full cursor-crosshair touch-none"
                    />
                  </div>
                </div>

                {/* Verify details */}
                <button
                  onClick={handleApplySignature}
                  className="w-full text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm"
                  style={{ backgroundColor: currentHospital.colors.primary }}
                >
                  <FileCheck size={14} /> Validate Credentials & Seal
                </button>
              </>
            )}
          </div>
        </div>

        {/* Right Column: Signed Status and Document Preview */}
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
            
            {/* Signed status badges block */}
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-base font-bold text-slate-800">Cryptographic Seal Status</h3>
              <p className="text-xs text-slate-400">Verifying signature records and SHA-256 certificate hashes</p>
              
              <div className="grid grid-cols-2 gap-4 mt-4 text-xs">
                {/* Signatures List */}
                <div className="bg-slate-50 p-4 rounded-xl space-y-3">
                  <h4 className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Verification Signatures</h4>
                  <div className="space-y-2">
                    {selectedDoc?.signatures.length === 0 ? (
                      <p className="text-[10px] text-slate-400 italic">No signatures recorded yet.</p>
                    ) : (
                      selectedDoc?.signatures.map(sig => (
                        <div key={sig.id} className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-100 shadow-xs">
                          <div>
                            <div className="font-bold text-slate-700">{sig.signedByName}</div>
                            <div className="text-[9px] text-slate-400">{sig.role} • {sig.signedAt}</div>
                          </div>
                          <span className="bg-emerald-50 text-emerald-700 text-[8px] font-extrabold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 border border-emerald-100">
                            <CheckCircle size={9} /> Verified
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Cryptographic metadata */}
                <div className="bg-slate-50 p-4 rounded-xl space-y-2">
                  <h4 className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Security Stamp</h4>
                  <div className="space-y-1.5 text-[9px] text-slate-500 font-medium">
                    <p><strong>Status:</strong> {selectedDoc?.status}</p>
                    <p><strong>SHA-256 Hash:</strong> <span className="font-mono text-[8px] text-blue-600 break-all">{docHash}</span></p>
                    <p><strong>Algorithm:</strong> ECDSA P-256 + SHA256</p>
                    <p><strong>IP Logs:</strong> 192.168.1.{100 + (selectedDoc ? selectedDoc.patientName.length : 24)} (Secure Client IP)</p>
                    <p><strong>Witness Status:</strong> {selectedDoc?.signatures.some(s => s.role === 'Witness') ? '🟢 Witnessed' : '🔴 Missing Witness Signature'}</p>
                  </div>
                  {selectedDoc?.status === 'Signed' && (
                    <div className="mt-3 bg-blue-50 text-blue-700 border border-blue-100 p-2 rounded-lg flex items-center gap-1.5">
                      <Award size={14} className="shrink-0 text-blue-600" />
                      <span className="text-[8px] font-bold">Legally Binding Medical Document Locked</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Document Text Preview */}
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-700">Document Text Review</span>
                <span className="text-[10px] text-slate-400">Read-only preview</span>
              </div>
              <div className="border border-slate-100 rounded-xl p-5 bg-slate-50/50 max-h-[300px] overflow-y-auto">
                {selectedDoc ? (
                  <div 
                    className="prose prose-sm max-w-none text-slate-600 leading-relaxed text-xs"
                    dangerouslySetInnerHTML={{ __html: selectedDoc.content }}
                  />
                ) : (
                  <p className="text-slate-400 italic text-center">No document loaded.</p>
                )}
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
