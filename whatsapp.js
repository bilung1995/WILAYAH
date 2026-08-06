// whatsapp.js
// Koneksi dan fungsi Green API WhatsApp

const axios = require("axios");

// ========================================
// KONFIGURASI GREEN API
// ========================================

const GREEN_API_ID =
  process.env.GREEN_API_ID || "";

const GREEN_API_TOKEN =
  process.env.GREEN_API_TOKEN || "";

const GREEN_API_URL =
  `https://api.green-api.com/waInstance${GREEN_API_ID}`;

// ========================================
// CEK KONFIGURASI
// ========================================

function isGreenApiConfigured() {
  return Boolean(
    GREEN_API_ID &&
    GREEN_API_TOKEN
  );
}

// ========================================
// KIRIM PESAN WHATSAPP
// ========================================

async function sendWhatsAppMessage(
  chatId,
  message
) {
  if (!isGreenApiConfigured()) {
    return {
      success: false,
      message:
        "❌ Green API belum dikonfigurasi."
    };
  }

  try {
    const url =
      `${GREEN_API_URL}/sendMessage/${GREEN_API_TOKEN}`;

    const response = await axios.post(
      url,
      {
        chatId,
        message
      },
      {
        timeout: 15000
      }
    );

    return {
      success: true,
      data: response.data
    };

  } catch (error) {
    console.error(
      "❌ ERROR GREEN API:",
      error.response?.data ||
      error.message
    );

    return {
      success: false,
      message:
        error.response?.data ||
        error.message
    };
  }
}

// ========================================
// FORMAT CHAT ID GRUP
// ========================================

function isWhatsAppGroup(chatId) {
  return (
    typeof chatId === "string" &&
    chatId.endsWith("@g.us")
  );
}

// ========================================
// FORMAT CHAT ID NOMOR
// ========================================

function isWhatsAppNumber(chatId) {
  return (
    typeof chatId === "string" &&
    chatId.endsWith("@c.us")
  );
}

// ========================================
// AMBIL NOMOR DARI CHAT ID
// ========================================

function getNumberFromChatId(chatId) {
  if (!chatId) {
    return null;
  }

  return chatId
    .replace("@c.us", "")
    .replace("@g.us", "");
}

// ========================================
// FORMAT NOMOR
// ========================================

function normalizeWhatsAppNumber(number) {
  if (!number) {
    return null;
  }

  let nomor = String(number)
    .trim()
    .replace(/[^\d+]/g, "");

  if (nomor.startsWith("+62")) {
    nomor =
      "62" +
      nomor.substring(3);
  }

  if (nomor.startsWith("08")) {
    nomor =
      "62" +
      nomor.substring(1);
  }

  if (!nomor.endsWith("@c.us")) {
    nomor += "@c.us";
  }

  return nomor;
}

// ========================================
// KIRIM PESAN KE NOMOR
// ========================================

async function sendToNumber(
  number,
  message
) {
  const chatId =
    normalizeWhatsAppNumber(number);

  if (!chatId) {
    return {
      success: false,
      message:
        "❌ Nomor WhatsApp tidak valid."
    };
  }

  return sendWhatsAppMessage(
    chatId,
    message
  );
}

// ========================================
// EXPORT
// ========================================

module.exports = {
  GREEN_API_ID,
  GREEN_API_TOKEN,
  GREEN_API_URL,

  isGreenApiConfigured,

  sendWhatsAppMessage,
  sendToNumber,

  isWhatsAppGroup,
  isWhatsAppNumber,

  getNumberFromChatId,
  normalizeWhatsAppNumber
};
