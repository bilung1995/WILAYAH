// ======================================================
// topup.js
// SISTEM TOP UP + BUKTI PEMBAYARAN
// ======================================================


// DATA REKENING

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
// PESAN TOP UP
// ======================================================

function getTopupMessage() {

  return (
    "💳 TOP UP SALDO\n\n" +

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
// STATUS TOP UP USER
// ======================================================

const pendingTopup = {};


// ======================================================
// USER MULAI TOP UP
// ======================================================

function startTopup(userId) {

  pendingTopup[userId] = {

    status: "waiting_proof",

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

  if (!pendingTopup[userId]) {

    return false;

  }


  pendingTopup[userId] = {

    ...pendingTopup[userId],

    status:
      "waiting_admin",

    photoId: photoId,

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
// ADMIN SETUJUI
// ======================================================

function approveTopup(userId) {

  if (!pendingTopup[userId]) {

    return false;

  }


  pendingTopup[userId].status =
    "approved";


  return true;

}


// ======================================================
// ADMIN TOLAK
// ======================================================

function rejectTopup(userId) {

  if (!pendingTopup[userId]) {

    return false;

  }


  pendingTopup[userId].status =
    "rejected";


  return true;

}



// ======================================================
// EXPORT
// ======================================================

module.exports = {

  paymentAccounts,

  getTopupMessage,

  startTopup,

  isWaitingProof,

  saveProof,

  getTopupData,

  approveTopup,

  rejectTopup

};
