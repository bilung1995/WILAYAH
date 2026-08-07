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
            `prov_${prov.id}_${prov.name}`
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

}



// ================================
// KABUPATEN
// ================================
async function showKabupaten(
  bot,
  chatId,
  provData
){

  const [
    provId,
    provName
  ] =
    provData.split("|");


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

}



// ================================
// KECAMATAN
// ================================
async function showKecamatan(
  bot,
  chatId,
  kabData
){

  const [
    kabId,
    provName,
    kabName
  ] =
    kabData.split("|");


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

}



// ================================
// SIMPAN SEMENTARA
// ================================
function simpanWilayah(
  chatId,
  data
){

  userWilayah[chatId] =
    data;

  return data;

}


function getWilayah(
  chatId
){

  return userWilayah[chatId];

}



module.exports = {

  showProvinsi,
  showKabupaten,
  showKecamatan,
  simpanWilayah,
  getWilayah

};
