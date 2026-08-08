// ======================================================
// FORWARD ROUTER
// WHATSAPP → TELEGRAM USER
// ======================================================

function normalisasi(text) {
  return String(text || "")
    .toUpperCase()
    .replace(/\s+/g, " ")
    .trim();
}


// ======================================================
// AMBIL ISI PESAN
// ======================================================

function ambilPesan(data) {

  return (
    data?.messageData?.textMessageData?.textMessage ||
    data?.messageData?.extendedTextMessageData?.text ||
    ""
  ).trim();

}


// ======================================================
// AMBIL KABUPATEN + KECAMATAN
// ======================================================

function ambilWilayah(pesan) {

  const lines = String(pesan)
    .split(/\r?\n/)
    .map(x => x.trim())
    .filter(Boolean);

  let kabupaten = "";
  let kecamatan = "";


  // FORMAT BERLABEL
  for (const line of lines) {

    let match = line.match(
      /^(?:KABUPATEN(?:\/KOTA)?|KAB)\s*:\s*(.+)$/i
    );

    if (match) {
      kabupaten = match[1].trim();
    }


    match = line.match(
      /^KEC(?:AMATAN)?\s*:\s*(.+)$/i
    );

    if (match) {
      kecamatan = match[1].trim();
    }

  }


  if (kabupaten && kecamatan) {

    return {
      kabupaten,
      kecamatan
    };

  }


  // FORMAT TANPA LABEL
  // BARIS 1 = PROVINSI
  // BARIS 2 = KABUPATEN/KOTA
  // BARIS 3 = KECAMATAN

  if (lines.length >= 3) {

    return {

      kabupaten: lines[1],

      kecamatan: lines[2]

    };

  }


  return null;

}


// ======================================================
// FORWARD
// ======================================================

async function forward(
  bot,
  database,
  data
) {

  console.log(
    "🚀 FORWARD-ROUTER DIJALANKAN"
  );


  const pesan =
    ambilPesan(data);

  if (!pesan) {

    console.log(
      "⚠️ FORWARD ROUTER: PESAN KOSONG"
    );

    return;

  }


  const wilayah =
    ambilWilayah(pesan);

  if (!wilayah) {

    console.log(
      "⚠️ FORWARD ROUTER: WILAYAH TIDAK DITEMUKAN"
    );

    return;

  }


  console.log(
    "🏙️ KABUPATEN:",
    wilayah.kabupaten
  );

  console.log(
    "📍 KECAMATAN:",
    wilayah.kecamatan
  );


  const kabupatenPesan =
    normalisasi(
      wilayah.kabupaten
    );

  const kecamatanPesan =
    normalisasi(
      wilayah.kecamatan
    );


  const locations =
    database.locations || {};

  let terkirim = 0;


  for (
    const chatId of
    Object.keys(locations)
  ) {

    const userLocations =
      locations[chatId];


    if (
      !Array.isArray(userLocations)
    ) {
      continue;
    }


    const cocok =
      userLocations.some(
        location => {

          const kabupatenUser =
            normalisasi(
              location.kabupaten
            );

          const kecamatanUser =
            normalisasi(
              location.kecamatan
            );


          return (

            kabupatenUser ===
            kabupatenPesan &&

            kecamatanUser ===
            kecamatanPesan

          );

        }
      );


    if (!cocok) {
      continue;
    }


    const namaGrup =
      data?.senderData?.chatName ||
      "Grup WhatsApp";

    const pengirim =
      data?.senderData?.senderName ||
      "Tidak diketahui";


    const pesanTelegram =

      "📢 PESAN WHATSAPP\n\n" +

      `👥 Grup: ${namaGrup}\n` +

      `👤 Pengirim: ${pengirim}\n\n` +

      `🏙️ Kabupaten/Kota: ${
        wilayah.kabupaten
      }\n` +

      `📍 Kecamatan: ${
        wilayah.kecamatan
      }\n\n` +

      "━━━━━━━━━━━━━━━━━━\n\n" +

      pesan;


    try {

      await bot.sendMessage(
        chatId,
        pesanTelegram
      );

      terkirim++;

      console.log(
        `✅ DITERUSKAN KE TELEGRAM: ${chatId}`
      );

    } catch (error) {

      console.error(
        `❌ GAGAL KIRIM ${chatId}:`,
        error.message
      );

    }

  }


  console.log(
    `📨 TOTAL TERKIRIM: ${terkirim}`
  );

}


// ======================================================
// EXPORT
// ======================================================

module.exports = {
  forward
};
