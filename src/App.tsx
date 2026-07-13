import { useState } from 'react';
import { useApp } from './context/AppContext';
import { Dashboard } from './components/Dashboard';
import { PatientRegistration } from './components/PatientRegistration';
import { AIClinicalGenerator } from './components/AIClinicalGenerator';
import { TemplateBuilder } from './components/TemplateBuilder';
import { DigitalSigner } from './components/DigitalSigner';
import { AuditTrail } from './components/AuditTrail';
import { HospitalSettings } from './components/HospitalSettings';
import { VoiceChatAssistant } from './components/VoiceChatAssistant';
import type { UserRole } from './types';

// Icons
import {
  LayoutDashboard,
  UserCheck,
  BrainCircuit,
  Settings,
  ShieldCheck,
  Sliders,
  Signature,
  Bell,
  Sun,
  Moon,
  MessageSquareCode,
  Mic,
  ChevronLeft,
  ChevronRight,
  Wifi
} from 'lucide-react';

function App() {
  const {
    hospitals,
    currentHospital,
    setCurrentHospital,
    currentUser,
    setCurrentUserRole,
    theme,
    setTheme,
    notifications,
    markNotificationAsRead,
    doctors,
    currentDoctor,
    setCurrentDoctor
  } = useApp();

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  
  // App states
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isOffline, setIsOffline] = useState(false);


  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'patients', label: 'Patient Register', icon: UserCheck },
    { id: 'clinical', label: 'AI Clinician Generator', icon: BrainCircuit },
    { id: 'builder', label: 'Visual Template Builder', icon: Sliders },
    { id: 'signer', label: 'Digital Sign & Seal', icon: Signature },
    { id: 'audit', label: 'Audit Trail Logs', icon: ShieldCheck },
    { id: 'settings', label: 'Hospital settings', icon: Settings }
  ];

  return (
    <div className={`min-h-screen flex text-slate-800 bg-slate-50 dark:bg-slate-950 dark:text-slate-100 font-sans`}>
      
      {/* Sidebar navigation */}
      <aside 
        className={`bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 flex flex-col justify-between shrink-0 no-print ${
          isSidebarOpen ? 'w-64' : 'w-20'
        }`}
      >
        <div className="space-y-6 py-5">
          {/* Logo brand */}
          <div className="px-5 flex items-center justify-between">
            {isSidebarOpen ? (
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white font-extrabold text-xs tracking-wider flex items-center gap-1 shadow-glow-blue">
                  <BrainCircuit size={15} /> MedDocs
                </div>
                <span className="font-extrabold text-sm tracking-tight text-slate-800 dark:text-white uppercase">AI Portal</span>
              </div>
            ) : (
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center font-bold shadow-glow-blue">
                M
              </div>
            )}
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {isSidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="px-3 space-y-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-bold transition-all relative ${
                    isActive 
                      ? 'text-white shadow-md' 
                      : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-800 dark:hover:text-white'
                  }`}
                  style={{
                    backgroundColor: isActive ? currentHospital.colors.primary : 'transparent'
                  }}
                >
                  <Icon size={18} className={isActive ? 'text-white' : 'text-slate-400'} />
                  {isSidebarOpen && <span>{item.label}</span>}
                  
                  {/* Warning Dot for Signatures tab */}
                  {item.id === 'signer' && notifications.some(n => !n.read && n.title === 'Signature Pending') && (
                    <span className="absolute right-3 top-3 w-2 h-2 rounded-full bg-amber-500 ring-4 ring-amber-100"></span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Card info footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <img 
              src={currentUser.avatar} 
              alt={currentUser.name} 
              className="w-9 h-9 rounded-full border-2 border-white dark:border-slate-800 shadow"
            />
            {isSidebarOpen && (
              <div className="text-left">
                <div className="font-bold text-xs text-slate-800 dark:text-white">{currentUser.name}</div>
                <div className="text-[10px] text-slate-400 font-semibold">{currentUser.role}</div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main content body panel */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Header toolbar */}
        <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 py-3.5 px-6 flex justify-between items-center no-print">
          
          {/* Tenant Switcher & Network status */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xl">{currentHospital.logo}</span>
              <select
                value={currentHospital.id}
                onChange={(e) => {
                  const hosp = hospitals.find(h => h.id === e.target.value);
                  if (hosp) setCurrentHospital(hosp);
                }}
                className="font-bold text-sm bg-transparent border-0 outline-none text-slate-700 dark:text-white cursor-pointer pr-5"
              >
                {hospitals.map(h => (
                  <option key={h.id} value={h.id}>{h.name}</option>
                ))}
              </select>
            </div>
            
            {/* Sync status / Offline toggler */}
            <button
              onClick={() => {
                setIsOffline(!isOffline);
                alert(isOffline ? "Online Mode: Local database synchronized with hospital Cloud server." : "Offline Mode: Changes will be stored in local browser cache.");
              }}
              className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold flex items-center gap-1.5 transition-all ${
                isOffline 
                  ? 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400' 
                  : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
              }`}
            >
              <Wifi size={12} className={isOffline ? 'text-slate-400' : 'text-emerald-500'} />
              {isOffline ? 'Offline Cache Only' : 'Cloud Synchronized'}
            </button>
          </div>

          {/* Controls toolbar */}
          <div className="flex items-center gap-4">
            {/* Voice Assistant Toggler */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setIsChatOpen(!isChatOpen)}
                className={`p-2 rounded-xl border flex items-center gap-1.5 text-xs font-bold transition-all ${
                  isChatOpen
                    ? 'bg-blue-50 text-blue-600 border-blue-200 shadow-sm'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'
                }`}
                title="Toggle Voice Assistant Drawer"
              >
                <Mic size={14} className={isChatOpen ? 'text-blue-600 animate-pulse' : 'text-slate-400'} />
                AI Voice Assistant
              </button>
            </div>

            {/* Clinician Active Login Switcher */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Clinician</span>
              <select
                value={currentDoctor?.id || ''}
                onChange={(e) => {
                  const doc = doctors.find(d => d.id === e.target.value);
                  if (doc) setCurrentDoctor(doc);
                }}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-bold outline-none text-slate-600 dark:text-slate-300 font-semibold"
              >
                {doctors.map(doc => (
                  <option key={doc.id} value={doc.id}>{doc.name}</option>
                ))}
              </select>
            </div>

            {/* User Role Selector */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Role</span>
              <select
                value={currentUser.role}
                onChange={(e) => setCurrentUserRole(e.target.value as UserRole)}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-bold outline-none text-slate-600 dark:text-slate-300"
              >
                <option>Super Admin</option>
                <option>Hospital Admin</option>
                <option>Consultant</option>
                <option>Resident</option>
                <option>Medical Officer</option>
                <option>Nurse</option>
                <option>Receptionist</option>
                <option>Viewer</option>
              </select>
            </div>

            {/* Notifications Bell */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors relative"
              >
                <Bell size={16} />
                {notifications.some(n => !n.read) && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-600 ring-4 ring-blue-100"></span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 p-4 space-y-3">
                  <div className="flex justify-between items-center border-b pb-2 border-slate-100 dark:border-slate-800">
                    <h4 className="text-xs font-bold text-slate-800 dark:text-white">Active Alerts</h4>
                    <span className="text-[9px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-extrabold uppercase">
                      {notifications.filter(n => !n.read).length} Unread
                    </span>
                  </div>
                  <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                    {notifications.map(notif => (
                      <div 
                        key={notif.id} 
                        onClick={() => markNotificationAsRead(notif.id)}
                        className={`p-2.5 rounded-xl border text-[11px] leading-normal transition-colors cursor-pointer ${
                          notif.read 
                            ? 'bg-slate-50/50 border-slate-100 text-slate-400' 
                            : 'bg-blue-50/40 border-blue-100 text-slate-700 dark:bg-blue-950/20 dark:border-blue-900/40 dark:text-slate-200'
                        }`}
                      >
                        <div className="font-bold flex justify-between">
                          <span>{notif.title}</span>
                          {!notif.read && <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>}
                        </div>
                        <p className="mt-0.5 text-slate-500 dark:text-slate-400">{notif.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Theme Toggle */}
            <button
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
            >
              {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
            </button>

            {/* AI Assistant toggle */}
            <button
              onClick={() => setIsChatOpen(!isChatOpen)}
              className={`p-2 rounded-xl flex items-center gap-1 text-xs font-bold transition-all ${
                isChatOpen 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-950/30 dark:text-blue-400'
              }`}
            >
              <MessageSquareCode size={16} />
              AI brain
            </button>
          </div>

        </header>

        {/* Scrollable Workspace Content Area */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-6xl mx-auto">
            {activeTab === 'dashboard' && (
              <Dashboard 
                setActiveTab={setActiveTab} 
                setSelectedPatientId={setSelectedPatientId} 
              />
            )}
            {activeTab === 'patients' && (
              <PatientRegistration 
                setActiveTab={setActiveTab} 
                setSelectedPatientId={setSelectedPatientId} 
              />
            )}
            {activeTab === 'clinical' && (
              <AIClinicalGenerator
                activePatientId={selectedPatientId}
                setSelectedPatientId={setSelectedPatientId}
                setActiveTab={setActiveTab}
                setSelectedDocId={setSelectedDocId}
              />
            )}
            {activeTab === 'builder' && <TemplateBuilder />}
            {activeTab === 'signer' && (
              <DigitalSigner 
                selectedDocId={selectedDocId} 
                setSelectedDocId={setSelectedDocId} 
              />
            )}
            {activeTab === 'audit' && <AuditTrail />}
            {activeTab === 'settings' && <HospitalSettings />}
          </div>
        </main>
      </div>

      {/* AI Assistant Chat Sidebar Drawer */}
      {isChatOpen && (
        <VoiceChatAssistant
          onClose={() => setIsChatOpen(false)}
          setActiveTab={setActiveTab}
          selectedPatientId={selectedPatientId}
          setSelectedPatientId={setSelectedPatientId}
        />
      )}

    </div>
  );
}

export default App;
