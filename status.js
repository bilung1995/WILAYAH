// status.js
// Pengelola status user dan status layanan bot

// ========================================
// FORMAT STATUS USER
// ========================================

function getUserStatus(userData = {}) {
  const status = userData.status || "Aktif";

  const kota =
    userData.provinsi ||
    "Belum dipilih";

  const kabupaten =
    userData.kabupaten ||
    "Belum dipilih";

  const kecamatan =
    userData.kecamatan ||
    "Belum dipilih";

  const saldo =
    Number(userData.saldo || 0);

  return (
    "📊 STATUS AKUN\n\n" +

    `🟢 Status: ${status}\n\n` +

    "📍 WILAYAH\n" +
    `🇮🇩 Provinsi: ${kota}\n` +
    `🏙️ Kabupaten/Kota: ${kabupaten}\n` +
    `📌 Kecamatan: ${kecamatan}\n\n` +

    "💰 SALDO\n" +
    `Rp${saldo.toLocaleString("id-ID")}`
  );
}

// ========================================
// STATUS KONEKSI
// ========================================

function getConnectionStatus() {
  return (
    "📡 STATUS KONEKSI\n\n" +
    "🟢 Telegram: Terhubung\n" +
    "🟢 WhatsApp: Terhubung\n" +
    "🟢 Green API: Aktif\n" +
    "🟢 Server: Aktif"
  );
}

// ========================================
// STATUS LENGKAP
// ========================================

function getFullStatus(userData = {}) {
  return (
    getUserStatus(userData) +
    "\n\n" +
    getConnectionStatus()
  );
}

// ========================================
// EXPORT
// ========================================

module.exports = {
  getUserStatus,
  getConnectionStatus,
  getFullStatus
};
