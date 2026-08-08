// ======================================================
// GREEN ROUTER
// WHATSAPP GROUP → TELEGRAM USER
// COCOK KABUPATEN/KOTA + KECAMATAN
// ======================================================


// ======================================================
// NORMALISASI
// ======================================================

function normalisasi(text) {

  return String(text || "")
    .toUpperCase()
    .replace(/\r/g, "")
    .replace(/[：]/g, ":")
    .replace(/\s+/g, " ")
    .trim();

}


// ======================================================
// AMBIL ISI PESAN GREEN API
// ======================================================

function ambilIsiPesan(data) {

  return (

    data?.messageData?.textMessageData?.textMessage ||

    data?.messageData?.extendedTextMessageData?.text ||

    data?.messageData?.quotedMessageData?.textMessage ||

    ""

  ).trim();

}


// ======================================================
// AMBIL KABUPATEN + KECAMATAN
// ======================================================

function ambilWilayah(pesan) {

  const lines =
    String(pesan || "")
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(Boolean);


  let kabupaten = "";
  let kecamatan = "";


  // ====================================================
  // FORMAT:
  //
  // KABUPATEN : KAB SERANG
  // KECAMATAN : LEBAK WANGI
  // ====================================================

  for (
    const line of lines
  ) {

    let match =
      line.match(
        /^KABUPATEN(?:\/KOTA)?\s*:\s*(.+)$/i
      );

    if (match) {

      kabupaten =
        match[1].trim();

    }


    match =
      line.match(
        /^KECAMATAN\s*:\s*(.+)$/i
      );

    if (match) {

      kecamatan =
        match[1].trim();

    }

  }


  if (
    kabupaten &&
    kecamatan
  ) {

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
  // BARIS 1 = PROVINSI
  // BARIS 2 = KABUPATEN/KOTA
  // BARIS 3 = KECAMATAN
  // ====================================================

  if (lines.length >= 3) {

    const calonKabupaten =
      lines[1];

    const calonKecamatan =
      lines[2];


    if (
      calonKabupaten &&
      calonKecamatan
    ) {

      return {

        kabupaten:
          calonKabupaten,

        kecamatan:
          calonKecamatan

      };

    }

  }


  return null;

}


// ======================================================
// CEK WILAYAH USER
// ======================================================

function wilayahCocok(
  location,
  kabupatenPesan,
  kecamatanPesan
) {

  if (!location) {
    return false;
  }


  const kabupatenUser =
    normalisasi(
      location.kabupaten ||
      location.kabupatenName ||
      location.namaKabupaten ||
      ""
    );


  const kecamatanUser =
    normalisasi(
      location.kecamatan ||
      location.kecamatanName ||
      location.namaKecamatan ||
      ""
    );


  const kabupaten =
    normalisasi(
      kabupatenPesan
    );


  const kecamatan =
    normalisasi(
      kecamatanPesan
    );


  console.log(
    "🔎 CEK USER:",
    location
  );

  console.log(
    "🏙️ USER KABUPATEN:",
    kabupatenUser
  );

  console.log(
    "📍 USER KECAMATAN:",
    kecamatanUser
  );

  console.log(
    "🏙️ PESAN KABUPATEN:",
    kabupaten
  );

  console.log(
    "📍 PESAN KECAMATAN:",
    kecamatan
  );


  return (

    kabupatenUser ===
    kabupaten &&

    kecamatanUser ===
    kecamatan

  );

}


// ======================================================
// FORWARD PESAN
// ======================================================

async function forwardWhatsAppMessage(
  bot,
  database,
  data
) {

  try {

    console.log(
      "======================================"
    );

    console.log(
      "🚀 GREEN ROUTER DIJALANKAN"
    );


    // ==================================================
    // CEK GRUP
    // ==================================================

    const chatIdWA =
      data?.senderData?.chatId ||
      "";

    if (
      !chatIdWA.endsWith("@g.us")
    ) {

      console.log(
        "ℹ️ BUKAN PESAN GRUP WHATSAPP."
      );

      return;

    }


    // ==================================================
    // DATA GRUP
    // ==================================================

    const namaGrup =
      data?.senderData?.chatName ||
      "Grup WhatsApp";


    const namaPengirim =
      data?.senderData?.senderName ||
      "Tidak diketahui";


    // ==================================================
    // ISI PESAN
    // ==================================================

    const isiPesan =
      ambilIsiPesan(data);


    if (!isiPesan) {

      console.log(
        "⚠️ GREEN ROUTER: ISI PESAN KOSONG."
      );

      return;

    }


    console.log(
      "👥 GRUP:",
      namaGrup
    );

    console.log(
      "👤 PENGIRIM:",
      namaPengirim
    );

    console.log(
      "📝 PESAN:",
      isiPesan
    );


    // ==================================================
    // AMBIL WILAYAH
    // ==================================================

    const wilayahPesan =
      ambilWilayah(
        isiPesan
      );


    if (!wilayahPesan) {

      console.log(
        "⚠️ KABUPATEN/KECAMATAN TIDAK DITEMUKAN."
      );

      return;

    }


    console.log(
      "🏙️ KABUPATEN PESAN:",
      wilayahPesan.kabupaten
    );

    console.log(
      "📍 KECAMATAN PESAN:",
      wilayahPesan.kecamatan
    );


    // ==================================================
    // DATABASE USER
    // ==================================================

    if (
      !database ||
      !database.users ||
      !database.locations
    ) {

      console.log(
        "❌ DATABASE USER/LOCATIONS TIDAK TERSEDIA."
      );

      return;

    }


    let jumlahUser =
      0;

    let jumlahTerkirim =
      0;


    // ==================================================
    // LOOP SEMUA USER
    // ==================================================

    for (
      const userId of
      Object.keys(
        database.users
      )
    ) {

      const locations =
        database.locations[userId];


      if (
        !Array.isArray(
          locations
        )
      ) {

        continue;

      }


      jumlahUser++;


      // =================================================
      // CEK WILAYAH
      // =================================================

      const cocok =
        locations.some(
          location =>

            wilayahCocok(

              location,

              wilayahPesan.kabupaten,

              wilayahPesan.kecamatan

            )
        );


      if (!cocok) {

        continue;

      }


      console.log(
        `🎯 USER COCOK: ${userId}`
      );


      // =================================================
      // PESAN TELEGRAM
      // =================================================

      const pesanTelegram =

        "📢 PESAN DARI WHATSAPP\n\n" +

        `👥 Grup: ${namaGrup}\n` +

        `👤 Pengirim: ${namaPengirim}\n\n` +

        `🏙️ Kabupaten/Kota: ${
          wilayahPesan.kabupaten
        }\n` +

        `📍 Kecamatan: ${
          wilayahPesan.kecamatan
        }\n\n` +

        "━━━━━━━━━━━━━━━━━━\n\n" +

        isiPesan;


      // =================================================
      // KIRIM TELEGRAM
      // =================================================

      try {

        await bot.sendMessage(

          userId,

          pesanTelegram

        );


        jumlahTerkirim++;


        console.log(
          `✅ BERHASIL DIKIRIM KE TELEGRAM: ${userId}`
        );


      } catch (error) {

        console.error(

          `❌ GAGAL KIRIM KE ${userId}:`,

          error.message

        );

      }

    }


    // ==================================================
    // HASIL AKHIR
    // ==================================================

    console.log(
      "👥 USER DENGAN DATA LOKASI:",
      jumlahUser
    );

    console.log(
      "📨 TOTAL PESAN TERKIRIM:",
      jumlahTerkirim
    );

    console.log(
      "======================================"
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
