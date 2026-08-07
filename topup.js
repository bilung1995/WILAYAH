// ======================================================
// topup.js
// SISTEM TOP UP + BUKTI PEMBAYARAN + KUOTA WILAYAH
// 1 TOP UP = 2 KUOTA WILAYAH
// ======================================================


// ======================================================
// DATA REKENING
// ======================================================

const paymentAccounts = {

  seabank: {
    bank: "SEABANK",
    nomor: "901040978290",
    nama: "HAMBALI"
  },

  dana: {
    bank: "DANA",
    nomor: "083824101264",
    nama: "HAMBALI"
  },

  gopay: {
    bank: "GOPAY",
    nomor: "083824101264",
    nama: "HAMBALI"
  }

};


// ======================================================
// JUMLAH KUOTA SETIAP TOP UP
// ======================================================

const TOPUP_QUOTA = 2;


// ======================================================
// PESAN TOP UP
// ======================================================

function getTopupMessage() {

  return (
    "💳 TOP UP KUOTA WILAYAH\n\n" +

    "1 kali TOP UP = 2 kali tambah wilayah.\n\n" +

    "Silakan transfer ke salah satu rekening berikut:\n\n" +

    "🏦 SEABANK\n" +
    "Nomor: 901040978290\n" +
    "Nama: HAMBALI\n\n" +

    "💰 DANA\n" +
    "Nomor: 083824101264\n" +
    "Nama: HAMBALI\n\n" +

    "💳 GOPAY\n" +
    "Nomor: 083824101264\n" +
    "Nama: HAMBALI\n\n" +

    "━━━━━━━━━━━━━━\n" +

    "Setelah transfer:\n" +
    "📸 Kirim foto bukti pembayaran di chat ini.\n\n" +

    "⏳ Setelah bukti diterima, " +
    "tunggu persetujuan admin."
  );

}


// ======================================================
// DATA TOP UP YANG SEDANG DIPROSES
// ======================================================

const pendingTopup = {};


// ======================================================
// USER MULAI TOP UP
// ======================================================

function startTopup(userId) {

  pendingTopup[userId] = {

    status:
      "waiting_proof",

    createdAt:
      new Date().toISOString()

  };


  return true;

}


// ======================================================
// CEK USER MENUNGGU BUKTI
// ======================================================

function isWaitingProof(userId) {

  return (
    pendingTopup[userId] &&
    pendingTopup[userId].status ===
      "waiting_proof"
  );

}


// ======================================================
// SIMPAN BUKTI FOTO
// ======================================================

function saveProof(
  userId,
  photoId
) {

  if (
    !pendingTopup[userId]
  ) {

    return false;

  }


  pendingTopup[userId] = {

    ...pendingTopup[userId],

    status:
      "waiting_admin",

    photoId:
      photoId,

    updatedAt:
      new Date().toISOString()

  };


  return true;

}


// ======================================================
// AMBIL DATA TOP UP
// ======================================================

function getTopupData(userId) {

  return pendingTopup[userId];

}


// ======================================================
// CEK APAKAH TOP UP MENUNGGU ADMIN
// ======================================================

function isWaitingAdmin(userId) {

  return (
    pendingTopup[userId] &&
    pendingTopup[userId].status ===
      "waiting_admin"
  );

}


// ======================================================
// ADMIN SETUJUI TOP UP
// ======================================================
// Setiap TOP UP disetujui:
// +2 kuota wilayah
// ======================================================

function approveTopup(userId) {

  if (
    !pendingTopup[userId]
  ) {

    return {

      success: false,

      quotaAdded: 0

    };

  }


  if (
    pendingTopup[userId].status !==
      "waiting_admin"
  ) {

    return {

      success: false,

      quotaAdded: 0

    };

  }


  pendingTopup[userId].status =
    "approved";


  pendingTopup[userId].quotaAdded =
    TOPUP_QUOTA;


  pendingTopup[userId].approvedAt =
    new Date().toISOString();


  return {

    success: true,

    quotaAdded:
      TOPUP_QUOTA

  };

}


// ======================================================
// ADMIN TOLAK TOP UP
// ======================================================

function rejectTopup(userId) {

  if (
    !pendingTopup[userId]
  ) {

    return false;

  }


  if (
    pendingTopup[userId].status !==
      "waiting_admin"
  ) {

    return false;

  }


  pendingTopup[userId].status =
    "rejected";


  pendingTopup[userId].rejectedAt =
    new Date().toISOString();


  return true;

}


// ======================================================
// AMBIL JUMLAH KUOTA TOP UP
// ======================================================

function getTopupQuota() {

  return TOPUP_QUOTA;

}


// ======================================================
// EXPORT
// ======================================================

module.exports = {

  paymentAccounts,

  TOPUP_QUOTA,

  getTopupMessage,

  startTopup,

  isWaitingProof,

  saveProof,

  getTopupData,

  isWaitingAdmin,

  approveTopup,

  rejectTopup,

  getTopupQuota

};
