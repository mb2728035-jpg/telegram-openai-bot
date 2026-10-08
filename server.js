import TelegramBot from "node-telegram-bot-api";
import { GoogleGenAI } from "@google/genai";
import http from "http";

const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
const geminiKey = process.env.GEMINI_API_KEY;

if (!telegramToken) {
  throw new Error("TELEGRAM_BOT_TOKEN is missing");
}

if (!geminiKey) {
  throw new Error("GEMINI_API_KEY is missing");
}

const bot = new TelegramBot(telegramToken, {
  polling: true
});

const ai = new GoogleGenAI({
  apiKey: geminiKey
});

let modelName = null;

async function getModel() {
  try {
    for await (const model of ai.models.list()) {
      const name = model.name || "";

      if (
        model.supportedActions &&
        model.supportedActions.includes("generateContent") &&
        name.includes("gemini")
      ) {
        modelName = name.replace("models/", "");
        console.log("Using Gemini model:", modelName);
        return;
      }
    }

    throw new Error("No Gemini model available");
  } catch (error) {
    console.error("Model Error:", error);
    throw error;
  }
}

await getModel();

bot.on("message", async (msg) => {
  if (!msg.text) return;

  const chatId = msg.chat.id;

  try {
    await bot.sendChatAction(chatId, "typing");

    const response = await ai.models.generateContent({
      model: modelName,
      contents: msg.text,
      config: {
        systemInstruction:
          "أنت مساعد ذكي لخدمة الطلاب. أجب باختصار ووضوح وبأسلوب سعودي ودود. لا تطيل في الرد."
      }
    });

    const reply = response.text;

    if (!reply) {
      throw new Error("Empty Gemini response");
    }

    await bot.sendMessage(chatId, reply);
  } catch (error) {
    console.error("Gemini Error:", error);

    await bot.sendMessage(
      chatId,
      "عذرًا حصل خطأ بسيط، حاول ترسل رسالتك مرة ثانية"
    );
  }
});

const PORT = process.env.PORT || 3000;

http
  .createServer((req, res) => {
    res.writeHead(200, {
      "Content-Type": "text/plain"
    });
    res.end("Telegram bot is running");
  })
  .listen(PORT, "0.0.0.0", () => {
    console.log("Server running on port " + PORT);
  });

console.log("Telegram bot is running...");
