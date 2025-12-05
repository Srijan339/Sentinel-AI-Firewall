import React, { useState } from 'react';
import { LayoutDashboard, MessageSquare, Settings, FileText, Shield } from 'lucide-react';
import ChatInterface from './components/ChatInterface';
import Dashboard from './components/Dashboard';
import { PolicyConfig, RiskLevel, PolicyAction, LogEntry } from './types';
import { DEFAULT_POLICY, MOCK_LOGS } from './constants';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'dashboard' | 'chat' | 'logs'>('chat');
  const [policy, setPolicy] = useState<PolicyConfig>(DEFAULT_POLICY);
  const [logs, setLogs] = useState<LogEntry[]>(MOCK_LOGS);

  const addLog = (log: LogEntry) => {
    setLogs(prev => [log, ...prev]);
  };

  return (
    <div className="flex h-screen w-screen bg-slate-950 text-slate-100 font-sans selection:bg-primary-500/30">
      
      {/* Sidebar */}
      <div className="w-20 lg:w-64 flex-shrink-0 border-r border-slate-800 bg-slate-900 flex flex-col">
        <div className="h-16 flex items-center justify-center lg:justify-start lg:px-6 border-b border-slate-800">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center shadow-lg shadow-primary-500/20">
            <Shield className="text-white" size={20} />
          </div>
          <span className="ml-3 font-bold text-lg tracking-tight hidden lg:block">Sentinel-AI</span>
        </div>

        <nav className="flex-1 p-4 space-y-2">
            <button 
                onClick={() => setCurrentView('chat')}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${currentView === 'chat' ? 'bg-primary-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
            >
                <MessageSquare size={20} />
                <span className="hidden lg:block font-medium">Live Simulator</span>
            </button>
            <button 
                onClick={() => setCurrentView('dashboard')}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${currentView === 'dashboard' ? 'bg-primary-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
            >
                <LayoutDashboard size={20} />
                <span className="hidden lg:block font-medium">Overview</span>
            </button>
            <button 
                onClick={() => setCurrentView('logs')}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${currentView === 'logs' ? 'bg-primary-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
            >
                <FileText size={20} />
                <span className="hidden lg:block font-medium">Audit Logs</span>
            </button>
        </nav>

        <div className="p-4 border-t border-slate-800">
            <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-success animate-pulse"></div>
                    <span className="text-xs font-mono text-slate-400">POLICY ENGINE</span>
                </div>
                <div className="text-xs text-slate-500">
                    Mode: <span className="text-primary-400 font-semibold">{policy.defaultAction}</span>
                </div>
                 <div className="text-xs text-slate-500">
                    Threshold: <span className="text-warning font-semibold">{policy.actionThreshold}</span>
                </div>
            </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 h-full overflow-hidden bg-slate-950 relative">
        {currentView === 'dashboard' && <Dashboard />}
        {currentView === 'chat' && (
            <ChatInterface policy={policy} addLog={addLog} />
        )}
        {currentView === 'logs' && (
             <div className="p-8 h-full overflow-y-auto">
                <h1 className="text-3xl font-bold text-slate-100 mb-6">Audit Logs</h1>
                <div className="rounded-2xl border border-slate-800 overflow-hidden bg-slate-900">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-800/50 border-b border-slate-800">
                            <tr>
                                <th className="p-4 text-xs font-mono text-slate-400 uppercase">Timestamp</th>
                                <th className="p-4 text-xs font-mono text-slate-400 uppercase">Risk Level</th>
                                <th className="p-4 text-xs font-mono text-slate-400 uppercase">Action</th>
                                <th className="p-4 text-xs font-mono text-slate-400 uppercase">Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {logs.map((log) => (
                                <tr key={log.id} className="hover:bg-slate-800/50 transition-colors">
                                    <td className="p-4 text-sm font-mono text-slate-400">{log.timestamp}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                                            log.riskLevel === RiskLevel.SAFE ? 'bg-success/10 text-success' :
                                            log.riskLevel === RiskLevel.CRITICAL || log.riskLevel === RiskLevel.HIGH ? 'bg-danger/10 text-danger' :
                                            'bg-warning/10 text-warning'
                                        }`}>
                                            {log.riskLevel}
                                        </span>
                                    </td>
                                    <td className="p-4 text-sm text-slate-300">{log.actionTaken}</td>
                                    <td className="p-4 text-sm text-slate-500">{log.details}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
             </div>
        )}
      </div>

      {/* API Key Modal (mock, assuming env var but good for completeness in logic thought process - skipping for now as strict rules say no user input for key) */}
    </div>
  );
};

export default App;
