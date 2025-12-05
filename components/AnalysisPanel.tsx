import React from 'react';
import { AnalysisResult, RiskLevel } from '../types';
import { ShieldCheck, ShieldAlert, AlertTriangle, FileText, Lock } from 'lucide-react';

interface AnalysisPanelProps {
  analysis: AnalysisResult | null;
  loading: boolean;
}

const AnalysisPanel: React.FC<AnalysisPanelProps> = ({ analysis, loading }) => {
  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 border-l border-slate-800 bg-slate-900/50">
        <div className="relative w-16 h-16 mb-4">
          <div className="absolute inset-0 border-4 border-slate-700 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-t-primary-500 rounded-full animate-spin"></div>
          <ShieldCheck className="absolute inset-0 m-auto text-primary-500 w-6 h-6 animate-pulse" />
        </div>
        <p className="animate-pulse font-mono text-sm">SENTINEL ENGINE RUNNING...</p>
        <p className="text-xs text-slate-500 mt-2">Scanning for PII, PHI, and Financial patterns</p>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-500 p-8 border-l border-slate-800 bg-slate-900/50">
        <ShieldCheck className="w-16 h-16 mb-4 opacity-20" />
        <p className="text-sm font-mono text-center">Awaiting Input Stream...</p>
      </div>
    );
  }

  const isSafe = analysis.riskLevel === RiskLevel.SAFE || analysis.riskLevel === RiskLevel.LOW;
  const isCritical = analysis.riskLevel === RiskLevel.HIGH || analysis.riskLevel === RiskLevel.CRITICAL;

  const scoreColor = isSafe ? 'text-success' : isCritical ? 'text-danger' : 'text-warning';
  const borderColor = isSafe ? 'border-success' : isCritical ? 'border-danger' : 'border-warning';
  const bgBadge = isSafe ? 'bg-success/10 text-success' : isCritical ? 'bg-danger/10 text-danger' : 'bg-warning/10 text-warning';

  return (
    <div className="h-full flex flex-col p-6 border-l border-slate-800 bg-slate-900 overflow-y-auto">
      <div className="mb-6 pb-6 border-b border-slate-800">
        <h2 className="text-slate-100 font-bold flex items-center gap-2 mb-1">
          <ShieldCheck className="w-5 h-5 text-primary-500" />
          Sentinel Analysis Report
        </h2>
        <p className="text-xs text-slate-500 font-mono">ID: {analysis.timestamp}</p>
      </div>

      <div className="space-y-6">
        {/* Risk Score */}
        <div className={`p-4 rounded-lg border ${borderColor} bg-opacity-5 bg-slate-800 relative overflow-hidden`}>
          <div className="absolute top-0 right-0 p-4 opacity-10">
            {isSafe ? <ShieldCheck size={64} /> : <ShieldAlert size={64} />}
          </div>
          <div className="relative z-10">
            <p className="text-slate-400 text-xs font-mono uppercase tracking-wider mb-1">Risk Score</p>
            <div className="flex items-end gap-2">
              <span className={`text-4xl font-mono font-bold ${scoreColor}`}>{analysis.riskScore}</span>
              <span className={`text-sm font-bold px-2 py-1 rounded mb-1 ${bgBadge}`}>
                {analysis.riskLevel}
              </span>
            </div>
          </div>
        </div>

        {/* Categories */}
        <div>
          <p className="text-slate-400 text-xs font-mono uppercase tracking-wider mb-3">Detected Vectors</p>
          <div className="flex flex-wrap gap-2">
            {analysis.categories.length > 0 ? (
              analysis.categories.map((cat, idx) => (
                <span key={idx} className="px-2 py-1 rounded-md bg-slate-800 border border-slate-700 text-xs text-slate-300 font-mono flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-warning" />
                  {cat}
                </span>
              ))
            ) : (
              <span className="text-sm text-slate-500 italic">No threats detected.</span>
            )}
          </div>
        </div>

        {/* Entities */}
        {analysis.detectedEntities.length > 0 && (
            <div>
            <p className="text-slate-400 text-xs font-mono uppercase tracking-wider mb-3">Flagged Entities</p>
            <div className="space-y-2">
                {analysis.detectedEntities.map((entity, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm p-2 rounded bg-slate-800/50">
                    <span className="text-slate-300 font-mono truncate">{entity}</span>
                    <Lock className="w-3 h-3 text-slate-500" />
                </div>
                ))}
            </div>
            </div>
        )}

        {/* Redaction Preview */}
        <div>
          <p className="text-slate-400 text-xs font-mono uppercase tracking-wider mb-3">Redaction Engine Output</p>
          <div className="p-3 rounded bg-slate-950 border border-slate-800 font-mono text-xs text-slate-400 leading-relaxed break-words whitespace-pre-wrap">
            {analysis.redactedText}
          </div>
        </div>
      </div>
      
      <div className="mt-auto pt-6 text-center">
         <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
            <div className={`w-2 h-2 rounded-full ${isSafe ? 'bg-success' : 'bg-danger'} animate-pulse`}></div>
            System Status: {isSafe ? 'PASS' : 'INTERVENTION ACTIVE'}
         </div>
      </div>
    </div>
  );
};

export default AnalysisPanel;
