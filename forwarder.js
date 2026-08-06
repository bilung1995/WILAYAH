// forwarder.js
// WhatsApp Group -> Telegram User
// Meneruskan pesan berdasarkan wilayah yang dipilih user

const {
  getSelectedCities
} = require("./selectedCities");

// ========================================
// NORMALISASI NAMA WILAYAH
// ========================================

function normalizeLocationName(name) {
  if (!name) {
    return "";
  }

  return String(name)
    .trim()
    .toLowerCase();
}

// ========================================
// CEK APAKAH WILAYAH COCOK
// ========================================

function locationMatches(
  selectedLocation,
  messageLocation
) {
  if (!selectedLocation || !messageLocation) {
    return false;
  }

  const selectedProvinsi =
    normalizeLocationName(
      selectedLocation.provinsi
    );

  const selectedKabupaten =
    normalizeLocationName(
      selectedLocation.kabupaten
    );

  const selectedKecamatan =
    normalizeLocationName(
      selectedLocation.kecamatan
    );

  const messageProvinsi =
    normalizeLocationName(
      messageLocation.provinsi
    );

  const messageKabupaten =
    normalizeLocationName(
      messageLocation.kabupaten
    );

  const messageKecamatan =
    normalizeLocationName(
      messageLocation.kecamatan
    );

  // Kecamatan adalah pencocokan utama
  if (
    selectedKecamatan &&
    messageKecamatan &&
    selectedKecamatan === messageKecamatan
  ) {
    return true;
  }

  // Jika data kecamatan tidak tersedia,
  // cocokkan kabupaten/kota
  if (
    selectedKabupaten &&
    messageKabupaten &&
    selectedKabupaten === messageKabupaten
  ) {
    return true;
  }

  // Terakhir cocokkan provinsi
  if (
    selectedProvinsi &&
    messageProvinsi &&
    selectedProvinsi === messageProvinsi
  ) {
    return true;
  }

  return false;
}

// ========================================
// CARI USER YANG HARUS MENERIMA PESAN
// ========================================

function getUsersForLocation(
  users,
  messageLocation
) {
  const recipients = [];

  if (!users) {
    return recipients;
  }

  for (const [telegramId] of users.entries()) {
    const selectedLocations =
      getSelectedCities(telegramId);

    const matched =
      selectedLocations.some(
        selectedLocation =>
          locationMatches(
            selectedLocation,
            messageLocation
          )
      );

    if (matched) {
      recipients.push(
        telegramId
      );
    }
  }

  return recipients;
}

// ========================================
// FORMAT PESAN WHATSAPP
// ========================================

function formatForwardMessage(data) {
  const sender =
    data.senderName ||
    "Tidak diketahui";

  const groupName =
    data.groupName ||
    "WhatsApp Group";

  const message =
    data.message ||
    "";

  const location =
    data.location || {};

  let text =
    "📩 PESAN WHATSAPP\n\n";

  text +=
    `👥 Grup: ${groupName}\n`;

  text +=
    `👤 Pengirim: ${sender}\n`;

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

  text +=
    message || "(Pesan kosong)";

  return text;
}

// ========================================
// PROSES PESAN WHATSAPP
// ========================================

async function processWhatsAppMessage(
  bot,
  users,
  data
) {
  if (!bot) {
    return {
      success: false,
      sent: 0,
      message:
        "❌ Bot Telegram tidak tersedia."
    };
  }

  const recipients =
    getUsersForLocation(
      users,
      data.location
    );

  if (recipients.length === 0) {
    return {
      success: true,
      sent: 0,
      message:
        "ℹ️ Tidak ada user yang cocok."
    };
  }

  const message =
    formatForwardMessage(data);

  let sent = 0;
  let failed = 0;

  for (const telegramId of recipients) {
    try {
      await bot.sendMessage(
        telegramId,
        message
      );

      sent++;

    } catch (error) {
      failed++;

      console.error(
        `❌ Gagal kirim ke Telegram ${telegramId}:`,
        error.message
      );
    }
  }

  return {
    success: true,
    sent,
    failed,
    recipients
  };
}

// ========================================
// EXPORT
// ========================================

module.exports = {
  normalizeLocationName,
  locationMatches,
  getUsersForLocation,
  formatForwardMessage,
  processWhatsAppMessage
};
