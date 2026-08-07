const axios = require("axios");

const API =
  "https://www.emsifa.com/api-wilayah-indonesia/api";


// ================================
// PROVINSI
// ================================
async function showProvinsi(
  bot,
  chatId
) {

  try {

    const res =
      await axios.get(
        `${API}/provinces.json`
      );


    let buttons = [];


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
      "🇮🇩 Pilih Provinsi:",
      {
        reply_markup:{
          inline_keyboard:
            buttons
        }
      }
    );


  } catch(error){

    console.log(
      "ERROR PROVINSI:",
      error.message
    );

    await bot.sendMessage(
      chatId,
      "❌ Gagal mengambil data provinsi."
    );

  }

}



// ================================
// KABUPATEN / KOTA
// ================================
async function showKabupaten(
  bot,
  chatId,
  provData
){

  try {

    const data =
      provData.split("|");


    const provId =
      data[0];


    const provName =
      data[1];


    const res =
      await axios.get(
        `${API}/regencies/${provId}.json`
      );


    let buttons = [];


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
      "🏙 Pilih Kabupaten/Kota:",
      {
        reply_markup:{
          inline_keyboard:
            buttons
        }
      }
    );


  } catch(error){

    console.log(
      "ERROR KABUPATEN:",
      error.message
    );

    await bot.sendMessage(
      chatId,
      "❌ Gagal mengambil kabupaten."
    );

  }

}



// ================================
// KECAMATAN
// ================================
async function showKecamatan(
  bot,
  chatId,
  kabData
){

  try {


    const data =
      kabData.split("|");


    const kabId =
      data[0];


    const provName =
      data[1];


    const kabName =
      data[2];


    const res =
      await axios.get(
        `${API}/districts/${kabId}.json`
      );


    let buttons = [];


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
      "📍 Pilih Kecamatan:",
      {
        reply_markup:{
          inline_keyboard:
            buttons
        }
      }
    );


  } catch(error){

    console.log(
      "ERROR KECAMATAN:",
      error.message
    );


    await bot.sendMessage(
      chatId,
      "❌ Gagal mengambil kecamatan."
    );

  }

}



// ================================
// EXPORT
// ================================

module.exports = {

  showProvinsi,
  showKabupaten,
  showKecamatan

};
