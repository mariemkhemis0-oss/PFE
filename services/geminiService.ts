
import { GoogleGenAI, Type } from "@google/genai";
import { Vulnerability } from "../types";

// Initialize GoogleGenAI once using the API_KEY from the environment.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeVulnerabilities = async (vulns: Vulnerability[]) => {
  // Fixed: Upgraded to 'gemini-3-pro-preview' as vulnerability analysis is a complex text task involving reasoning and coding knowledge.
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
    // Fixed: Accessed text property safely and handled potential undefined return.
    const resultText = response.text;
    if (!resultText) return [];
    return JSON.parse(resultText);
  } catch (e) {
    console.error("Failed to parse AI response", e);
    return [];
  }
};

export const generateExecutiveSummary = async (data: any) => {
  // Fixed: Using 'gemini-3-flash-preview' for the basic text task of summarization.
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Write a professional executive summary for a security audit report. 
    Context: Total Vulns: ${data.total}, Critical: ${data.critical}, Overall Grade: ${data.grade}. 
    Make it clear, non-technical, and business-focused. Include objectives and a general conclusion.`,
  });
  // Fixed: Directly access the .text property as defined in the Google GenAI SDK.
  return response.text || "Executive summary unavailable.";
};
