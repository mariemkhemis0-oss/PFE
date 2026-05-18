import { GoogleGenAI, Type } from "@google/genai";
import { Vulnerability } from "../../frontend/types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Helper function to implement exponential backoff for API calls.
 */
async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      // Handle 429 Resource Exhausted or generic rate limiting messages
      const isRateLimited = 
        error?.status === 429 || 
        error?.message?.includes('429') || 
        error?.message?.includes('quota') ||
        error?.message?.includes('RESOURCE_EXHAUSTED');

      if (isRateLimited && i < maxRetries - 1) {
        const delay = Math.pow(2, i) * 2000 + Math.random() * 1000;
        console.warn(`[AI SERVICE] Quota exceeded. Retrying in ${Math.round(delay)}ms... (Attempt ${i + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

export const analyzeVulnerabilities = async (vulns: Vulnerability[]) => {
  return withRetry(async () => {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Analyze these security vulnerabilities and provide intelligent prioritization and remediation strategies. 
      Vulnerabilities: ${JSON.stringify(vulns)}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              aiPriority: { type: Type.NUMBER, description: "Priority score from 0-100" },
              aiJustification: { type: Type.STRING, description: "Why this priority was assigned" },
              remediationAction: { type: Type.STRING },
              complexity: { type: Type.STRING, description: "Low, Medium, or High" },
              estimatedTime: { type: Type.STRING, description: "e.g. 2 hours, 1 day" }
            },
            required: ["id", "aiPriority", "aiJustification", "remediationAction", "complexity", "estimatedTime"]
          }
        }
      }
    });

    try {
      const resultText = response.text;
      if (!resultText) return [];
      return JSON.parse(resultText);
    } catch (e) {
      console.error("[AI SERVICE] Failed to parse JSON response", e);
      return [];
    }
  }).catch(err => {
    console.error("[AI SERVICE] analyzeVulnerabilities failed after retries:", err);
    return [];
  });
};

export const generateExecutiveSummary = async (data: any) => {
  return withRetry(async () => {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Write a professional executive summary for a security audit report. 
      Context: Total Vulns: ${data.total}, Critical: ${data.critical}, Overall Grade: ${data.grade}. 
      Make it clear, non-technical, and business-focused. Include objectives and a general conclusion.`,
    });
    return response.text || "Executive summary currently unavailable due to system load.";
  }).catch(err => {
    console.error("[AI SERVICE] generateExecutiveSummary failed after retries:", err);
    return "Le service d'analyse IA est temporairement indisponible (quota atteint). Veuillez réessayer plus tard.";
  });
};