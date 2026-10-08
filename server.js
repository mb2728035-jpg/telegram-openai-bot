import TelegramBot from "node-telegram-bot-api";
import { GoogleGenAI } from "@google/genai";
import http from "http";

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, {
  polling: true
});

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

const systemInstruction = `
أنت مساعد ذكي لخدمة الطلاب.
أجب باختصار ووضوح وبأسلوب سعودي ودود.
لا تطيل في الرد.
إذا كان السؤال غير واضح اطلب توضيحه باختصار.
لا تكرر نفس الرد أو نفس الكلام.
`;

async function generateWithRetry(prompt) {
  const maxRetries = 4;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          systemInstruction: systemInstruction
        }
      });

      return response.text;
    } catch (error) {
      const status =
        error?.status ||
        error?.code ||
        error?.error?.code;

      const retryable =
        status === 503 ||
        status === "503" ||
        status === 429 ||
        status === "429" ||
        status === 500 ||
        status === "500";

      if (!retryable || attempt === maxRetries) {
        throw error;
      }

      const delay = Math.min(1000 * Math.pow(2, attempt), 8000);

      console.log(
        `Gemini temporary error ${status} - retry ${attempt + 1}/${maxRetries}`
      );

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

bot.on("message", async (msg) => {
  if (!msg.text) return;

  const chatId = msg.chat.id;

  try {
    await bot.sendChatAction(chatId, "typing");

    const answer = await generateWithRetry(msg.text);

    await bot.sendMessage(chatId, answer);
  } catch (error) {
    console.error("Gemini Error:", error);

    await bot.sendMessage(
      chatId,
      "تعذر الرد حاليا حاول مرة ثانية"
    );
  }
});

const server = http.createServer((req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/plain; charset=utf-8"
  });

  res.end("Nexus AI is running");
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Nexus AI running on port ${PORT}`);
});
