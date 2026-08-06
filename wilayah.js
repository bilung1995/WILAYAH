const axios = require("axios");

const API =
  "https://www.emsifa.com/api-wilayah-indonesia/api";

let userWilayah = {};


// ================================
// TAMPIL PROVINSI
// ================================
async function showProvinsi(bot, chatId) {

  try {

    const res = await axios.get(
      `${API}/provinces.json`
    );

    let buttons = [];

    res.data.forEach((prov) => {

      buttons.push([
        {
          text: prov.name,
          callback_data:
            `prov_${prov.id}`
        }
      ]);

    });


    await bot.sendMessage(
      chatId,
      "🇮🇩 Pilih Provinsi:",
      {
        reply_markup: {
          inline_keyboard: buttons
        }
      }
    );


  } catch (err) {

    console.log(
      "Error provinsi:",
      err.message
    );

    bot.sendMessage(
      chatId,
      "❌ Gagal mengambil data provinsi."
    );

  }

}



// ================================
// TAMPIL KABUPATEN
// ================================
async function showKabupaten(
  bot,
  chatId,
  provId
) {

  try {

    const res = await axios.get(
      `${API}/regencies/${provId}.json`
    );


    let buttons = [];


    res.data.forEach((kab)=>{

      buttons.push([
        {
          text:kab.name,
          callback_data:
            `kab_${kab.id}`
        }
      ]);

    });


    await bot.sendMessage(
      chatId,
      "🏙 Pilih Kabupaten/Kota:",
      {
        reply_markup:{
          inline_keyboard:buttons
        }
      }
    );


  } catch(err){

    console.log(
      err.message
    );

  }

}



// ================================
// TAMPIL KECAMATAN
// ================================
async function showKecamatan(
  bot,
  chatId,
  kabId
){

  try {

    const res = await axios.get(
      `${API}/districts/${kabId}.json`
    );


    let buttons=[];


    res.data.forEach((kec)=>{

      buttons.push([
        {
          text:kec.name,
          callback_data:
            `kec_${kec.id}`
        }
      ]);

    });


    await bot.sendMessage(
      chatId,
      "📍 Pilih Kecamatan:",
      {
        reply_markup:{
          inline_keyboard:buttons
        }
      }
    );


  }catch(err){

    console.log(
      err.message
    );

  }

}



// ================================
// SIMPAN WILAYAH
// ================================
function simpanWilayah(
  chatId,
  wilayah
){

  userWilayah[chatId] =
    wilayah;

}



// ================================

module.exports = {

  showProvinsi,
  showKabupaten,
  showKecamatan,
  simpanWilayah

};
