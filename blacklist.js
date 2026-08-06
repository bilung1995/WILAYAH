// blacklist.js
// Pengelola nomor blacklist user

const blacklist = new Map();

// ========================================
// NORMALISASI NOMOR
// ========================================

function normalizeNumber(number) {
  if (!number) {
    return null;
  }

  let nomor = String(number)
    .trim()
    .replace(/[^\d+]/g, "");

  // 08xxxxxxxxxx -> 628xxxxxxxxxx
  if (nomor.startsWith("08")) {
    nomor = "62" + nomor.substring(1);
  }

  // +628xxxxxxxxxx -> 628xxxxxxxxxx
  if (nomor.startsWith("+62")) {
    nomor = "62" + nomor.substring(3);
  }

  return nomor;
}

// ========================================
// AMBIL BLACKLIST USER
// ========================================

function getBlacklist(telegramId) {
  const id = String(telegramId);

  if (!blacklist.has(id)) {
    blacklist.set(id, []);
  }

  return blacklist.get(id);
}

// ========================================
// TAMBAH NOMOR
// ========================================

function addBlacklist(telegramId, number) {
  const id = String(telegramId);
  const nomor = normalizeNumber(number);

  if (!nomor) {
    return {
      success: false,
      message: "❌ Nomor tidak valid."
    };
  }

  const list = getBlacklist(id);

  if (list.includes(nomor)) {
    return {
      success: false,
      message: "⚠️ Nomor tersebut sudah ada di blacklist."
    };
  }

  list.push(nomor);

  return {
    success: true,
    message: `✅ Nomor ${nomor} berhasil masuk blacklist.`,
    nomor
  };
}

// ========================================
// HAPUS NOMOR
// ========================================

function removeBlacklist(telegramId, number) {
  const id = String(telegramId);
  const nomor = normalizeNumber(number);

  const list = getBlacklist(id);

  const index = list.indexOf(nomor);

  if (index === -1) {
    return {
      success: false,
      message: "❌ Nomor tidak ditemukan di blacklist."
    };
  }

  list.splice(index, 1);

  return {
    success: true,
    message: `✅ Nomor ${nomor} dihapus dari blacklist.`,
    nomor
  };
}

// ========================================
// CEK NOMOR
// ========================================

function isBlacklisted(telegramId, number) {
  const nomor = normalizeNumber(number);

  if (!nomor) {
    return false;
  }

  return getBlacklist(telegramId).includes(nomor);
}

// ========================================
// HAPUS SEMUA BLACKLIST USER
// ========================================

function clearBlacklist(telegramId) {
  const id = String(telegramId);

  blacklist.set(id, []);

  return {
    success: true,
    message: "✅ Semua nomor blacklist telah dihapus."
  };
}

// ========================================
// EXPORT
// ========================================

module.exports = {
  blacklist,
  normalizeNumber,
  getBlacklist,
  addBlacklist,
  removeBlacklist,
  isBlacklisted,
  clearBlacklist
};
