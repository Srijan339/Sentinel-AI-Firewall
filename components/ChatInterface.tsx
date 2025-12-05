import React, { useState, useRef, useEffect } from 'react';
import { Send, Terminal, Loader2, Bot, User, CheckCircle, Ban, Eraser, Bug, AlertTriangle } from 'lucide-react';
import { analyzeInput, generateSafeResponse } from '../services/sentinelService';
import { Message, PolicyConfig, PolicyAction, RiskLevel } from '../types';
import AnalysisPanel from './AnalysisPanel';

interface ChatInterfaceProps {
  policy: PolicyConfig;
  addLog: (log: any) => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ policy, addLog }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([{
    id: '0',
    role: 'assistant',
    content: 'Sentinel-AI firewall is active. All inputs are monitored for policy violations.'
  }]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentAnalysis, setCurrentAnalysis] = useState<any | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessageId = Date.now().toString();
    const originalInput = input;
    setInput('');
    setIsAnalyzing(true);
    setCurrentAnalysis(null);

    // 1. Optimistically add user message (grayed out or indicated as 'processing' visually if needed, but here we just add it)
    // Actually, let's wait to add it until we have the analysis to show the status icon immediately? 
    // No, standard chat UX is immediate.
    
    // We'll store a temporary placeholder
    const tempMessage: Message = {
        id: userMessageId,
        role: 'user',
        content: originalInput
    };
    setMessages(prev => [...prev, tempMessage]);

    // 2. Run Sentinel Analysis
    const analysis = await analyzeInput(originalInput);
    setCurrentAnalysis(analysis);
    
    // 3. Determine Policy Action
    let action = PolicyAction.ALLOW;
    
    // Simple logic based on risk level and configured threshold (simplified for demo)
    const riskValue = {
        [RiskLevel.SAFE]: 0,
        [RiskLevel.LOW]: 1,
        [RiskLevel.MEDIUM]: 2,
        [RiskLevel.HIGH]: 3,
        [RiskLevel.CRITICAL]: 4
    }[analysis.riskLevel];

    const thresholdValue = {
        [RiskLevel.SAFE]: 0,
        [RiskLevel.LOW]: 1,
        [RiskLevel.MEDIUM]: 2,
        [RiskLevel.HIGH]: 3,
        [RiskLevel.CRITICAL]: 4
    }[policy.actionThreshold];

    if (riskValue >= thresholdValue) {
        action = policy.defaultAction;
    }

    // Log the event
    addLog({
        id: Date.now().toString(),
        timestamp: new Date().toLocaleString(),
        riskLevel: analysis.riskLevel,
        actionTaken: action,
        details: analysis.categories.join(', ') || 'Routine'
    });

    // Update the user message with the analysis result
    setMessages(prev => prev.map(m => m.id === userMessageId ? { ...m, analysis, isBlocked: action === PolicyAction.BLOCK } : m));

    // 4. Handle Response
    if (action === PolicyAction.BLOCK) {
        setMessages(prev => [...prev, {
            id: (Date.now() + 1).toString(),
            role: 'system',
            content: `🚫 Request Blocked: The input violated safety policies (${analysis.categories.join(', ')}).`
        }]);
        setIsAnalyzing(false);
    } else {
        // Prepare prompt for LLM (Redacted or Original)
        const promptToSend = action === PolicyAction.REDACT ? analysis.redactedText : originalInput;
        
        // Show a "Bot typing..." indicator implicitly by isAnalyzing still being true?
        // Let's keep isAnalyzing true until the bot responds.

        const botResponseText = await generateSafeResponse(promptToSend);
        
        setMessages(prev => [...prev, {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: botResponseText
        }]);
        setIsAnalyzing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const populateMock = (text: string) => {
    setInput(text);
  };

  return (
    <div className="flex h-full w-full bg-slate-950 overflow-hidden">
        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                            msg.role === 'user' ? 'bg-slate-700' : msg.role === 'system' ? 'bg-danger text-white' : 'bg-primary-600'
                        }`}>
                            {msg.role === 'user' ? <User size={16} /> : msg.role === 'system' ? <Ban size={16} /> : <Bot size={16} />}
                        </div>
                        
                        <div className={`flex flex-col max-w-[80%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                            <div className={`p-4 rounded-2xl text-sm leading-relaxed ${
                                msg.role === 'user' 
                                    ? 'bg-slate-800 text-slate-100 rounded-tr-none' 
                                    : msg.role === 'system'
                                    ? 'bg-danger/10 border border-danger/20 text-danger rounded-tl-none'
                                    : 'bg-slate-900 border border-slate-800 text-slate-300 rounded-tl-none'
                            }`}>
                                {msg.content}
                            </div>
                            
                            {/* Metadata/Tags for User Messages */}
                            {msg.role === 'user' && msg.analysis && (
                                <div className="mt-2 flex gap-2">
                                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded border flex items-center gap-1
                                        ${msg.analysis.riskLevel === RiskLevel.SAFE ? 'bg-success/10 border-success/20 text-success' : 
                                          msg.analysis.riskLevel === RiskLevel.CRITICAL ? 'bg-danger/10 border-danger/20 text-danger' : 
                                          'bg-warning/10 border-warning/20 text-warning'}
                                    `}>
                                        {msg.analysis.riskLevel === RiskLevel.SAFE ? <CheckCircle size={10} /> : <AlertTriangle size={10} />}
                                        RISK: {msg.analysis.riskScore}
                                    </span>
                                    {msg.analysis.redactedText !== msg.analysis.originalText && (
                                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center gap-1">
                                            <Eraser size={10} />
                                            REDACTED
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                {isAnalyzing && (
                    <div className="flex gap-4">
                         <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center flex-shrink-0 animate-pulse">
                            <Bot size={16} className="text-slate-500" />
                        </div>
                        <div className="flex items-center gap-2 text-slate-500 text-sm">
                            <Loader2 className="animate-spin" size={16} />
                            <span className="font-mono">Processing security policies...</span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-slate-800 bg-slate-900/50 backdrop-blur-sm">
                <div className="max-w-4xl mx-auto flex gap-3">
                    <button 
                        onClick={() => populateMock("Check transaction history for user ID 8832-1122 with SSN 123-45-6789.")}
                        className="hidden md:flex items-center justify-center p-3 rounded-xl bg-slate-800 text-slate-400 hover:text-danger hover:bg-slate-700 transition-colors"
                        title="Inject Test Attack"
                    >
                        <Bug size={20} />
                    </button>
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Type a message to simulate user input..."
                            className="w-full bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 rounded-xl px-4 py-3 pr-12 focus:outline-none focus:border-primary-600 focus:ring-1 focus:ring-primary-600 transition-all font-mono text-sm"
                            disabled={isAnalyzing}
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2">
                            <Terminal size={16} className="text-slate-600" />
                        </div>
                    </div>
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || isAnalyzing}
                        className="bg-primary-600 hover:bg-primary-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-3 rounded-xl transition-all flex items-center gap-2 font-medium"
                    >
                        <Send size={18} />
                        <span className="hidden md:inline">Send</span>
                    </button>
                </div>
                <div className="max-w-4xl mx-auto mt-2 text-center">
                    <p className="text-[10px] text-slate-600 font-mono">
                        SECURE ENCLAVE ACTIVE • GEMINI 2.5 FLASH MONITORING
                    </p>
                </div>
            </div>
        </div>

        {/* Right Sidebar: Real-time Analysis */}
        <div className="w-80 hidden lg:block border-l border-slate-800">
            <AnalysisPanel analysis={currentAnalysis} loading={isAnalyzing && !currentAnalysis} />
        </div>
    </div>
  );
};

export default ChatInterface;