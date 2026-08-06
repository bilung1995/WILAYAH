// notification.js
// Sistem notifikasi Telegram

// ========================================
// KIRIM NOTIFIKASI KE USER
// ========================================

async function notifyUser(
  bot,
  telegramId,
  message,
  options = {}
) {
  if (!bot) {
    return {
      success: false,
      message: "❌ Bot Telegram tidak tersedia."
    };
  }

  if (!telegramId) {
    return {
      success: false,
      message: "❌ Telegram ID tidak tersedia."
    };
  }

  try {
    await bot.sendMessage(
      telegramId,
      message,
      options
    );

    return {
      success: true,
      telegramId
    };

  } catch (error) {
    console.error(
      `❌ Gagal mengirim notifikasi ke ${telegramId}:`,
      error.response?.body ||
      error.message
    );

    return {
      success: false,
      telegramId,
      error:
        error.response?.body ||
        error.message
    };
  }
}

// ========================================
// NOTIFIKASI PESAN WHATSAPP
// ========================================

async function notifyWhatsAppMessage(
  bot,
  telegramId,
  data
) {
  const groupName =
    data.groupName ||
    "WhatsApp Group";

  const senderName =
    data.senderName ||
    "Tidak diketahui";

  const message =
    data.message ||
    "(Pesan kosong)";

  const location =
    data.location || {};

  let text =
    "📩 PESAN BARU\n\n";

  text +=
    `👥 Grup: ${groupName}\n`;

  text +=
    `👤 Pengirim: ${senderName}\n`;

  if (location.provinsi) {
    text +=
      `🇮🇩 Provinsi: ${location.provinsi}\n`;
  }

  if (location.kabupaten) {
    text +=
      `🏙️ Kabupaten/Kota: ${location.kabupaten}\n`;
  }

  if (location.kecamatan) {
    text +=
      `📍 Kecamatan: ${location.kecamatan}\n`;
  }

  text +=
    "\n💬 Pesan:\n";

  text += message;

  return notifyUser(
    bot,
    telegramId,
    text
  );
}

// ========================================
// NOTIFIKASI SISTEM
// ========================================

async function notifySystem(
  bot,
  telegramId,
  message
) {
  return notifyUser(
    bot,
    telegramId,
    `🔔 NOTIFIKASI\n\n${message}`
  );
}

// ========================================
// NOTIFIKASI SUKSES
// ========================================

async function notifySuccess(
  bot,
  telegramId,
  message
) {
  return notifyUser(
    bot,
    telegramId,
    `✅ ${message}`
  );
}

// ========================================
// NOTIFIKASI ERROR
// ========================================

async function notifyError(
  bot,
  telegramId,
  message
) {
  return notifyUser(
    bot,
    telegramId,
    `❌ ${message}`
  );
}

// ========================================
// EXPORT
// ========================================

module.exports = {
  notifyUser,
  notifyWhatsAppMessage,
  notifySystem,
  notifySuccess,
  notifyError
};
