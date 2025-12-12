import { AnalysisResult, RiskLevel } from "../types";

const BASE_URL = process.env.REACT_APP_SENTINEL_API || "http://localhost:8000";

export const analyzeInput = async (text: string): Promise<AnalysisResult> => {
  try {
    const res = await fetch(`${BASE_URL}/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: text })
    });
    if (!res.ok) throw new Error(`Analyze failed: ${res.status} ${res.statusText}`);
    const data = await res.json();
    // Normalize to AnalysisResult interface expected by frontend
    return {
      riskScore: data.risk === "HIGH" ? 90 : data.risk === "MEDIUM" ? 60 : 10,
      riskLevel: data.risk as RiskLevel,
      categories: (data.entities || []).map((e: any) => e.label || e),
      detectedEntities: (data.entities || []).map((e: any) => e.text || e),
      redactedText: data.redacted_prompt || data.redactedText || text,
      originalText: data.original || text,
      timestamp: Date.now()
    };
  } catch (err) {
    console.error("analyzeInput error", err);
    return {
      riskScore: 100,
      riskLevel: RiskLevel.CRITICAL,
      categories: ["SYSTEM_ERROR"],
      detectedEntities: [],
      redactedText: "System Error: Unable to verify safety.",
      originalText: text,
      timestamp: Date.now()
    };
  }
};

export const generateSafeResponse = async (inputText: string, systemInstruction?: string): Promise<string> => {
  try {
    const res = await fetch(`${BASE_URL}/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: inputText })
    });
    if (!res.ok) throw new Error(`Generate failed: ${res.status} ${res.statusText}`);
    const data = await res.json();
    return data.output || data.safe_response || "No response generated.";
  } catch (err) {
    console.error("generateSafeResponse error", err);
    return "I apologize, but I cannot process that request at this time.";
  }
};
