// blacklistManager.js
// Sistem pengelolaan nomor blacklist WhatsApp

const {
  readDatabase,
  updateDatabase
} = require("./database");

// ========================================
// NORMALISASI NOMOR
// ========================================

function normalizeNumber(number) {
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

  if (value.endsWith("@c.us")) {
    value = value.replace("@c.us", "");
  }

  return value;
}

// ========================================
// AMBIL DAFTAR BLACKLIST
// ========================================

function getBlacklist() {
  const database = readDatabase();

  if (!database.blacklist) {
    return [];
  }

  return Array.isArray(database.blacklist)
    ? database.blacklist
    : Object.values(database.blacklist);
}

// ========================================
// CEK NOMOR BLACKLIST
// ========================================

function isBlacklisted(number) {
  const normalized =
    normalizeNumber(number);

  if (!normalized) {
    return false;
  }

  return getBlacklist().some(
    item =>
      normalizeNumber(
        typeof item === "string"
          ? item
          : item.number
      ) === normalized
  );
}

// ========================================
// TAMBAH NOMOR BLACKLIST
// ========================================

function addBlacklist(
  number,
  reason = ""
) {
  const normalized =
    normalizeNumber(number);

  if (!normalized) {
    return {
      success: false,
      message:
        "❌ Nomor WhatsApp tidak valid."
    };
  }

  if (isBlacklisted(normalized)) {
    return {
      success: false,
      message:
        "⚠️ Nomor tersebut sudah ada di blacklist."
    };
  }

  const item = {
    number: normalized,
    reason: reason || "Tidak ada alasan",
    createdAt:
      new Date().toISOString()
  };

  updateDatabase(database => {
    if (!Array.isArray(database.blacklist)) {
      database.blacklist = [];
    }

    database.blacklist.push(item);
  });

  return {
    success: true,
    item
  };
}

// ========================================
// HAPUS NOMOR BLACKLIST
// ========================================

function removeBlacklist(number) {
  const normalized =
    normalizeNumber(number);

  if (!normalized) {
    return {
      success: false,
      message:
        "❌ Nomor WhatsApp tidak valid."
    };
  }

  const database =
    readDatabase();

  if (!Array.isArray(database.blacklist)) {
    database.blacklist = [];
  }

  const index =
    database.blacklist.findIndex(
      item =>
        normalizeNumber(
          item.number
        ) === normalized
    );

  if (index === -1) {
    return {
      success: false,
      message:
        "❌ Nomor tidak ditemukan di blacklist."
    };
  }

  const removed =
    database.blacklist.splice(
      index,
      1
    )[0];

  updateDatabase(database => {
    database.blacklist = database.blacklist || [];

    const removeIndex =
      database.blacklist.findIndex(
        item =>
          normalizeNumber(
            item.number
          ) === normalized
      );

    if (removeIndex !== -1) {
      database.blacklist.splice(
        removeIndex,
        1
      );
    }
  });

  return {
    success: true,
    item: removed
  };
}

// ========================================
// FORMAT DAFTAR BLACKLIST
// ========================================

function formatBlacklist() {
  const list =
    getBlacklist();

  if (list.length === 0) {
    return (
      "🚫 NOMOR BLACKLIST\n\n" +
      "Belum ada nomor yang masuk blacklist."
    );
  }

  let message =
    "🚫 NOMOR BLACKLIST\n\n";

  list.forEach((item, index) => {
    const number =
      typeof item === "string"
        ? item
        : item.number;

    const reason =
      typeof item === "string"
        ? ""
        : item.reason;

    message +=
      `${index + 1}. ${number}\n`;

    if (reason) {
      message +=
        `   Alasan: ${reason}\n`;
    }

    message += "\n";
  });

  message +=
    `📊 Total: ${list.length} nomor`;

  return message;
}

// ========================================
// EXPORT
// ========================================

module.exports = {
  normalizeNumber,
  getBlacklist,
  isBlacklisted,
  addBlacklist,
  removeBlacklist,
  formatBlacklist
};
