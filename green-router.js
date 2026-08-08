// ======================================================
// GREEN ROUTER
// WHATSAPP → TELEGRAM BERDASARKAN KABUPATEN + KECAMATAN
// ======================================================


// ======================================================
// AMBIL ISI PESAN WHATSAPP
// ======================================================

function getWhatsAppText(data) {

  return (
    data?.messageData?.textMessageData?.textMessage ||
    data?.messageData?.extendedTextMessageData?.text ||
    ""
  ).trim();

}


// ======================================================
// NORMALISASI TEKS
// ======================================================

function normalizeText(text) {

  return String(text || "")
    .toUpperCase()
    .replace(/\s+/g, " ")
    .trim();

}


// ======================================================
// CARI WILAYAH DARI PESAN
// ======================================================

function getWilayahFromMessage(text) {

  const originalLines =
    String(text || "")
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(Boolean);

  if (originalLines.length < 3) {
    return null;
  }


  // ====================================================
  // FORMAT DENGAN LABEL
  //
  // KABUPATEN : KAB SERANG
  // KECAMATAN : LEBAK WANGI
  // ====================================================

  let kabupaten = "";
  let kecamatan = "";

  for (const line of originalLines) {

    const kabMatch =
      line.match(
        /^KABUPATEN(?:\/KOTA)?\s*:\s*(.+)$/i
      );

    if (kabMatch) {
      kabupaten = kabMatch[1].trim();
    }


    const kecMatch =
      line.match(
        /^KECAMATAN\s*:\s*(.+)$/i
      );

    if (kecMatch) {
      kecamatan = kecMatch[1].trim();
    }

  }


  if (kabupaten && kecamatan) {

    return {
      kabupaten,
      kecamatan
    };

  }


  // ====================================================
  // FORMAT TANPA LABEL
  //
  // PAPUA
  // KOTA JAYAPURA
  // JAYAPURA UTARA
  // ROMBON
  //
  // Baris 1 = Provinsi
  // Baris 2 = Kabupaten/Kota
  // Baris 3 = Kecamatan
  // ====================================================

  if (originalLines.length >= 3) {

    const kemungkinanKabupaten =
      originalLines[1];

    const kemungkinanKecamatan =
      originalLines[2];


    // Jangan ambil baris yang jelas bukan wilayah

    const bukanWilayah =
      /^(SALDO|LANJUT|DPT|HARGA|RP|JUAL|BUTUH|INFO)/i;


    if (
      !bukanWilayah.test(
        kemungkinanKabupaten
      ) &&
      !bukanWilayah.test(
        kemungkinanKecamatan
      )
    ) {

      return {

        kabupaten:
          kemungkinanKabupaten,

        kecamatan:
          kemungkinanKecamatan

      };

    }

  }


  return null;

}


// ======================================================
// TERUSKAN PESAN KE USER TELEGRAM
// ======================================================

async function forwardWhatsAppMessage(
  bot,
  database,
  data
) {

  try {

    const isiPesan =
      getWhatsAppText(data);


    // ==================================================
    // TIDAK ADA PESAN
    // ==================================================

    if (!isiPesan) {

      console.log(
        "⚠️ GREEN ROUTER: pesan kosong."
      );

      return;

    }


    // ==================================================
    // AMBIL WILAYAH
    // ==================================================

    const wilayahPesan =
      getWilayahFromMessage(
        isiPesan
      );


    if (!wilayahPesan) {

      console.log(
        "⚠️ GREEN ROUTER: Kabupaten/Kecamatan tidak ditemukan."
      );

      return;

    }


    const kabupatenPesan =
      normalizeText(
        wilayahPesan.kabupaten
      );

    const kecamatanPesan =
      normalizeText(
        wilayahPesan.kecamatan
      );


    console.log(
      "📍 ROUTER KABUPATEN:",
      wilayahPesan.kabupaten
    );

    console.log(
      "📍 ROUTER KECAMATAN:",
      wilayahPesan.kecamatan
    );


    // ==================================================
    // CARI USER TELEGRAM
    // ==================================================

    const users =
      database.users || {};

    const locations =
      database.locations || {};


    let jumlahTerkirim = 0;


    for (
      const chatId of Object.keys(users)
    ) {

      const userLocations =
        locations[chatId];


      if (
        !Array.isArray(userLocations) ||
        userLocations.length === 0
      ) {

        continue;

      }


      // ================================================
      // CEK WILAYAH USER
      // ================================================

      const cocok =
        userLocations.some(
          location => {

            const kabupatenUser =
              normalizeText(
                location.kabupaten
              );

            const kecamatanUser =
              normalizeText(
                location.kecamatan
              );


            return (

              kabupatenUser ===
              kabupatenPesan

              &&

              kecamatanUser ===
              kecamatanPesan

            );

          }
        );


      if (!cocok) {
        continue;
      }


      // ================================================
      // INFO GRUP & PENGIRIM
      // ================================================

      const namaGrup =
        data?.senderData?.chatName ||
        "Grup WhatsApp";

      const namaPengirim =
        data?.senderData?.senderName ||
        "Tidak diketahui";


      // ================================================
      // PESAN UNTUK TELEGRAM
      // ================================================

      const pesanTelegram =

        "📢 PESAN WHATSAPP MASUK\n\n" +

        `👥 Grup: ${namaGrup}\n` +

        `👤 Pengirim: ${namaPengirim}\n\n` +

        `📍 Kabupaten/Kota: ${
          wilayahPesan.kabupaten
        }\n` +

        `📍 Kecamatan: ${
          wilayahPesan.kecamatan
        }\n\n` +

        "━━━━━━━━━━━━━━━━━━\n\n" +

        isiPesan;


      // ================================================
      // KIRIM KE USER
      // ================================================

      try {

        await bot.sendMessage(
          chatId,
          pesanTelegram
        );


        jumlahTerkirim++;


        console.log(
          `✅ PESAN DITERUSKAN → ${chatId}`
        );

      } catch (error) {

        console.error(
          `❌ GAGAL KIRIM KE ${chatId}:`,
          error.message
        );

      }

    }


    // ==================================================
    // HASIL ROUTER
    // ==================================================

    console.log(
      `📨 ROUTER SELESAI — TERKIRIM: ${jumlahTerkirim}`
    );


  } catch (error) {

    console.error(
      "❌ ERROR GREEN ROUTER:",
      error
    );

  }

}


// ======================================================
// EXPORT
// ======================================================

module.exports = {

  forwardWhatsAppMessage

};
