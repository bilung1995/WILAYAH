// utils.js
// Fungsi bantuan umum bot

// ========================================
// FORMAT RUPIAH
// ========================================

function formatRupiah(amount) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(Number(amount) || 0);
}

// ========================================
// NORMALISASI TELEGRAM ID
// ========================================

function normalizeTelegramId(id) {
  if (id === undefined || id === null) {
    return null;
  }

  return String(id).trim();
}

// ========================================
// NORMALISASI NOMOR WHATSAPP
// ========================================

function normalizeWhatsAppNumber(number) {
  if (!number) {
    return null;
  }

  let value = String(number)
    .trim()
    .replace(/[^\d+]/g, "");

  if (value.startsWith("+62")) {
    value = "62" + value.substring(3);
  }

  if (value.startsWith("08")) {
    value = "62" + value.substring(1);
  }

  return value;
}

// ========================================
// WAKTU INDONESIA
// ========================================

function getIndonesiaTime() {
  return new Intl.DateTimeFormat(
    "id-ID",
    {
      timeZone: "Asia/Jakarta",
      dateStyle: "full",
      timeStyle: "medium"
    }
  ).format(new Date());
}

// ========================================
// POTONG PESAN PANJANG
// ========================================

function truncateText(
  text,
  maxLength = 4000
) {
  if (!text) {
    return "";
  }

  const value = String(text);

  if (value.length <= maxLength) {
    return value;
  }

  return (
    value.substring(
      0,
      maxLength - 3
    ) + "..."
  );
}

// ========================================
// ESCAPE HTML TELEGRAM
// ========================================

function escapeHtml(text) {
  if (!text) {
    return "";
  }

  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// ========================================
// EXPORT
// ========================================

module.exports = {
  formatRupiah,
  normalizeTelegramId,
  normalizeWhatsAppNumber,
  getIndonesiaTime,
  truncateText,
  escapeHtml
};
