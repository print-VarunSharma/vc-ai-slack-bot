import pkg from "@slack/bolt";
const { App, LogLevel } = pkg;
// import { chatWithGeminiWithLocalGrounding } from "./gemini-chat.js";
import { chatWithGemini } from "./gemini-langchain.js";

// TODO Fix the harded js extension due to compilation issues
// relating to top level await incompatibilit with CommonJs set under module
import dotenv from "dotenv";
dotenv.config();

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  processBeforeResponse: false,
  // https://github.com/slackapi/bolt-js/issues/1724#issuecomment-1405979510
  logLevel: LogLevel.DEBUG,
});

app.message("sanity check", async ({ say }) => {
  // Replace hello with the message
  try {
    say("Hi! Thanks for PM'ing me! SANITY IS CHECKED");
  } catch (error) {
    console.log("err");
    console.error(error);
  }
});

app.message(async ({ message, say, logger }) => {
  try {
    if (
      message.subtype !== "bot_message" &&
      "text" in message &&
      message.text !== undefined
    ) {
      const geminiResponse = await chatWithGemini(message.text);
      // @ts-ignore this is temporary
      await say(geminiResponse);
    }
  } catch (error) {
    console.error(error); // Log the error for debugging
    if (say) {
      // Check again before sending the error message
      await say("Oops! Something went wrong.");
    }
  }
});

// This will match any message that contains 👋
app.message(":wave:", async ({ message, say }) => {
  // Handle only newly posted messages here
  if (
    message.subtype === undefined ||
    message.subtype === "bot_message" ||
    message.subtype === "file_share" ||
    message.subtype === "thread_broadcast"
  ) {
    await say(`Hello, <@${message.user}>`);
  }
});

app.use(async ({ next, logger }) => {
  const startTime = Date.now();
  await next(); // Call the next middleware or handler
  const elapsedTime = Date.now() - startTime;
  logger.info(`Middleware/Handler took ${elapsedTime} ms`); // Log execution time
});

(async () => {
  // Start your app
  await app.start(Number(process.env.PORT) || 3000);

  console.log("⚡️ VC Bolt app is running!");
})();
