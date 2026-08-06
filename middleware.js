// middleware.js
// Pemeriksaan akses user dan admin

const {
  getUser
} = require("./user");

const {
  isAdmin
} = require("./admin");

const {
  getSelectedCities
} = require("./selectedCities");

// ========================================
// CEK USER TERDAFTAR
// ========================================

function requireUser(telegramId) {
  const user = getUser(telegramId);

  if (!user) {
    return {
      allowed: false,
      message:
        "❌ Data akun belum ditemukan.\n\n" +
        "Silakan tekan /start terlebih dahulu."
    };
  }

  return {
    allowed: true,
    user
  };
}

// ========================================
// CEK ADMIN
// ========================================

function requireAdmin(telegramId) {
  if (!isAdmin(telegramId)) {
    return {
      allowed: false,
      message:
        "⛔ AKSES DITOLAK\n\n" +
        "Menu ini hanya dapat digunakan oleh admin."
    };
  }

  return {
    allowed: true
  };
}

// ========================================
// CEK WILAYAH USER
// ========================================

function requireLocation(telegramId) {
  const locations =
    getSelectedCities(telegramId);

  if (
    !locations ||
    locations.length === 0
  ) {
    return {
      allowed: false,
      message:
        "⚠️ Anda belum memilih wilayah.\n\n" +
        "Silakan gunakan menu 🏙️ TAMBAH KOTA " +
        "terlebih dahulu."
    };
  }

  return {
    allowed: true,
    locations
  };
}

// ========================================
// CEK USER + WILAYAH
// ========================================

function requireUserWithLocation(
  telegramId
) {
  const userCheck =
    requireUser(telegramId);

  if (!userCheck.allowed) {
    return userCheck;
  }

  const locationCheck =
    requireLocation(telegramId);

  if (!locationCheck.allowed) {
    return locationCheck;
  }

  return {
    allowed: true,
    user: userCheck.user,
    locations:
      locationCheck.locations
  };
}

// ========================================
// EXPORT
// ========================================

module.exports = {
  requireUser,
  requireAdmin,
  requireLocation,
  requireUserWithLocation
};
