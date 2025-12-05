export enum RiskLevel {
  SAFE = 'SAFE',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export enum PolicyAction {
  ALLOW = 'ALLOW',
  REDACT = 'REDACT',
  BLOCK = 'BLOCK'
}

export interface AnalysisResult {
  riskScore: number; // 0-100
  riskLevel: RiskLevel;
  categories: string[]; // e.g., "PHI", "PII", "Financial"
  detectedEntities: string[];
  redactedText: string;
  originalText: string;
  timestamp: number;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  originalContent?: string; // If redacted
  analysis?: AnalysisResult; // For user messages
  isBlocked?: boolean;
}

export interface PolicyConfig {
  blockPhi: boolean;
  blockPii: boolean;
  blockFinancial: boolean;
  actionThreshold: RiskLevel; // Minimum level to trigger action
  defaultAction: PolicyAction;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  riskLevel: RiskLevel;
  actionTaken: PolicyAction;
  details: string;
}
