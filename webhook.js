// webhook.js
// Handler webhook Green API
// WhatsApp Group -> Bot

const {
  isWhatsAppGroup
} = require("./whatsapp");

// ========================================
// CEK WEBHOOK GREEN API
// ========================================

function isGreenApiWebhook(body) {
  if (!body || typeof body !== "object") {
    return false;
  }

  return Boolean(
    body.typeWebhook
  );
}

// ========================================
// AMBIL DATA PESAN
// ========================================

function parseWhatsAppWebhook(body) {
  if (!isGreenApiWebhook(body)) {
    return {
      success: false,
      message: "❌ Webhook tidak valid."
    };
  }

  const typeWebhook =
    body.typeWebhook;

  // Kita hanya proses pesan masuk
  if (
    typeWebhook !==
    "incomingMessageReceived"
  ) {
    return {
      success: false,
      ignored: true,
      message:
        "ℹ️ Webhook bukan pesan masuk."
    };
  }

  const messageData =
    body.messageData || {};

  const senderData =
    messageData.senderData || {};

  const chatId =
    senderData.chatId || "";

  // ========================================
  // HANYA PROSES GROUP WHATSAPP
  // ========================================

  if (!isWhatsAppGroup(chatId)) {
    return {
      success: false,
      ignored: true,
      message:
        "ℹ️ Pesan bukan dari grup WhatsApp."
    };
  }

  // ========================================
  // AMBIL NAMA GRUP
  // ========================================

  const groupName =
    senderData.chatName ||
    "WhatsApp Group";

  // ========================================
  // AMBIL NAMA PENGIRIM
  // ========================================

  const senderName =
    senderData.senderName ||
    senderData.senderContactName ||
    "Tidak diketahui";

  // ========================================
  // AMBIL TEKS PESAN
  // ========================================

  let message = "";

  if (
    messageData.typeMessage ===
    "textMessage"
  ) {
    message =
      messageData.textMessageData
        ?.textMessage ||
      "";
  }

  if (
    messageData.typeMessage ===
    "extendedTextMessage"
  ) {
    message =
      messageData.extendedTextMessageData
        ?.text ||
      "";
  }

  return {
    success: true,

    type: typeWebhook,

    chatId,

    groupName,

    senderName,

    message,

    location: {
      provinsi: null,
      provinsiCode: null,

      kabupaten: null,
      kabupatenCode: null,

      kecamatan: null,
      kecamatanCode: null
    },

    raw: body
  };
}

// ========================================
// PROSES WEBHOOK
// ========================================

async function handleWebhook(
  body,
  callback
) {
  const result =
    parseWhatsAppWebhook(body);

  if (
    !result.success ||
    result.ignored
  ) {
    return result;
  }

  if (
    typeof callback ===
    "function"
  ) {
    try {
      await callback(result);
    } catch (error) {
      console.error(
        "❌ ERROR CALLBACK WEBHOOK:",
        error.message
      );

      return {
        success: false,
        message: error.message
      };
    }
  }

  return result;
}

// ========================================
// EXPORT
// ========================================

module.exports = {
  isGreenApiWebhook,
  parseWhatsAppWebhook,
  handleWebhook
};
