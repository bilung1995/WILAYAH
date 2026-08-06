const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

const GREEN_API_ID = process.env.GREEN_API_ID;
const GREEN_API_TOKEN = process.env.GREEN_API_TOKEN;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

// Chat Telegram terakhir yang menekan /start
let telegramChatId = null;

// Offset Telegram
let telegramOffset = 0;

// Mencegah polling Telegram berjalan dua kali
let telegramPolling = false;

// ==================================================
// START SERVER
// ==================================================

app.get("/", (req, res) => {
  res.send("✅ BOT WHATSAPP → TELEGRAM AKTIF");
});

app.listen(PORT, () => {
  console.log("=================================");
  console.log("🚀 BOT WHATSAPP → TELEGRAM AKTIF");
  console.log(`🌐 PORT: ${PORT}`);
  console.log("=================================");

  startTelegramPolling();
});

// ==================================================
// KIRIM PESAN KE TELEGRAM
// ==================================================

async function sendTelegramMessage(chatId, text) {
  try {
    const url =
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

    const response = await axios.post(
      url,
      {
        chat_id: chatId,
        text: text
      },
      {
        timeout: 15000
      }
    );

    console.log("✅ PESAN BERHASIL DIKIRIM KE TELEGRAM");

    return response.data;

  } catch (error) {
    console.error(
      "❌ GAGAL KIRIM TELEGRAM:",
      error.response?.data || error.message
    );

    return null;
  }
}

// ==================================================
// TELEGRAM POLLING
// ==================================================
// Polling dilakukan SATU PER SATU.
// Tidak menggunakan setInterval sehingga tidak terjadi
// beberapa getUpdates bersamaan yang menyebabkan 409.
// ==================================================

async function startTelegramPolling() {

  if (telegramPolling) {
    console.log("⚠️ Telegram polling sudah berjalan.");
    return;
  }

  telegramPolling = true;

  console.log("📡 Memulai Telegram polling...");

  // Karena kita menggunakan getUpdates,
  // pastikan webhook Telegram tidak aktif.
  try {

    const deleteWebhookUrl =
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/deleteWebhook`;

    await axios.get(deleteWebhookUrl, {
      params: {
        drop_pending_updates: false
      },
      timeout: 15000
    });

    console.log("✅ Telegram webhook dinonaktifkan.");

  } catch (error) {

    console.error(
      "⚠️ Gagal mengecek webhook Telegram:",
      error.response?.data || error.message
    );
  }

  // Loop tunggal
  while (true) {

    try {

      const url =
        `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates`;

      const response = await axios.get(
        url,
        {
          params: {
            offset: telegramOffset,
            timeout: 25
          },
          timeout: 35000
        }
      );

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

        console.log("=================================");
        console.log("📥 PESAN TELEGRAM DITERIMA");
        console.log("🆔 Chat ID:", chatId);
        console.log("💬 Pesan:", text);
        console.log("=================================");

        // Simpan Chat ID terakhir
        telegramChatId = chatId;

        // ==================================================
        // /START
        // ==================================================

        if (text === "/start") {

          await sendTelegramMessage(
            chatId,
            "🎉 BOT BERHASIL AKTIF!\n\n" +
            "✅ Telegram terhubung\n" +
            "✅ Chat ID berhasil terdeteksi\n" +
            "✅ Siap menerima pesan WhatsApp\n\n" +
            `🆔 Chat ID Anda: ${chatId}\n\n` +
            "Kirim /id untuk melihat Chat ID lagi."
          );

          continue;
        }

        // ==================================================
        // /ID
        // ==================================================

        if (text === "/id") {

          await sendTelegramMessage(
            chatId,
            `🆔 Chat ID Telegram Anda:\n\n${chatId}`
          );

          continue;
        }

        // ==================================================
        // PESAN BIASA
        // ==================================================

        if (text) {

          await sendTelegramMessage(
            chatId,
            "✅ Pesan Telegram diterima.\n\n" +
            "Bot siap menerima pesan WhatsApp."
          );
        }
      }

    } catch (error) {

      console.error(
        "❌ ERROR TELEGRAM:",
        error.response?.data || error.message
      );

      // Tunggu sebentar sebelum mencoba lagi
      await new Promise(
        resolve => setTimeout(resolve, 5000)
      );
    }
  }
}

// ==================================================
// WEBHOOK GREEN API
// ==================================================

app.post(
  "/webhook/greenapi",
  async (req, res) => {

    try {

      console.log("=================================");
      console.log("📩 WEBHOOK GREEN API DITERIMA");
      console.log("=================================");

      const data = req.body;

      // Tampilkan data webhook di Railway
      console.log(
        JSON.stringify(data, null, 2)
      );

      // ==================================================
      // HANYA PESAN MASUK
      // ==================================================

      if (
        data.typeWebhook !==
        "incomingMessageReceived"
      ) {

        console.log(
          "ℹ️ Webhook bukan pesan masuk."
        );

        return res.status(200).json({
          success: true,
          ignored: true
        });
      }

      const messageData =
        data.messageData;

      if (!messageData) {

        console.log(
          "⚠️ messageData tidak ditemukan."
        );

        return res.status(200).json({
          success: true,
          ignored: true
        });
      }

      // ==================================================
      // DATA PENGIRIM
      // ==================================================

      const senderData =
        messageData.senderData || {};

      const whatsappChatId =
        senderData.chatId || "";

      const senderName =
        senderData.senderName ||
        "WhatsApp";

      const groupName =
        senderData.chatName ||
        "Grup WhatsApp";

      // ==================================================
      // PASTIKAN PESAN DARI GRUP
      // ==================================================

      if (
        !whatsappChatId.endsWith("@g.us")
      ) {

        console.log(
          "ℹ️ Pesan bukan berasal dari grup."
        );

        return res.status(200).json({
          success: true,
          ignored: true
        });
      }

      // ==================================================
      // AMBIL TEKS PESAN
      // ==================================================

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

      // ==================================================
      // PESAN SHARE / TEKS
      // ==================================================

      if (!text) {

        console.log(
          "ℹ️ Pesan tidak memiliki teks."
        );

        return res.status(200).json({
          success: true,
          ignored: true
        });
      }

      console.log("📨 PESAN WHATSAPP:");
      console.log(text);

      // ==================================================
      // FORMAT TELEGRAM
      // ==================================================

      const telegramText =
        "📢 PESAN WHATSAPP\n\n" +
        `👥 Grup: ${groupName}\n` +
        `👤 Pengirim: ${senderName}\n\n` +
        text;

      // ==================================================
      // KIRIM KE TELEGRAM
      // ==================================================

      if (telegramChatId) {

        console.log(
          "📤 MENGIRIM PESAN WHATSAPP KE TELEGRAM..."
        );

        await sendTelegramMessage(
          telegramChatId,
          telegramText
        );

      } else {

        console.log(
          "⚠️ BELUM ADA CHAT ID TELEGRAM."
        );

        console.log(
          "Buka bot Telegram lalu tekan /start."
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

      // Tetap jawab 200 agar webhook tidak terus
      // dianggap gagal oleh Green API.
      return res.status(200).json({
        success: false
      });
    }
  }
);
