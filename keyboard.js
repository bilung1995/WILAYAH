// keyboard.js
// Keyboard utama bot Telegram

const mainKeyboard = {
  keyboard: [
    [
      { text: "🏙️ TAMBAH KOTA" },
      { text: "📍 KOTA YANG DIPILIH" }
    ],
    [
      { text: "👤 PROFIL" },
      { text: "💳 TOP UP" }
    ],
    [
      { text: "📊 STATUS" },
      { text: "❓ BANTUAN" }
    ],
    [
      { text: "👨‍💼 HUBUNGI ADMIN" },
      { text: "🛠️ PANEL ADMIN" }
    ],
    [
      { text: "🚫 NOMOR BLACKLIST" }
    ]
  ],
  resize_keyboard: true,
  one_time_keyboard: false,
  is_persistent: true
};

module.exports = {
  mainKeyboard
};
