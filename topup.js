// topup.js
// Sistem TOP UP + informasi pembayaran

const topups = new Map();

// ========================================
// INFORMASI PEMBAYARAN
// ========================================

const paymentInfo = {
  seabank: {
    bankName: "SeaBank",
    accountNumber: "901040978290",
    accountName: "HAMBALI"
  },

  dana: {
    number: "083824101264",
    accountName: "HAMBALI"
  },

  gopay: {
    number: "083824101264",
    accountName: "HAMBALI"
  }
};

// ========================================
// ID TRANSAKSI
// ========================================

function generateTopupId() {
  const waktu = Date.now();

  const acak = Math.floor(
    1000 + Math.random() * 9000
  );

  return `TOPUP-${waktu}-${acak}`;
}

// ========================================
// MEMBUAT PERMINTAAN TOP UP
// ========================================

function createTopup(telegramId, amount) {
  const id = String(telegramId);
  const jumlah = Number(amount);

  if (!Number.isFinite(jumlah) || jumlah <= 0) {
    return {
      success: false,
      message: "❌ Nominal top up tidak valid."
    };
  }

  const transaksiId = generateTopupId();

  const transaksi = {
    id: transaksiId,
    telegramId: id,
    amount: jumlah,
    status: "PENDING",
    createdAt: new Date().toISOString()
  };

  if (!topups.has(id)) {
    topups.set(id, []);
  }

  topups.get(id).push(transaksi);

  return {
    success: true,
    transaction: transaksi
  };
}

// ========================================
// INFORMASI PEMBAYARAN
// ========================================

function getPaymentInfo() {
  return paymentInfo;
}

// ========================================
// PESAN INFORMASI TOP UP
// ========================================

function getPaymentMessage() {
  return (
    "💳 INFORMASI TOP UP\n\n" +

    "🏦 SEABANK\n" +
    "No. Rekening: 901040978290\n" +
    "Atas Nama: HAMBALI\n\n" +

    "💰 DANA\n" +
    "Nomor: 083824101264\n" +
    "Atas Nama: HAMBALI\n\n" +

    "💚 GOPAY\n" +
    "Nomor: 083824101264\n" +
    "Atas Nama: HAMBALI\n\n" +

    "📌 Silakan pilih salah satu metode pembayaran.\n\n" +

    "Setelah melakukan pembayaran,\n" +
    "kirim bukti pembayaran kepada admin."
  );
}

// ========================================
// AMBIL TOP UP USER
// ========================================

function getUserTopups(telegramId) {
  return topups.get(String(telegramId)) || [];
}

// ========================================
// AMBIL TOP UP BERDASARKAN ID
// ========================================

function getTopup(transactionId) {
  for (const userTopups of topups.values()) {
    const transaksi = userTopups.find(
      item => item.id === transactionId
    );

    if (transaksi) {
      return transaksi;
    }
  }

  return null;
}

// ========================================
// UPDATE STATUS TOP UP
// ========================================

function updateTopupStatus(transactionId, status) {
  const transaksi = getTopup(transactionId);

  if (!transaksi) {
    return {
      success: false,
      message: "❌ Transaksi tidak ditemukan."
    };
  }

  const allowedStatus = [
    "PENDING",
    "PAID",
    "REJECTED",
    "CANCELLED"
  ];

  if (!allowedStatus.includes(status)) {
    return {
      success: false,
      message: "❌ Status transaksi tidak valid."
    };
  }

  transaksi.status = status;
  transaksi.updatedAt = new Date().toISOString();

  return {
    success: true,
    transaction: transaksi
  };
}

// ========================================
// FORMAT RUPIAH
// ========================================

function formatRupiah(amount) {
  return `Rp${Number(amount).toLocaleString("id-ID")}`;
}

// ========================================
// EXPORT
// ========================================

module.exports = {
  topups,
  paymentInfo,
  generateTopupId,
  createTopup,
  getPaymentInfo,
  getPaymentMessage,
  getUserTopups,
  getTopup,
  updateTopupStatus,
  formatRupiah
};
