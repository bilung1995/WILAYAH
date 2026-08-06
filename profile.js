// profile.js
// Fungsi untuk menampilkan profil user Telegram

function getProfileText(user, userData = {}) {
  const firstName = user?.first_name || "-";
  const lastName = user?.last_name || "";
  const fullName = `${firstName} ${lastName}`.trim();

  const username = user?.username
    ? `@${user.username}`
    : "Tidak ada";

  const chatId = user?.id || "-";

  const kota = userData.kota || "Belum dipilih";
  const kecamatan = userData.kecamatan || "Belum dipilih";
  const saldo = userData.saldo ?? 0;
  const status = userData.status || "Aktif";

  return (
    "👤 PROFIL\n\n" +
    `👤 Nama: ${fullName}\n` +
    `🔖 Username: ${username}\n` +
    `🆔 Chat ID: ${chatId}\n\n` +
    `🏙️ Kota: ${kota}\n` +
    `📍 Kecamatan: ${kecamatan}\n\n` +
    `💰 Saldo: Rp${Number(saldo).toLocaleString("id-ID")}\n` +
    `📊 Status: ${status}`
  );
}

module.exports = {
  getProfileText
};
