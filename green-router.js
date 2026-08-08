// ======================================================
// GREEN ROUTER
// WhatsApp Group → Telegram User
// Berdasarkan Kabupaten + Kecamatan
// ======================================================

async function forwardWhatsAppMessage(
  bot,
  database,
  data
) {

  try {

    // ==================================================
    // CEK DATA GREEN API
    // ==================================================

    const senderData =
      data?.senderData || {};

    const messageData =
      data?.messageData || {};

    // ==================================================
    // HANYA PROSES PESAN DARI GRUP
    // ==================================================

    const groupId =
      senderData.chatId || "";

    if (
      !groupId.endsWith("@g.us")
    ) {

      return;

    }

    // ==================================================
    // DATA GRUP
    // ==================================================

    const groupName =
      senderData.chatName ||
      "Grup WhatsApp";

    const senderName =
      senderData.senderName ||
      "Tidak diketahui";

    // ==================================================
    // AMBIL ISI PESAN
    // ==================================================

    const typeMessage =
      messageData.typeMessage || "";

    let messageText = "";

    if (
      typeMessage === "textMessage"
    ) {

      messageText =
        messageData
          ?.textMessageData
          ?.textMessage || "";

    }

    else if (
      typeMessage === "extendedTextMessage"
    ) {

      messageText =
        messageData
          ?.extendedTextMessageData
          ?.text || "";

    }

    else {

      messageText =
        messageData
          ?.textMessageData
          ?.textMessage ||
        messageData
          ?.extendedTextMessageData
          ?.text ||
        "";

    }

    // ==================================================
    // PESAN HARUS ADA
    // ==================================================

    if (!messageText.trim()) {

      console.log(
        "ℹ️ GREEN ROUTER: Pesan kosong."
      );

      return;

    }

    // ==================================================
    // CARI KABUPATEN
    // ==================================================

    const kabupatenMatch =
      messageText.match(
        /KABUPATEN\s*:\s*(.+)/i
      );

    // ==================================================
    // CARI KECAMATAN
    // ==================================================

    const kecamatanMatch =
      messageText.match(
        /KECAMATAN\s*:\s*(.+)/i
      );

    // ==================================================
    // KALAU FORMAT TIDAK SESUAI
    // ==================================================

    if (
      !kabupatenMatch ||
      !kecamatanMatch
    ) {

      console.log(
        "ℹ️ GREEN ROUTER: Kabupaten/kecamatan tidak ditemukan."
      );

      return;

    }

    // ==================================================
    // NORMALISASI
    // ==================================================

    const kabupaten =
      kabupatenMatch[1]
        .trim()
        .toUpperCase();

    const kecamatan =
      kecamatanMatch[1]
        .trim()
        .toUpperCase();

    console.log(
      "🏙️ ROUTER KABUPATEN:",
      kabupaten
    );

    console.log(
      "📍 ROUTER KECAMATAN:",
      kecamatan
    );

    // ==================================================
    // CEK DATABASE LOKASI
    // ==================================================

    if (
      !database.locations
    ) {

      console.log(
        "⚠️ DATABASE LOCATIONS TIDAK ADA."
      );

      return;

    }

    let jumlahTerkirim = 0;

    // ==================================================
    // CARI USER TELEGRAM
    // ==================================================

    for (
      const userId in database.locations
    ) {

      const locations =
        database.locations[userId];

      if (
        !Array.isArray(locations)
      ) {

        continue;

      }

      // ==================================================
      // CEK SETIAP WILAYAH USER
      // ==================================================

      const cocok =
        locations.some(
          location => {

            const userKabupaten =
              String(
                location?.kabupaten || ""
              )
                .trim()
                .toUpperCase();

            const userKecamatan =
              String(
                location?.kecamatan || ""
              )
                .trim()
                .toUpperCase();

            return (
              userKabupaten ===
                kabupaten &&
              userKecamatan ===
                kecamatan
            );

          }
        );

      // ==================================================
      // KALAU TIDAK COCOK
      // ==================================================

      if (!cocok) {

        continue;

      }

      // ==================================================
      // KIRIM KE TELEGRAM
      // ==================================================

      try {

        await bot.sendMessage(

          userId,

          "📢 PESAN WILAYAH ANDA\n\n" +

          `👥 Grup: ${groupName}\n` +

          `👤 Pengirim: ${senderName}\n\n` +

          `🏙️ Kabupaten: ${kabupaten}\n` +

          `📍 Kecamatan: ${kecamatan}\n\n` +

          "━━━━━━━━━━━━━━━━\n\n" +

          messageText

        );

        jumlahTerkirim++;

        console.log(
          `✅ PESAN DITERUSKAN → USER ${userId}`
        );

      } catch (error) {

        console.error(
          `❌ GAGAL KIRIM KE USER ${userId}:`,
          error.message
        );

      }

    }

    // ==================================================
    // HASIL ROUTER
    // ==================================================

    console.log(
      `📨 GREEN ROUTER SELESAI — TERKIRIM: ${jumlahTerkirim}`
    );

  } catch (error) {

    console.error(
      "❌ GREEN ROUTER ERROR:",
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
