// telegram.js
// Fungsi utama Telegram Bot

const TelegramBot = require("node-telegram-bot-api");

const {
  TELEGRAM_TOKEN
} = require("./config");

// ========================================
// CEK TOKEN
// ========================================

function isTelegramConfigured() {
  return Boolean(TELEGRAM_TOKEN);
}

// ========================================
// MEMBUAT BOT
// ========================================

function createTelegramBot() {
  if (!isTelegramConfigured()) {
    throw new Error(
      "❌ TELEGRAM_TOKEN belum tersedia."
    );
  }

  return new TelegramBot(
    TELEGRAM_TOKEN,
    {
      polling: false
    }
  );
}

// ========================================
// KIRIM PESAN
// ========================================

async function sendTelegramMessage(
  bot,
  chatId,
  message,
  options = {}
) {
  if (!bot) {
    return {
      success: false,
      message:
        "❌ Bot Telegram tidak tersedia."
    };
  }

  try {
    const result =
      await bot.sendMessage(
        chatId,
        message,
        options
      );

    return {
      success: true,
      result
    };

  } catch (error) {
    console.error(
      "❌ ERROR TELEGRAM:",
      error.response?.body ||
      error.message
    );

    return {
      success: false,
      message:
        error.response?.body ||
        error.message
    };
  }
}

// ========================================
// KIRIM KEYBOARD UTAMA
// ========================================

async function sendMainMenu(
  bot,
  chatId,
  message = "Silakan pilih menu:"
) {
  const {
    mainKeyboard
  } = require("./keyboard");

  return sendTelegramMessage(
    bot,
    chatId,
    message,
    {
      reply_markup:
        mainKeyboard
    }
  );
}

// ========================================
// KIRIM INLINE KEYBOARD
// ========================================

async function sendInlineKeyboard(
  bot,
  chatId,
  message,
  keyboard
) {
  return sendTelegramMessage(
    bot,
    chatId,
    message,
    {
      reply_markup: keyboard
    }
  );
}

// ========================================
// FORMAT ERROR TELEGRAM
// ========================================

function formatTelegramError(error) {
  if (!error) {
    return "❌ Terjadi kesalahan Telegram.";
  }

  if (error.response?.body) {
    const body =
      error.response.body;

    if (body.description) {
      return (
        `❌ Telegram Error ${body.error_code || ""}\n` +
        `${body.description}`
      );
    }
  }

  return (
    `❌ Telegram Error: ${
      error.message || error
    }`
  );
}

// ========================================
// EXPORT
// ========================================

module.exports = {
  isTelegramConfigured,
  createTelegramBot,
  sendTelegramMessage,
  sendMainMenu,
  sendInlineKeyboard,
  formatTelegramError
};
