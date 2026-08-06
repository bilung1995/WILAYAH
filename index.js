const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

const GREEN_API_ID = process.env.GREEN_API_ID;
const GREEN_API_TOKEN = process.env.GREEN_API_TOKEN;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

// ================================
// CEK KONFIGURASI
// ================================
const required = {
  GREEN_API_ID,
  GREEN_API_TOKEN,
  TELEGRAM_BOT_TOKEN,
};

for (const [name, value] of Object.entries(required)) {
  if (!value) {
    console.error(`❌ Variable ${name} belum diisi`);
  }
}

// ================================
// TEST SERVER
// ================================
app.get("/", (req, res) => {
  res.send("✅ WhatsApp → Telegram Bot aktif");
});

// ================================
// TEST TELEGRAM
// ================================
async function sendTelegramMessage(chatId, text) {
  if (!chatId) {
    console.log("⚠️ TELEGRAM_CHAT_ID belum diisi");
    return;
  }

  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

  await axios.post(url, {
    chat_id: chatId,
    text,
  });
}

// ================================
// WEBHOOK GREEN API
// ================================
app.post("/webhook/greenapi", async (req, res) => {
  try {
    console.log("📩 Webhook Green API diterima");
    console.log(JSON.stringify(req.body, null, 2));

    const data = req.body;

    // Hanya proses pesan masuk
    if (data.typeWebhook !== "incomingMessageReceived") {
      return res.status(200).json({
        success: true,
        ignored: true,
      });
    }

    const messageData = data.messageData;

    if (!messageData) {
      return res.status(200).json({
        success: true,
        ignored: true,
      });
    }

    // ================================
    // AMBIL INFORMASI PESAN
    // ================================
    const senderData = messageData.senderData || {};
    const typeMessage = messageData.typeMessage;

    let text = "";

    if (typeMessage === "textMessage") {
      text = messageData.textMessageData?.textMessage || "";
    }

    if (!text) {
      return res.status(200).json({
        success: true,
        ignored: true,
      });
    }

    const chatId = senderData.chatId || "";
    const senderName = senderData.senderName || "WhatsApp";

    // ================================
    // PASTIKAN PESAN DARI GRUP
    // ================================
    if (!chatId.endsWith("@g.us")) {
      console.log("ℹ️ Pesan bukan dari grup:", chatId);

      return res.status(200).json({
        success: true,
        ignored: true,
      });
    }

    // ================================
    // NAMA GRUP
    // ================================
    const groupName =
      senderData.chatName ||
      senderData.senderName ||
      "Grup WhatsApp";

    // ================================
    // PESAN UNTUK TELEGRAM
    // ================================
    const telegramText =
      `📢 PESAN WHATSAPP\n\n` +
      `👥 Grup: ${groupName}\n` +
      `👤 Pengirim: ${senderName}\n\n` +
      `${text}`;

    console.log("📤 Mengirim ke Telegram...");
    console.log(telegramText);

    // ================================
    // KIRIM KE TELEGRAM
    // ================================
    if (TELEGRAM_CHAT_ID) {
      await sendTelegramMessage(
        TELEGRAM_CHAT_ID,
        telegramText
      );

      console.log("✅ Berhasil dikirim ke Telegram");
    } else {
      console.log(
        "⚠️ TELEGRAM_CHAT_ID kosong. Pesan hanya dicatat di log."
      );
    }

    return res.status(200).json({
      success: true,
      message: "Pesan berhasil diproses",
    });

  } catch (error) {
    console.error(
      "❌ ERROR WEBHOOK:",
      error.response?.data || error.message
    );

    return res.status(200).json({
      success: false,
      error: error.message,
    });
  }
});

// ================================
// START SERVER
// ================================
app.listen(PORT, () => {
  console.log("=================================");
  console.log("🚀 BOT WHATSAPP → TELEGRAM AKTIF");
  console.log(`🌐 Port: ${PORT}`);
  console.log("=================================");
});
