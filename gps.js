// gps.js
// Pengelola wilayah Indonesia
// Alur:
// Provinsi -> Kabupaten/Kota -> Kecamatan

const axios = require("axios");

const API_BASE = "https://wilayah.id/api";

// ========================================
// AMBIL SEMUA PROVINSI
// ========================================

async function getProvinsi() {
  try {
    const response = await axios.get(
      `${API_BASE}/provinces.json`
    );

    return response.data.data || [];

  } catch (error) {
    console.error(
      "❌ Gagal mengambil data provinsi:",
      error.message
    );

    return [];
  }
}

// ========================================
// AMBIL KABUPATEN / KOTA
// ========================================

async function getKabupaten(provinceCode) {
  try {
    const response = await axios.get(
      `${API_BASE}/regencies/${provinceCode}.json`
    );

    return response.data.data || [];

  } catch (error) {
    console.error(
      "❌ Gagal mengambil data kabupaten/kota:",
      error.message
    );

    return [];
  }
}

// ========================================
// AMBIL KECAMATAN
// ========================================

async function getKecamatan(regencyCode) {
  try {
    const response = await axios.get(
      `${API_BASE}/districts/${regencyCode}.json`
    );

    return response.data.data || [];

  } catch (error) {
    console.error(
      "❌ Gagal mengambil data kecamatan:",
      error.message
    );

    return [];
  }
}

// ========================================
// EXPORT
// ========================================

module.exports = {
  getProvinsi,
  getKabupaten,
  getKecamatan
};
