const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

const GREEN_API_ID = process.env.GREEN_API_ID;
const GREEN_API_TOKEN = process.env.GREEN_API_TOKEN;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

let telegramChatId = null;
let telegramOffset = 0;

// ========================================
// CEK CONFIG
// ========================================

console.log("=================================");
console.log("🚀 BOT WHATSAPP → TELEGRAM");
console.log("=================================");

if (!GREEN_API_ID) {
  console.error("❌ GREEN_API_ID belum diisi");
}

if (!GREEN_API_TOKEN) {
  console.error("❌ GREEN_API_TOKEN belum diisi");
}

if (!TELEGRAM_BOT_TOKEN) {
  console.error("❌ TELEGRAM_BOT_TOKEN belum diisi");
}

// ========================================
// SERVER
// ========================================

app.get("/", (req, res) => {
  res.send("✅ BOT WHATSAPP → TELEGRAM AKTIF");
});

// ========================================
// KIRIM PESAN TELEGRAM
// ========================================

async function sendTelegramMessage(chatId, text) {
  try {
    const url =
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

    const response = await axios.post(url, {
      chat_id: chatId,
      text: text
    });

    console.log("✅ Pesan berhasil dikirim ke Telegram");

    return response.data;

  } catch (error) {

    console.error(
      "❌ GAGAL KIRIM TELEGRAM:",
      error.response?.data || error.message
    );

    return null;
  }
}

// ========================================
// TELEGRAM POLLING
// MENERIMA /START DAN PESAN USER
// ========================================

async function checkTelegramUpdates() {

  if (!TELEGRAM_BOT_TOKEN) {
    return;
  }

  try {

    const url =
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates`;

    const response = await axios.get(url, {
      params: {
        offset: telegramOffset,
        timeout: 10
      },
      timeout: 15000
    });

    const updates = response.data.result || [];

    for (const update of updates) {

      telegramOffset = update.update_id + 1;

      if (!update.message) {
        continue;
      }

      const message = update.message;

      const chat = message.chat;

      const chatId = chat.id;

      const text = message.text || "";

      console.log("📥 Pesan Telegram diterima");
      console.log("Chat ID:", chatId);
      console.log("Text:", text);

      // Simpan chat ID Telegram
      telegramChatId = chatId;

      // ==================================
      // /START
      // ==================================

      if (text === "/start") {

        const welcome =
          "🎉 BOT BERHASIL AKTIF!\n\n" +
          "✅ Telegram terhubung\n" +
          "✅ Chat ID berhasil terdeteksi\n" +
          "✅ Siap menerima pesan WhatsApp\n\n" +
          `🆔 Chat ID Anda: ${chatId}\n\n` +
          "Kirim /id untuk melihat Chat ID lagi.";

        await sendTelegramMessage(
          chatId,
          welcome
        );

        continue;
      }

      // ==================================
      // /ID
      // ==================================

      if (text === "/id") {

        await sendTelegramMessage(
          chatId,
          `🆔 Chat ID Telegram Anda:\n\n${chatId}`
        );

        continue;
      }

      // ==================================
      // PESAN BIASA
      // ==================================

      if (text) {

        await sendTelegramMessage(
          chatId,
          "✅ Bot menerima pesan Anda.\n\n" +
          "Sistem Telegram sudah terhubung."
        );
      }
    }

  } catch (error) {

    console.error(
      "❌ ERROR TELEGRAM:",
      error.response?.data || error.message
    );
  }
}

// ========================================
// JALANKAN TELEGRAM POLLING
// ========================================

setInterval(
  checkTelegramUpdates,
  3000
);

// Jalankan pertama kali
checkTelegramUpdates();

// ========================================
// WEBHOOK GREEN API
// ========================================

app.post(
  "/webhook/greenapi",
  async (req, res) => {

    try {

      console.log("=================================");
      console.log("📩 WEBHOOK GREEN API DITERIMA");
      console.log("=================================");

      const data = req.body;

      console.log(
        JSON.stringify(
          data,
          null,
          2
        )
      );

      // ==================================
      // HANYA PESAN MASUK
      // ==================================

      if (
        data.typeWebhook !==
        "incomingMessageReceived"
      ) {

        return res.status(200).json({
          success: true,
          ignored: true
        });
      }

      const messageData =
        data.messageData;

      if (!messageData) {

        return res.status(200).json({
          success: true,
          ignored: true
        });
      }

      // ==================================
      // DATA PENGIRIM
      // ==================================

      const senderData =
        messageData.senderData || {};

      const chatId =
        senderData.chatId || "";

      const senderName =
        senderData.senderName ||
        "WhatsApp";

      const chatName =
        senderData.chatName ||
        "Grup WhatsApp";

      // ==================================
      // PASTIKAN GRUP
      // ==================================

      if (!chatId.endsWith("@g.us")) {

        console.log(
          "ℹ️ Pesan bukan dari grup"
        );

        return res.status(200).json({
          success: true,
          ignored: true
        });
      }

      // ==================================
      // AMBIL TEKS
      // ==================================

      let text = "";

      if (
        messageData.typeMessage ===
        "textMessage"
      ) {

        text =
          messageData
            .textMessageData
            ?.textMessage || "";
      }

      // ==================================
      // JIKA TIDAK ADA TEKS
      // ==================================

      if (!text) {

        console.log(
          "ℹ️ Pesan tidak memiliki teks"
        );

        return res.status(200).json({
          success: true,
          ignored: true
        });
      }

      // ==================================
      // FORMAT PESAN
      // ==================================

      const telegramText =
        "📢 PESAN WHATSAPP\n\n" +
        `👥 Grup: ${chatName}\n` +
        `👤 Pengirim: ${senderName}\n\n` +
        text;

      console.log(
        "📤 Pesan WhatsApp siap dikirim ke Telegram"
      );

      // ==================================
      // KIRIM KE CHAT TELEGRAM TERAKHIR
      // ==================================

      if (telegramChatId) {

        await sendTelegramMessage(
          telegramChatId,
          telegramText
        );

      } else {

        console.log(
          "⚠️ Belum ada Chat ID Telegram."
        );

        console.log(
          "Buka bot Telegram dan tekan /start terlebih dahulu."
        );
      }

      return res.status(200).json({
        success: true
      });

    } catch (error) {

      console.error(
        "❌ ERROR GREEN API:",
        error.response?.data ||
        error.message
      );

      return res.status(200).json({
        success: false
      });
    }
  }
);

// ========================================
// START SERVER
// ========================================

app.listen(
  PORT,
  () => {

    console.log("=================================");
    console.log("🚀 SERVER BERJALAN");
    console.log(`🌐 PORT: ${PORT}`);
    console.log("=================================");
  }
);
