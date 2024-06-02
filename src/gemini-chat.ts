import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import { BaseMessage } from "@langchain/core/messages";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
import { createHistoryAwareRetriever } from "langchain/chains/history_aware_retriever";
import { createRetrievalChain } from "langchain/chains/retrieval";
import { selfQueryRetriever } from "./localVectorStore.js";
import dotenv from "dotenv";
import {
  VC_SYSTEM_PROMPT_V1,
  VC_SYSTEM_PROMPT_V2,
} from "./utils/constants/systemPrompt.constants.js";
dotenv.config();
// https://deadmanabir.hashnode.dev/building-a-chatbot-with-chat-history-using-langchain-jsts-a-step-by-step-guide

// TODO: Update Retrieiver with real prod vector DB eventually.
// For a MVP/POC - a local vector store is fine.
const retriever = selfQueryRetriever;

const llm = new ChatGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
  temperature: 0.7,
  modelName: "gemini-1.5-pro",
});

// Contextualize question
const contextualizeQSystemPrompt = `
Given a chat history and the latest user question
which might reference context in the chat history,
formulate a standalone question which can be understood
without the chat history. Do NOT answer the question, just
reformulate it if needed and otherwise return it as is.`;
const contextualizeQPrompt = ChatPromptTemplate.fromMessages([
  ["system", contextualizeQSystemPrompt],
  new MessagesPlaceholder("chat_history"),
  ["human", "{input}"],
]);
const historyAwareRetriever = await createHistoryAwareRetriever({
  llm,
  retriever,
  rephrasePrompt: contextualizeQPrompt,
});

const qaPrompt = ChatPromptTemplate.fromMessages([
  ["system", VC_SYSTEM_PROMPT_V2],
  new MessagesPlaceholder("chat_history"),
  ["human", "{input}"],
]);

// Below we use createStuffDocuments_chain to feed all retrieved context
// into the LLM. Note that we can also use StuffDocumentsChain and other
// instances of BaseCombineDocumentsChain.
const questionAnswerChain = await createStuffDocumentsChain({
  llm,
  prompt: qaPrompt,
});

const ragChain = await createRetrievalChain({
  retriever: historyAwareRetriever,
  combineDocsChain: questionAnswerChain,
});

// Usage:
const chat_history: BaseMessage[] = [];

export async function chatWithGeminiWithLocalGrounding(
  humanInput: string
): Promise<string> {
  try {
    const response = await ragChain.invoke({
      chat_history,
      input: humanInput,
    });
    return response.answer;
  } catch (error) {
    throw error;
  }
}

//? Test Example:
// const questionInput = "what is necto financials articles of incorporation?";
// const answer = await chatWithGeminiWithLocalGrounding(questionInput);
// console.log(answer);
