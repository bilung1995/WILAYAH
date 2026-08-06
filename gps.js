// ======================================================
// gps.js
// API WILAYAH INDONESIA
// ======================================================

const axios = require("axios");

const API_URL =
  "https://www.emsifa.com/api-wilayah-indonesia/api";


// ======================================================
// AMBIL PROVINSI
// ======================================================

async function getProvinsi() {

  const response =
    await axios.get(
      `${API_URL}/provinces.json`
    );

  return response.data;

}


// ======================================================
// AMBIL KABUPATEN/KOTA
// ======================================================

async function getKabupaten(
  provinceId
) {

  const response =
    await axios.get(
      `${API_URL}/regencies/${provinceId}.json`
    );

  return response.data;

}


// ======================================================
// AMBIL KECAMATAN
// ======================================================

async function getKecamatan(
  regencyId
) {

  const response =
    await axios.get(
      `${API_URL}/districts/${regencyId}.json`
    );

  return response.data;

}


module.exports = {

  getProvinsi,
  getKabupaten,
  getKecamatan

};
