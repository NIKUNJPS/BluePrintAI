import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import { STEEL_INTAKE_SYSTEM_PROMPT, CHAT_SYSTEM_PROMPT } from "../constants";
import { Attachment } from "../types";

const ai = new GoogleGenAI({
  apiKey: import.meta.env.VITE_API_KEY
});
/**
 * Helper to construct content parts
 */
const createContentParts = (text: string, attachments: Attachment[]) => {
  const parts: any[] = [];

  if (text) {
    parts.push({ text });
  }

  attachments.forEach((att) => {
    parts.push({
      inlineData: {
        mimeType: att.mimeType,
        data: att.data, // must be base64
      },
    });
  });

  return parts;
};

/**
 * Deep Intake Analysis
 * Uses Gemini 3 Pro with large thinking budget
 */
export const runDeepIntakeAnalysis = async (
  inputData: string,
  attachments: Attachment[] = [],
  systemInstruction: string = STEEL_INTAKE_SYSTEM_PROMPT
): Promise<string> => {
  try {
    const parts = createContentParts(inputData, attachments);

    if (parts.length === 0) {
      throw new Error("No input provided (text or files).");
    }

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",

      contents: [
        {
          role: "user",
          parts: parts,
        },
      ],

      config: {
        thinkingConfig: {
          thinkingBudget: 32768,
        },

        systemInstruction: systemInstruction,
      },
    });

    return response.text || "No analysis generated.";
  } catch (error: any) {
    console.error("Deep Intake Analysis Error:", error);
    throw new Error(error.message || "Failed to complete deep analysis.");
  }
};

/**
 * Quick Scan
 * Uses Gemini 2.5 Flash Lite for ultra fast analysis
 */
export const runQuickScan = async (
  inputData: string,
  attachments: Attachment[] = []
): Promise<string> => {
  try {
    const scanInstruction = `
Perform a fast scan of the provided steel project data.

Identify:
• Project name
• Estimated total tonnage (rough guess)
• Any critical missing information (example: missing column schedule)

Return the result in very short bullet points.
`;

    const parts: any[] = [];

    parts.push({ text: scanInstruction });

    if (inputData) {
      parts.push({
        text: `\nPROJECT DATA:\n${inputData}`,
      });
    }

    attachments.forEach((att) => {
      parts.push({
        inlineData: {
          mimeType: att.mimeType,
          data: att.data,
        },
      });
    });

    if (parts.length === 0) {
      throw new Error("No input provided.");
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite",

      contents: [
        {
          role: "user",
          parts: parts,
        },
      ],
    });

    return response.text || "No scan results.";
  } catch (error: any) {
    console.error("Quick Scan Error:", error);
    throw new Error(error.message || "Failed to complete quick scan.");
  }
};

/**
 * Chat Service
 * Multi-turn conversation using Gemini 3 Pro
 */
export class ChatService {
  private chat: Chat;

  constructor() {
    this.chat = ai.chats.create({
      model: "gemini-3-pro-preview",

      config: {
        systemInstruction: CHAT_SYSTEM_PROMPT,
      },
    });
  }

  async sendMessage(
    message: string,
    attachments: Attachment[] = []
  ): Promise<string> {
    try {
      let msgContent: any = message;

      if (attachments.length > 0) {
        msgContent = createContentParts(message, attachments);
      }

      const response: GenerateContentResponse = await this.chat.sendMessage({
        message: msgContent,
      });

      return response.text || "";
    } catch (error: any) {
      console.error("Chat Error:", error);
      throw new Error(error.message || "Failed to send message.");
    }
  }
}