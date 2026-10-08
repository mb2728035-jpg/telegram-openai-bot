import TelegramBot from "node-telegram-bot-api";
import { GoogleGenAI } from "@google/genai";
import http from "http";

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, {
  polling: true
});

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

bot.on("message", async (msg) => {
  if (!msg.text) return;

  const chatId = msg.chat.id;

  try {
    await bot.sendChatAction(chatId, "typing");

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: msg.text,
      config: {
        systemInstruction:
          "أنت مساعد ذكي لخدمة الطلاب. أجب باختصار ووضوح وبأسلوب سعودي ودود. لا تطيل في الرد."
      }
    });

    const reply = response.text;

    if (!reply) {
      throw new Error("Gemini returned an empty response");
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

const server = http.createServer((req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/plain"
  });

  res.end("Telegram bot is running");
});

server.listen(PORT, "0.0.0.0", () => {
  console.log("Server running on port " + PORT);
});

console.log("Telegram bot is running...");
