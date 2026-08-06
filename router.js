// router.js
// Pengatur jalur menu bot Telegram

// ========================================
// DAFTAR MENU
// ========================================

const MENU = {
  ADD_CITY: "🏙️ TAMBAH KOTA",
  SELECTED_CITY: "📍 KOTA YANG DIPILIH",
  PROFILE: "👤 PROFIL",
  TOPUP: "💳 TOP UP",
  STATUS: "📊 STATUS",
  HELP: "❓ BANTUAN",
  CONTACT_ADMIN: "👨‍💼 HUBUNGI ADMIN",
  ADMIN_PANEL: "🛠️ PANEL ADMIN",
  BLACKLIST: "🚫 NOMOR BLACKLIST"
};

// ========================================
// CEK MENU
// ========================================

function isMenu(text) {
  return Object.values(MENU).includes(text);
}

// ========================================
// AMBIL NAMA MENU
// ========================================

function getMenuName(text) {
  for (const [key, value] of Object.entries(MENU)) {
    if (value === text) {
      return key;
    }
  }

  return null;
}

// ========================================
// ROUTE MENU
// ========================================

function routeMenu(text) {
  switch (text) {
    case MENU.ADD_CITY:
      return "ADD_CITY";

    case MENU.SELECTED_CITY:
      return "SELECTED_CITY";

    case MENU.PROFILE:
      return "PROFILE";

    case MENU.TOPUP:
      return "TOPUP";

    case MENU.STATUS:
      return "STATUS";

    case MENU.HELP:
      return "HELP";

    case MENU.CONTACT_ADMIN:
      return "CONTACT_ADMIN";

    case MENU.ADMIN_PANEL:
      return "ADMIN_PANEL";

    case MENU.BLACKLIST:
      return "BLACKLIST";

    default:
      return null;
  }
}

// ========================================
// CEK PERINTAH
// ========================================

function isCommand(text) {
  if (!text) {
    return false;
  }

  return text.startsWith("/");
}

// ========================================
// ROUTE PERINTAH
// ========================================

function routeCommand(text) {
  if (!text) {
    return null;
  }

  const command = text
    .split(" ")[0]
    .toLowerCase();

  switch (command) {
    case "/start":
      return "START";

    case "/id":
      return "ID";

    case "/help":
      return "HELP";

    default:
      return null;
  }
}

// ========================================
// EXPORT
// ========================================

module.exports = {
  MENU,
  isMenu,
  getMenuName,
  routeMenu,
  isCommand,
  routeCommand
};
