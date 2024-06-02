import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { TaskType } from "@google/generative-ai";
import {
  GoogleGenerativeAIEmbeddings,
  ChatGoogleGenerativeAI,
} from "@langchain/google-genai";
import { SelfQueryRetriever } from "langchain/retrievers/self_query";
import { FunctionalTranslator } from "@langchain/core/structured_query";
import { Document } from "@langchain/core/documents";
import type { AttributeInfo } from "langchain/chains/query_constructor";
import dotenv from "dotenv";
dotenv.config();

/**
 * First, we create a bunch of documents. You can load your own documents here instead.
 * Each document has a pageContent and a metadata field. Make sure your metadata matches the AttributeInfo below.
 */
const docs = [
  new Document({
    pageContent:
      "Necto Financial Inc. is a Series A fintech startup based in San Francisco, CA. The company has raised $40M in funding from prominent venture capital firms and angel investors. Necto is focused on developing innovative financial technology solutions for payments, lending, and investing.",
    metadata: { category: "Company Information" },
  }),
  new Document({
    pageContent: `Necto Financial's cap table includes:
- Total Shares Outstanding: 20,000,000
- Option Pool: 3,000,000 shares (15%)
- Last Valuation: $40,000,000 (Series A)
- Preferred Share Price: $2.00
- Previous Equity Grants:
  - CEO: 4,000,000 shares
  - CTO: 2,000,000 shares
  - Other C-Suite: 1,000,000 shares each
  - Early Employees: Varying amounts, totaling 1,000,000 shares`,
    metadata: { category: "Cap Table Information" },
  }),
  new Document({
    pageContent: `Necto Financial is offering a Senior Software Engineer position with:
- Equity: 0.25% of fully diluted shares (50,000 options)
- Vesting Schedule: 4 years with a 1-year cliff
- Equity Type: Incentive Stock Options (ISOs)`,
    metadata: { category: "Equity Offer Details" },
  }),
  new Document({
    pageContent: `@VirtualCounsel has recently provided Necto Financial with legal advice on:
- Series A financing documents
- Employee classification
- Drafting a new customer agreement
- Intellectual property protection strategies`,
    metadata: { category: "VirtualCounsel's Advice (Recent)" },
  }),
  new Document({
    pageContent: `Necto Financial currently needs legal assistance with:
- Drafting employee offer letters and equity agreements
- Reviewing commercial contracts with partners
- Navigating regulatory compliance in the financial industry`,
    metadata: { category: "Current Legal Needs" },
  }),
  new Document({
    pageContent: `CERTIFICATE OF INCORPORATION OF NECTO FINANCIAL INC.

Name: The name of the corporation is Necto Financial Inc.

Registered Office in Delaware and Registered Agent:

The address of the corporation's registered office in the State of Delaware is 1209 Orange Street, Wilmington, New Castle County, Delaware 19801.
The name of the registered agent of the corporation at such address is The Corporation Trust Company.
Purpose: The purpose of the corporation is to engage in any lawful act or activity for which corporations may be organized under the General Corporation Law of the State of Delaware.

Authorized Stock:

The total number of shares of all classes of stock that the corporation shall have authority to issue is 1,000,000,000 shares.
All shares will be common stock with a par value of $0.01 per share.
Incorporator: The name and mailing address of the incorporator are:

David Chen
44 Montgomery St
San Francisco, CA 94104

Other Provisions:

The liability of the directors to the corporation or its stockholders for monetary damages for breach of fiduciary duty as a director may be eliminated or limited to the fullest extent permitted by the General Corporation Law of the State of Delaware, as amended.

IN WITNESS WHEREOF, the undersigned incorporator has executed these Articles of Incorporation this 25th day of May, 2024.

[Signature]
David Chen`,
    metadata: { category: "Articles of Incorporation" },
  }),
  // ... you can add more documents here ...
];

/**
 * Next, we define the attributes we want to be able to query on.
 * We also provide a description of each attribute and the type of the attribute.
 * This is used to generate the query prompts.
 */
const attributeInfo: AttributeInfo[] = [
  {
    name: "Company Information",
    description:
      "General information about Necto Financial, including its industry, funding stage, investors, legal counsel, number of employees, and office location.",
    type: "string or array of strings",
  },
  {
    name: "Cap Table Information",
    description:
      "Details about Necto Financial's capitalization table, including total shares outstanding, option pool, last valuation, and preferred share price.",
    type: "string or array of strings",
  },
  {
    name: "Equity Offer Details",
    description:
      "Information about equity offers made by Necto Financial, such as the position, proposed equity, vesting schedule, and equity type.",
    type: "string or array of strings",
  },
  {
    name: "VirtualCounsel's Advice (Recent)",
    description:
      "Summary of recent legal advice provided to Necto Financial by VirtualCounsel.",
    type: "string or array of strings",
  },
  {
    name: "Current Legal Needs",
    description:
      "Current areas where Necto Financial requires legal assistance.",
    type: "string or array of strings",
  },
  {
    name: "Articles of Incorporation",
    description:
      "The legal document outlining the formation of Necto Financial Inc., including its name, registered office, purpose, authorized stock, and other provisions.",
    type: "string or array of strings",
  },
  {
    name: "EIN",
    description: "Necto Financial's Employment Identification Number (EIN).",
    type: "string or array of strings",
  },
];
/**
 * Next, we instantiate a vector store. This is where we store the embeddings of the documents.
 * We also need to provide an embeddings object. This is used to embed the documents.
 */
const embeddings = new GoogleGenerativeAIEmbeddings({
  apiKey: process.env.GEMINI_API_KEY,
  modelName: "embedding-001",
  taskType: TaskType.RETRIEVAL_DOCUMENT,
  title: "Necto Financial Inc.",
});
const llm = new ChatGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
  temperature: 0.7,
  modelName: "gemini-1.5-pro",
});
const documentContents = "Brief summary of a movie";

export const vectorStore = await MemoryVectorStore.fromDocuments(
  docs,
  embeddings
);

export const selfQueryRetriever = SelfQueryRetriever.fromLLM({
  llm,
  vectorStore,
  documentContents,
  attributeInfo,
  /**
   * We need to use a translator that translates the queries into a
   * filter format that the vector store can understand. We provide a basic translator
   * translator here, but you can create your own translator by extending BaseTranslator
   * abstract class. Note that the vector store needs to support filtering on the metadata
   * attributes you want to query on.
   */
  structuredQueryTranslator: new FunctionalTranslator(),
});

// console.log(selfQueryRetriever);

/**
 * Now we can query the vector store.
 * We can ask questions like "Which movies are less than 90 minutes?" or "Which movies are rated higher than 8.5?".
 * We can also ask questions like "Which movies are either comedy or drama and are less than 90 minutes?".
 * The retriever will automatically convert these questions into queries that can be used to retrieve documents.
 */
const query1 = await selfQueryRetriever.invoke(
  "Which movies are less than 90 minutes?"
);
const query2 = await selfQueryRetriever.invoke(
  "Which movies are rated higher than 8.5?"
);
const query3 = await selfQueryRetriever.invoke(
  "Which movies are directed by Greta Gerwig?"
);
const query4 = await selfQueryRetriever.invoke(
  "Which movies are either comedy or drama and are less than 90 minutes?"
);
// console.log(query1, query2, query3, query4);
