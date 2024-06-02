import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { PromptTemplate } from "@langchain/core/prompts";
import { VC_SYSTEM_PROMPT_V1 } from "./utils/constants/systemPrompt.constants.js";
import dotenv from "dotenv";
dotenv.config();

const llm = new ChatGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
  temperature: 0.7,
  modelName: "gemini-1.5-pro",
  maxOutputTokens: 8192,
});

// If a template is passed in, the input variables are inferred automatically from the template.
const prompt = PromptTemplate.fromTemplate(VC_SYSTEM_PROMPT_V1);

export async function chatWithGemini(input: string) {
  // Batch and stream are also supported
  const result = await llm.invoke([
    ["system", VC_SYSTEM_PROMPT_V1],
    ["human", input],
  ]);
  return result.content;
}
