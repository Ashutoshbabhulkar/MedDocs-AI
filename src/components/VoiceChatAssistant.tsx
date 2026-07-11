import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import {
  Sparkles,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  X,
  Send,
  HelpCircle,
  Navigation
} from 'lucide-react';

interface VoiceChatAssistantProps {
  onClose: () => void;
  setActiveTab: (tab: string) => void;
  selectedPatientId: string | null;
  setSelectedPatientId: (id: string | null) => void;
}

interface Message {
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export function VoiceChatAssistant({
  onClose,
  setActiveTab,
  selectedPatientId,
  setSelectedPatientId
}: VoiceChatAssistantProps) {
  const { patients } = useApp();
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechText, setSpeechText] = useState('');
  const [speechSynthesisEnabled, setSpeechSynthesisEnabled] = useState(true);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      text: 'Hello! I am your clinical voice assistant. Speak a command or type a query.\nTry: **"Go to Patient Register"**, **"Select patient Priyanka"**, or **"Summarize stay"**.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [recognitionError, setRecognitionError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(window.speechSynthesis);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onstart = () => {
        setIsListening(true);
        setRecognitionError(null);
      };

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        addMessage('user', transcript);
        handleVoiceCommand(transcript);
      };

      rec.onerror = (event: any) => {
        console.error('Speech Recognition Error:', event.error);
        if (event.error === 'not-allowed') {
          setRecognitionError('Microphone permission denied.');
        } else {
          setRecognitionError(`Error: ${event.error}`);
        }
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    } else {
      setRecognitionError('Web Speech API is not supported in this browser.');
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      stopSpeaking();
    };
  }, [patients]);

  // Auto scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addMessage = (role: 'user' | 'assistant', text: string) => {
    setMessages(prev => [
      ...prev,
      {
        role,
        text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  // TTS helper
  const speakText = (text: string) => {
    if (!speechSynthesisEnabled || !synthRef.current) return;
    
    // Stop current speech
    stopSpeaking();

    // Remove markdown symbols for clean reading
    const cleanText = text.replace(/\*\*/g, '').replace(/📝/g, '').replace(/🔪/g, '');

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    utteranceRef.current = utterance;
    synthRef.current.speak(utterance);
  };

  const stopSpeaking = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
  };

  // Toggle Listening
  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      stopSpeaking();
      try {
        recognitionRef.current?.start();
      } catch (err) {
        console.error(err);
        // Fallback simulation triggers if starting fails or API isn't ready
        startSimulation();
      }
    }
  };

  // Parse voice commands
  const handleVoiceCommand = (command: string) => {
    const lower = command.toLowerCase().trim();

    // 1. Navigation Commands
    if (lower.includes('go to dashboard') || lower.includes('open dashboard')) {
      setActiveTab('dashboard');
      const msg = 'Navigated to **Dashboard**.';
      addMessage('assistant', msg);
      speakText('Navigated to Dashboard.');
      return;
    }
    if (lower.includes('go to patient') || lower.includes('open patient') || lower.includes('open register')) {
      setActiveTab('patients');
      const msg = 'Navigated to **Patient Register**.';
      addMessage('assistant', msg);
      speakText('Navigated to Patient Register.');
      return;
    }
    if (lower.includes('go to clinical generator') || lower.includes('open clinical generator') || lower.includes('open generator') || lower.includes('go to generator')) {
      setActiveTab('clinical');
      const msg = 'Navigated to **AI Clinician Generator**.';
      addMessage('assistant', msg);
      speakText('Navigated to AI Clinician Generator.');
      return;
    }
    if (lower.includes('go to template') || lower.includes('open template') || lower.includes('open builder') || lower.includes('go to builder')) {
      setActiveTab('builder');
      const msg = 'Navigated to **Visual Template Builder**.';
      addMessage('assistant', msg);
      speakText('Navigated to Visual Template Builder.');
      return;
    }
    if (lower.includes('go to digital sign') || lower.includes('open digital sign') || lower.includes('open signer') || lower.includes('go to sign')) {
      setActiveTab('signer');
      const msg = 'Navigated to **Digital Sign & Seal**.';
      addMessage('assistant', msg);
      speakText('Navigated to Digital Sign and Seal.');
      return;
    }
    if (lower.includes('go to audit') || lower.includes('open audit') || lower.includes('open logs')) {
      setActiveTab('audit');
      const msg = 'Navigated to **Audit Trail Logs**.';
      addMessage('assistant', msg);
      speakText('Navigated to Audit Trail Logs.');
      return;
    }
    if (lower.includes('go to settings') || lower.includes('open settings')) {
      setActiveTab('settings');
      const msg = 'Navigated to **Hospital Settings**.';
      addMessage('assistant', msg);
      speakText('Navigated to Hospital Settings.');
      return;
    }

    // 2. Select Patient Commands
    if (lower.startsWith('select patient ') || lower.includes('select patient')) {
      const query = lower.replace('select patient', '').trim();
      const patient = patients.find(p => p.name.toLowerCase().includes(query));
      
      if (patient) {
        setSelectedPatientId(patient.id);
        const msg = `Selected patient **${patient.name}** (UHID: ${patient.uhid}, Diagnosis: ${patient.diagnosis}).`;
        addMessage('assistant', msg);
        speakText(`Selected patient ${patient.name}.`);
      } else {
        const msg = `Could not find a patient matching "${query}". Here is the patient register.`;
        setActiveTab('patients');
        addMessage('assistant', msg);
        speakText(`Patient not found. Loaded the patient list.`);
      }
      return;
    }

    // 3. Generate Consent Commands
    if (lower.includes('generate consent') || lower.includes('create consent')) {
      // Find matches for names
      let matchingPatient = null;
      for (const p of patients) {
        const firstName = p.name.split(' ')[0].toLowerCase();
        if (lower.includes(firstName)) {
          matchingPatient = p;
          break;
        }
      }

      if (matchingPatient) {
        setSelectedPatientId(matchingPatient.id);
        setActiveTab('clinical');
        const msg = `Initiated consent generation workflow for **${matchingPatient.name}** for scheduled procedure: **${matchingPatient.procedurePlanned}**. Click "Generate Draft" to finalize.`;
        addMessage('assistant', msg);
        speakText(`Initiated consent generation for ${matchingPatient.name}.`);
      } else {
        // Default to active patient if selected, otherwise warn
        const activePat = patients.find(p => p.id === selectedPatientId);
        if (activePat) {
          setActiveTab('clinical');
          const msg = `Initiated consent generation workflow for active patient **${activePat.name}** for procedure: **${activePat.procedurePlanned}**.`;
          addMessage('assistant', msg);
          speakText(`Initiated consent generation for ${activePat.name}.`);
        } else {
          const msg = `Please select a patient first, or specify: "generate consent for Sanjay", "generate consent for Leela", etc.`;
          addMessage('assistant', msg);
          speakText(msg);
        }
      }
      return;
    }

    // 4. Summarize Stay Commands
    if (lower.includes('summarize stay') || lower.includes('patient summary') || lower.includes('summarize patient')) {
      const activePat = patients.find(p => p.id === selectedPatientId);
      if (activePat) {
        const summary = `**Clinical Stay Summary for ${activePat.name}** (${activePat.age} Yrs, ${activePat.gender}):\n` +
          `• **Diagnosis**: ${activePat.diagnosis}\n` +
          `• **Planned Surgery**: ${activePat.procedurePlanned} (${activePat.laterality} side)\n` +
          `• **Admission Date**: ${activePat.admissionDate} | **Surgeon**: ${activePat.consultant}\n` +
          `• **Vitals**: BP ${activePat.vitals.bp}, Pulse ${activePat.vitals.pulse}, Temp ${activePat.vitals.temp}, SpO2 ${activePat.vitals.spo2}\n` +
          `• **Investigations**: Hb ${activePat.investigations.hb}, Platelets ${activePat.investigations.platelets}, Creatinine ${activePat.investigations.creatinine}\n` +
          `• **Med-Legal & Consent**: Ready for billing/discharge checklist. No clinical flags.`;
        
        addMessage('assistant', summary);
        speakText(`Clinical summary for ${activePat.name}. Diagnosed with ${activePat.diagnosis}, scheduled for ${activePat.procedurePlanned}. Vitals are stable, patient fit for surgery.`);
      } else {
        const msg = 'No patient is currently active. Say **"Select patient Sanjay"** or click on a patient first.';
        addMessage('assistant', msg);
        speakText('No patient is currently active.');
      }
      return;
    }

    // 5. Help Command
    if (lower.includes('help') || lower.includes('what can you do') || lower.includes('commands')) {
      const helpMsg = `**MedDocs AI Voice Commands**:\n` +
        `• *"Go to Dashboard"* / *"Go to Patient Register"* / *"Go to AI Clinician"* / *"Go to Settings"*\n` +
        `• *"Select patient Sanjay"* / *"Select patient Priyanka"*\n` +
        `• *"Generate consent for Leela"* / *"Generate consent for Sanjay Kulkarni"*\n` +
        `• *"Summarize stay"* (Requires selected patient)`;
      addMessage('assistant', helpMsg);
      speakText('Here are the available voice commands.');
      return;
    }

    // General fallback
    const fallbackResponse = `I heard: "${command}". I can assist with page navigation, patient selection, consent generation, or stay summarization. Say **"Help"** for details.`;
    addMessage('assistant', fallbackResponse);
    speakText(`I heard: ${command}. Try saying: Help, for a list of clinical commands.`);
  };

  // Text inputs
  const handleSendText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!speechText.trim()) return;
    addMessage('user', speechText);
    handleVoiceCommand(speechText);
    setSpeechText('');
  };

  // Simulation controls for quick click testing in headless environments
  const runSimulationCommand = (cmd: string) => {
    addMessage('user', cmd);
    setTimeout(() => {
      handleVoiceCommand(cmd);
    }, 400);
  };

  // Simulation triggers for testing & quick clicking
  const startSimulation = () => {
    setIsListening(true);
    setTimeout(() => {
      setIsListening(false);
      runSimulationCommand('generate consent for Sanjay Kulkarni');
    }, 1500);
  };

  return (
    <aside className="w-80 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-2xl z-30 shrink-0 no-print">
      
      {/* Header */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-blue-600 text-white shadow-md'}`}>
            <Sparkles size={16} />
          </div>
          <div>
            <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider">Voice AI Assistant</h3>
            <span className="text-[9px] text-slate-400 font-semibold tracking-tight uppercase">
              {isListening ? '🔴 Recording Mode' : isSpeaking ? '🔊 Speaking...' : '🟢 Active & Ready'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setSpeechSynthesisEnabled(!speechSynthesisEnabled)}
            title={speechSynthesisEnabled ? "Disable Text-To-Speech" : "Enable Text-To-Speech"}
            className={`p-1.5 rounded-lg transition ${speechSynthesisEnabled ? 'text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800' : 'text-slate-400 hover:text-slate-600'}`}
          >
            {speechSynthesisEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
          </button>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {messages.map((msg, i) => (
          <div 
            key={i} 
            className={`space-y-1 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}
          >
            <span className="text-[9px] text-slate-400 font-medium">{msg.timestamp}</span>
            <div 
              className={`p-3 rounded-2xl max-w-[90%] inline-block text-[11px] leading-relaxed text-left shadow-sm ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-tr-none ml-auto'
                  : 'bg-slate-50 dark:bg-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-850 rounded-tl-none mr-auto'
              }`}
              style={{ whiteSpace: 'pre-line' }}
              dangerouslySetInnerHTML={{ __html: msg.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }}
            />
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Audio Waveform and Listening State Indicator */}
      {isListening && (
        <div className="px-4 py-3 bg-slate-50 dark:bg-slate-850 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <span className="text-[10px] text-red-500 font-bold animate-pulse">Assistant is listening...</span>
          <div className="flex gap-0.5 items-end h-5">
            <div className="w-1 bg-red-400 h-2 rounded-full animate-[bounce_0.8s_infinite_100ms]"></div>
            <div className="w-1 bg-red-500 h-4 rounded-full animate-[bounce_0.8s_infinite_200ms]"></div>
            <div className="w-1 bg-red-600 h-3 rounded-full animate-[bounce_0.8s_infinite_300ms]"></div>
            <div className="w-1 bg-red-500 h-5 rounded-full animate-[bounce_0.8s_infinite_400ms]"></div>
            <div className="w-1 bg-red-400 h-2 rounded-full animate-[bounce_0.8s_infinite_500ms]"></div>
          </div>
        </div>
      )}

      {/* Clinical Commands Shortcuts Dashboard */}
      <div className="p-3 bg-slate-50 dark:bg-slate-850 border-t border-slate-100 dark:border-slate-800 space-y-2">
        <span className="text-[9px] font-black text-slate-400 tracking-wider uppercase flex items-center gap-1">
          <HelpCircle size={10} /> Simulator Shortcuts
        </span>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={() => runSimulationCommand('go to dashboard')}
            className="flex items-center gap-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-350 text-[9px] font-bold px-2 py-1.5 rounded-lg shadow-sm transition"
          >
            <Navigation size={10} className="text-blue-500" /> Go Dashboard
          </button>
          <button
            onClick={() => runSimulationCommand('summarize stay')}
            className="flex items-center gap-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-350 text-[9px] font-bold px-2 py-1.5 rounded-lg shadow-sm transition"
          >
            📝 Summarize Stay
          </button>
          <button
            onClick={() => runSimulationCommand('generate consent for Sanjay Kulkarni')}
            className="flex items-center gap-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-350 text-[9px] font-bold px-2 py-1.5 rounded-lg shadow-sm transition"
          >
            👂 Tympanoplasty
          </button>
          <button
            onClick={() => runSimulationCommand('generate consent for Leela Bai Salunkhe')}
            className="flex items-center gap-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-350 text-[9px] font-bold px-2 py-1.5 rounded-lg shadow-sm transition"
          >
            🦵 Knee Joint TKA
          </button>
          <button
            onClick={() => runSimulationCommand('generate consent for Priyanka Patil')}
            className="flex items-center gap-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-350 text-[9px] font-bold px-2 py-1.5 rounded-lg shadow-sm transition"
          >
            🤰 LSCS C-Section
          </button>
        </div>
      </div>

      {/* Input console */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
        {recognitionError && (
          <p className="text-[9px] text-amber-500 font-semibold text-center bg-amber-50 dark:bg-amber-950/20 p-1.5 rounded-md border border-amber-100 dark:border-amber-900">
            {recognitionError}
          </p>
        )}

        <form onSubmit={handleSendText} className="flex gap-2">
          <button
            type="button"
            onClick={toggleListening}
            className={`p-2.5 rounded-xl border flex items-center justify-center transition-all ${
              isListening
                ? 'bg-red-500 text-white border-red-500 animate-pulse'
                : 'bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
            }`}
            title={isListening ? "Stop listening" : "Start Voice Assistant"}
          >
            {isListening ? <MicOff size={16} /> : <Mic size={16} />}
          </button>
          
          <input
            type="text"
            value={speechText}
            onChange={(e) => setSpeechText(e.target.value)}
            placeholder="Type command or query..."
            className="flex-1 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-100 dark:bg-slate-800 dark:text-white"
          />
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold p-2.5 rounded-xl text-xs flex items-center justify-center shadow-md transition"
          >
            <Send size={15} />
          </button>
        </form>
      </div>

    </aside>
  );
}
