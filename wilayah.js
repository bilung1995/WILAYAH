const axios = require("axios");

const API =
  "https://www.emsifa.com/api-wilayah-indonesia/api";

// ======================================================
// PROVINSI
// ======================================================

async function showProvinsi(
  bot,
  chatId
) {

  try {

    const res =
      await axios.get(
        `${API}/provinces.json`
      );

    const buttons = [];

    res.data.forEach(
      prov => {

        buttons.push([
          {
            text: prov.name,

            callback_data:
              `prov_${prov.id}|${prov.name}`
          }
        ]);

      }
    );

    await bot.sendMessage(

      chatId,

      "🇮🇩 PILIH PROVINSI:",

      {
        reply_markup: {
          inline_keyboard:
            buttons
        }
      }

    );

  } catch (error) {

    console.error(
      "❌ ERROR PROVINSI:",
      error.message
    );

    await bot.sendMessage(
      chatId,
      "❌ Gagal mengambil data provinsi."
    );

  }

}


// ======================================================
// KABUPATEN / KOTA
// ======================================================

async function showKabupaten(
  bot,
  chatId,
  provData
) {

  try {

    const data =
      String(provData).split("|");

    const provId =
      data[0] || "";

    const provName =
      data.slice(1).join("|") || "";

    if (!provId) {

      await bot.sendMessage(
        chatId,
        "❌ Data provinsi tidak valid."
      );

      return;
    }

    const res =
      await axios.get(
        `${API}/regencies/${provId}.json`
      );

    const buttons = [];

    res.data.forEach(
      kab => {

        buttons.push([
          {
            text: kab.name,

            callback_data:
              `kab_${kab.id}|${provName}|${kab.name}`
          }
        ]);

      }
    );

    await bot.sendMessage(

      chatId,

      "🏙️ PILIH KABUPATEN/KOTA:",

      {
        reply_markup: {
          inline_keyboard:
            buttons
        }
      }

    );

  } catch (error) {

    console.error(
      "❌ ERROR KABUPATEN:",
      error.message
    );

    await bot.sendMessage(
      chatId,
      "❌ Gagal mengambil data kabupaten/kota."
    );

  }

}


// ======================================================
// KECAMATAN
// ======================================================

async function showKecamatan(
  bot,
  chatId,
  kabData
) {

  try {

    const data =
      String(kabData).split("|");

    const kabId =
      data[0] || "";

    const provName =
      data[1] || "";

    const kabName =
      data[2] || "";

    if (!kabId) {

      await bot.sendMessage(
        chatId,
        "❌ Data kabupaten/kota tidak valid."
      );

      return;
    }

    const res =
      await axios.get(
        `${API}/districts/${kabId}.json`
      );

    const buttons = [];

    res.data.forEach(
      kec => {

        buttons.push([
          {
            text: kec.name,

            callback_data:
              `kec_${kec.id}|${provName}|${kabName}|${kec.name}`
          }
        ]);

      }
    );

    await bot.sendMessage(

      chatId,

      "📍 PILIH KECAMATAN:",

      {
        reply_markup: {
          inline_keyboard:
            buttons
        }
      }

    );

  } catch (error) {

    console.error(
      "❌ ERROR KECAMATAN:",
      error.message
    );

    await bot.sendMessage(
      chatId,
      "❌ Gagal mengambil data kecamatan."
    );

  }

}


// ======================================================
// EXPORT
// ======================================================

module.exports = {
  showProvinsi,
  showKabupaten,
  showKecamatan
};
