// ======================================================
// blacklist.js
// DATABASE NOMOR BLACKLIST
// ======================================================

const blacklistNumbers = [
  "081234567890",
  "082345678901",
  "083456789012"
];


// ======================================================
// TAMPILKAN NOMOR BLACKLIST
// ======================================================

function getBlacklistList() {

  if (blacklistNumbers.length === 0) {

    return (
      "🚫 DATABASE NOMOR BLACKLIST\n\n" +
      "Belum ada nomor blacklist."
    );

  }


  let text =
    "🚫 DATABASE NOMOR BLACKLIST\n\n";


  blacklistNumbers.forEach(
    (number, index) => {

      text +=
        `${index + 1}. ${number}\n`;

    }
  );


  text +=
    "\n⚠️ Hindari melakukan transaksi dengan nomor di atas.";

  return text;
}


module.exports = {
  blacklistNumbers,
  getBlacklistList
};
