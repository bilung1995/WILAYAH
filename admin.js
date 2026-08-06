// admin.js
// Menu dan konfigurasi Panel Admin Telegram

const adminKeyboard = {
  keyboard: [
    [
      { text: "👥 DATA USER" },
      { text: "🏙️ KELOLA KOTA" }
    ],
    [
      { text: "📍 KELOLA KECAMATAN" },
      { text: "🚫 KELOLA BLACKLIST" }
    ],
    [
      { text: "💰 KELOLA SALDO" },
      { text: "💳 CEK TOP UP" }
    ],
    [
      { text: "📢 BROADCAST" },
      { text: "📊 STATISTIK" }
    ],
    [
      { text: "⚙️ PENGATURAN" }
    ],
    [
      { text: "🔙 KEMBALI KE MENU UTAMA" }
    ]
  ],
  resize_keyboard: true,
  one_time_keyboard: false,
  is_persistent: true
};

// ID admin.
// Untuk sementara kosong.
// Nanti kita isi dari ENV agar tidak perlu mengubah kode.
const ADMIN_IDS = process.env.ADMIN_IDS
  ? process.env.ADMIN_IDS
      .split(",")
      .map(id => id.trim())
      .filter(Boolean)
  : [];

// Mengecek apakah user adalah admin
function isAdmin(chatId) {
  return ADMIN_IDS.includes(String(chatId));
}

module.exports = {
  adminKeyboard,
  ADMIN_IDS,
  isAdmin
};
