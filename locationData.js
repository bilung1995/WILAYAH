// locationData.js
// Pengelola data wilayah Indonesia

const {
  getProvinces,
  getRegencies,
  getDistricts
} = require("./gps");

// ========================================
// SEMUA PROVINSI
// ========================================

function getAllProvinces() {
  return getProvinces();
}

// ========================================
// KABUPATEN / KOTA BERDASARKAN PROVINSI
// ========================================

function getRegenciesByProvince(provinceCode) {
  if (!provinceCode) {
    return [];
  }

  return getRegencies(provinceCode);
}

// ========================================
// KECAMATAN BERDASARKAN KABUPATEN / KOTA
// ========================================

function getDistrictsByRegency(regencyCode) {
  if (!regencyCode) {
    return [];
  }

  return getDistricts(regencyCode);
}

// ========================================
// CARI PROVINSI
// ========================================

function findProvince(provinceCode) {
  return getAllProvinces().find(
    province =>
      String(province.code) ===
      String(provinceCode)
  ) || null;
}

// ========================================
// CARI KABUPATEN / KOTA
// ========================================

function findRegency(regencyCode) {
  for (const province of getAllProvinces()) {
    const regencies =
      getRegenciesByProvince(
        province.code
      );

    const found = regencies.find(
      regency =>
        String(regency.code) ===
        String(regencyCode)
    );

    if (found) {
      return {
        ...found,
        province
      };
    }
  }

  return null;
}

// ========================================
// CARI KECAMATAN
// ========================================

function findDistrict(districtCode) {
  for (const province of getAllProvinces()) {
    const regencies =
      getRegenciesByProvince(
        province.code
      );

    for (const regency of regencies) {
      const districts =
        getDistrictsByRegency(
          regency.code
        );

      const found = districts.find(
        district =>
          String(district.code) ===
          String(districtCode)
      );

      if (found) {
        return {
          ...found,
          regency,
          province
        };
      }
    }
  }

  return null;
}

// ========================================
// CARI WILAYAH LENGKAP
// ========================================

function getFullLocation(
  provinceCode,
  regencyCode,
  districtCode
) {
  const province =
    findProvince(provinceCode);

  if (!province) {
    return null;
  }

  const regency =
    getRegenciesByProvince(
      provinceCode
    ).find(
      item =>
        String(item.code) ===
        String(regencyCode)
    );

  if (!regency) {
    return null;
  }

  const district =
    getDistrictsByRegency(
      regencyCode
    ).find(
      item =>
        String(item.code) ===
        String(districtCode)
    );

  if (!district) {
    return null;
  }

  return {
    provinsi: province.name,
    provinsiCode: province.code,

    kabupaten: regency.name,
    kabupatenCode: regency.code,

    kecamatan: district.name,
    kecamatanCode: district.code
  };
}

// ========================================
// EXPORT
// ========================================

module.exports = {
  getAllProvinces,
  getRegenciesByProvince,
  getDistrictsByRegency,

  findProvince,
  findRegency,
  findDistrict,

  getFullLocation
};
