// help.js
// Sistem bantuan bot Telegram

// ========================================
// PESAN BANTUAN UTAMA
// ========================================

function getHelpMessage() {
  return (
    "❓ BANTUAN BOT\n\n" +

    "🏙️ TAMBAH KOTA\n" +
    "Pilih provinsi, kabupaten/kota, lalu " +
    "kecamatan yang ingin Anda ikuti.\n\n" +

    "📍 KOTA YANG DIPILIH\n" +
    "Melihat wilayah yang sedang Anda ikuti.\n\n" +

    "👤 PROFIL\n" +
    "Melihat informasi akun, wilayah, saldo, " +
    "dan status Anda.\n\n" +

    "💳 TOP UP\n" +
    "Melakukan pengisian saldo melalui metode " +
    "pembayaran yang tersedia.\n\n" +

    "📊 STATUS\n" +
    "Melihat status akun dan koneksi layanan.\n\n" +

    "🚫 NOMOR BLACKLIST\n" +
    "Mengelola nomor WhatsApp yang ingin " +
    "Anda masukkan atau keluarkan dari blacklist.\n\n" +

    "👨‍💼 HUBUNGI ADMIN\n" +
    "Menghubungi admin apabila membutuhkan " +
    "bantuan lebih lanjut.\n\n" +

    "🛠️ PANEL ADMIN\n" +
    "Menu khusus administrator bot."
  );
}

// ========================================
// BANTUAN TAMBAH KOTA
// ========================================

function getLocationHelp() {
  return (
    "🏙️ CARA TAMBAH KOTA\n\n" +

    "1️⃣ Pilih provinsi.\n" +
    "2️⃣ Pilih kabupaten/kota.\n" +
    "3️⃣ Pilih kecamatan.\n" +
    "4️⃣ Konfirmasi wilayah yang dipilih.\n\n" +

    "Setelah wilayah tersimpan, pesan dari " +
    "wilayah tersebut dapat diteruskan ke akun Anda."
  );
}

// ========================================
// BANTUAN TOP UP
// ========================================

function getTopupHelp() {
  return (
    "💳 CARA TOP UP\n\n" +

    "1️⃣ Pilih menu TOP UP.\n" +
    "2️⃣ Masukkan nominal yang ingin diisi.\n" +
    "3️⃣ Pilih metode pembayaran.\n" +
    "4️⃣ Lakukan pembayaran.\n" +
    "5️⃣ Kirim bukti pembayaran kepada admin.\n\n" +

    "Saldo akan diproses setelah pembayaran " +
    "diverifikasi."
  );
}

// ========================================
// BANTUAN BLACKLIST
// ========================================

function getBlacklistHelp() {
  return (
    "🚫 NOMOR BLACKLIST\n\n" +

    "Gunakan menu ini untuk mengelola nomor " +
    "WhatsApp yang ingin Anda blacklist.\n\n" +

    "Anda dapat:\n" +
    "➕ Menambahkan nomor\n" +
    "➖ Menghapus nomor\n" +
    "📋 Melihat daftar nomor blacklist"
  );
}

// ========================================
// EXPORT
// ========================================

module.exports = {
  getHelpMessage,
  getLocationHelp,
  getTopupHelp,
  getBlacklistHelp
};
