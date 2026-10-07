const TelegramBot = require("node-telegram-bot-api");
const OpenAI = require("openai");

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, {
  polling: true
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

bot.on("message", async (msg) => {
  if (!msg.text) return;

  const chatId = msg.chat.id;
  const userMessage = msg.text;

  try {
    await bot.sendChatAction(chatId, "typing");

    const response = await openai.responses.create({
      model: "gpt-5-mini",
      input: [
        {
          role: "system",
          content:
            "أنت مساعد ذكي لخدمة الطلاب. أجب باختصار ووضوح وبأسلوب سعودي ودود. إذا كان السؤال غير واضح اطلب من الطالب توضيحه."
        },
        {
          role: "user",
          content: userMessage
        }
      ]
    });

    const reply = response.output_text;

    await bot.sendMessage(chatId, reply);
  } catch (error) {
    console.error("Error:", error);

    await bot.sendMessage(
      chatId,
      "عذرًا حصل خطأ بسيط، حاول ترسل رسالتك مرة ثانية"
    );
  }
});

console.log("Telegram bot is running...");
