// payment.js
// Sistem pembayaran / verifikasi top up

const {
  updateDatabase,
  readDatabase
} = require("./database");

// ========================================
// BUAT TRANSAKSI TOP UP
// ========================================

function createTopup(
  telegramId,
  amount
) {
  const transactionId =
    `TOPUP-${Date.now()}-${telegramId}`;

  const transaction = {
    id: transactionId,
    telegramId: String(telegramId),
    amount: Number(amount),
    status: "PENDING",
    createdAt:
      new Date().toISOString(),
    verifiedAt: null,
    verifiedBy: null
  };

  updateDatabase(database => {
    database.topups[transactionId] =
      transaction;
  });

  return transaction;
}

// ========================================
// AMBIL TRANSAKSI
// ========================================

function getTopup(transactionId) {
  const database =
    readDatabase();

  return (
    database.topups[
      transactionId
    ] || null
  );
}

// ========================================
// AMBIL TOP UP USER
// ========================================

function getUserTopups(telegramId) {
  const database =
    readDatabase();

  return Object.values(
    database.topups
  ).filter(
    item =>
      String(item.telegramId) ===
      String(telegramId)
  );
}

// ========================================
// VERIFIKASI TOP UP
// ========================================

function approveTopup(
  transactionId,
  adminId
) {
  const transaction =
    getTopup(transactionId);

  if (!transaction) {
    return {
      success: false,
      message:
        "❌ Transaksi tidak ditemukan."
    };
  }

  if (
    transaction.status !==
    "PENDING"
  ) {
    return {
      success: false,
      message:
        "⚠️ Transaksi sudah diproses."
    };
  }

  updateDatabase(database => {
    database.topups[
      transactionId
    ].status = "APPROVED";

    database.topups[
      transactionId
    ].verifiedAt =
      new Date().toISOString();

    database.topups[
      transactionId
    ].verifiedBy =
      String(adminId);
  });

  return {
    success: true,
    transaction:
      getTopup(transactionId)
  };
}

// ========================================
// TOLAK TOP UP
// ========================================

function rejectTopup(
  transactionId,
  adminId
) {
  const transaction =
    getTopup(transactionId);

  if (!transaction) {
    return {
      success: false,
      message:
        "❌ Transaksi tidak ditemukan."
    };
  }

  if (
    transaction.status !==
    "PENDING"
  ) {
    return {
      success: false,
      message:
        "⚠️ Transaksi sudah diproses."
    };
  }

  updateDatabase(database => {
    database.topups[
      transactionId
    ].status = "REJECTED";

    database.topups[
      transactionId
    ].verifiedAt =
      new Date().toISOString();

    database.topups[
      transactionId
    ].verifiedBy =
      String(adminId);
  });

  return {
    success: true,
    transaction:
      getTopup(transactionId)
  };
}

// ========================================
// FORMAT NOMINAL
// ========================================

function formatRupiah(amount) {
  return new Intl.NumberFormat(
    "id-ID",
    {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }
  ).format(Number(amount));
}

// ========================================
// FORMAT TRANSAKSI
// ========================================

function formatTopup(transaction) {
  if (!transaction) {
    return "❌ Transaksi tidak ditemukan.";
  }

  let status = "⏳ MENUNGGU";

  if (
    transaction.status ===
    "APPROVED"
  ) {
    status = "✅ DISETUJUI";
  }

  if (
    transaction.status ===
    "REJECTED"
  ) {
    status = "❌ DITOLAK";
  }

  return (
    `🧾 TRANSAKSI TOP UP\n\n` +
    `🆔 ID: ${transaction.id}\n` +
    `💰 Nominal: ${formatRupiah(
      transaction.amount
    )}\n` +
    `📊 Status: ${status}\n` +
    `📅 Dibuat: ${transaction.createdAt}`
  );
}

// ========================================
// EXPORT
// ========================================

module.exports = {
  createTopup,
  getTopup,
  getUserTopups,
  approveTopup,
  rejectTopup,
  formatRupiah,
  formatTopup
};
