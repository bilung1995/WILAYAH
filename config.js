// config.js
// Konfigurasi utama bot

// ========================================
// TELEGRAM
// ========================================

const TELEGRAM_TOKEN =
  process.env.TELEGRAM_TOKEN || "";

const ADMIN_IDS = process.env.ADMIN_IDS
  ? process.env.ADMIN_IDS
      .split(",")
      .map(id => id.trim())
      .filter(Boolean)
  : [];

// ========================================
// GREEN API
// ========================================

const GREEN_API_ID =
  process.env.GREEN_API_ID || "";

const GREEN_API_TOKEN =
  process.env.GREEN_API_TOKEN || "";

// ========================================
// SERVER
// ========================================

const PORT =
  Number(process.env.PORT) || 3000;

// ========================================
// KONTAK ADMIN
// ========================================

const ADMIN_NAME =
  process.env.ADMIN_NAME || "HAMBALI";

const ADMIN_USERNAME =
  process.env.ADMIN_USERNAME || "Hambali1995";

const ADMIN_CONTACT_ID =
  process.env.ADMIN_CONTACT_ID || "";

// ========================================
// VALIDASI KONFIGURASI
// ========================================

function checkConfig() {
  const missing = [];

  if (!TELEGRAM_TOKEN) {
    missing.push("TELEGRAM_TOKEN");
  }

  if (!GREEN_API_ID) {
    missing.push("GREEN_API_ID");
  }

  if (!GREEN_API_TOKEN) {
    missing.push("GREEN_API_TOKEN");
  }

  if (missing.length > 0) {
    console.warn(
      "⚠️ ENV BELUM LENGKAP:",
      missing.join(", ")
    );

    return false;
  }

  return true;
}

// ========================================
// EXPORT
// ========================================

module.exports = {
  TELEGRAM_TOKEN,
  ADMIN_IDS,

  GREEN_API_ID,
  GREEN_API_TOKEN,

  PORT,

  ADMIN_NAME,
  ADMIN_USERNAME,
  ADMIN_CONTACT_ID,

  checkConfig
};
