const axios = require("axios");

const API =
  "https://www.emsifa.com/api-wilayah-indonesia/api";

let userWilayah = {};


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
              `prov_${prov.id}`
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

  }

}



// ================================
// KABUPATEN
// ================================
async function showKabupaten(
  bot,
  chatId,
  provId
){

  try {

    const res =
      await axios.get(
        `${API}/regencies/${provId}.json`
      );


    let buttons=[];


    res.data.forEach(
      kab => {

        buttons.push([
          {
            text:kab.name,
            callback_data:
              `kab_${kab.id}`
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

  }

}



// ================================
// KECAMATAN
// ================================
async function showKecamatan(
  bot,
  chatId,
  kabId
){

  try {

    const res =
      await axios.get(
        `${API}/districts/${kabId}.json`
      );


    let buttons=[];


    res.data.forEach(
      kec => {

        buttons.push([
          {
            text:kec.name,
            callback_data:
              `kec_${kec.id}`
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

  }

}



// ================================
// SIMPAN WILAYAH
// ================================
function simpanWilayah(
  chatId,
  data
){

  userWilayah[chatId] =
    data;


  return data;

}



// ================================
// AMBIL WILAYAH
// ================================
function getWilayah(
  chatId
){

  return userWilayah[chatId];

}



// ================================

module.exports = {

  showProvinsi,
  showKabupaten,
  showKecamatan,
  simpanWilayah,
  getWilayah

};
