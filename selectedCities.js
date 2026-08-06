// selectedCities.js
// Pengelola wilayah yang dipilih user

const selectedCities = new Map();

// ========================================
// AMBIL WILAYAH USER
// ========================================

function getSelectedCities(telegramId) {
  const id = String(telegramId);

  if (!selectedCities.has(id)) {
    selectedCities.set(id, []);
  }

  return selectedCities.get(id);
}

// ========================================
// TAMBAH WILAYAH
// ========================================

function addSelectedCity(telegramId, location) {
  const id = String(telegramId);

  const list = getSelectedCities(id);

  const exists = list.some(item =>
    item.provinsiCode === location.provinsiCode &&
    item.kabupatenCode === location.kabupatenCode &&
    item.kecamatanCode === location.kecamatanCode
  );

  if (exists) {
    return {
      success: false,
      message: "⚠️ Kecamatan tersebut sudah dipilih."
    };
  }

  const newLocation = {
    provinsi: location.provinsi,
    provinsiCode: location.provinsiCode,

    kabupaten: location.kabupaten,
    kabupatenCode: location.kabupatenCode,

    kecamatan: location.kecamatan,
    kecamatanCode: location.kecamatanCode,

    addedAt: new Date().toISOString()
  };

  list.push(newLocation);

  return {
    success: true,
    location: newLocation
  };
}

// ========================================
// HAPUS WILAYAH
// ========================================

function removeSelectedCity(
  telegramId,
  kecamatanCode
) {
  const id = String(telegramId);

  const list = getSelectedCities(id);

  const index = list.findIndex(
    item =>
      item.kecamatanCode === kecamatanCode
  );

  if (index === -1) {
    return {
      success: false,
      message: "❌ Wilayah tidak ditemukan."
    };
  }

  const removed = list.splice(index, 1)[0];

  return {
    success: true,
    location: removed
  };
}

// ========================================
// HAPUS SEMUA WILAYAH
// ========================================

function clearSelectedCities(telegramId) {
  const id = String(telegramId);

  selectedCities.set(id, []);

  return {
    success: true,
    message: "✅ Semua wilayah telah dihapus."
  };
}

// ========================================
// FORMAT DAFTAR WILAYAH
// ========================================

function formatSelectedCities(telegramId) {
  const list = getSelectedCities(telegramId);

  if (list.length === 0) {
    return (
      "📍 KOTA YANG DIPILIH\n\n" +
      "❌ Belum ada wilayah yang dipilih."
    );
  }

  let message =
    "📍 KOTA YANG DIPILIH\n\n";

  list.forEach((item, index) => {
    message +=
      `${index + 1}. 🇮🇩 ${item.provinsi}\n` +
      `   🏙️ ${item.kabupaten}\n` +
      `   📌 ${item.kecamatan}\n\n`;
  });

  message +=
    `📊 Total wilayah: ${list.length}`;

  return message;
}

// ========================================
// CEK APAKAH WILAYAH SUDAH DIPILIH
// ========================================

function hasSelectedCity(
  telegramId,
  kecamatanCode
) {
  const list = getSelectedCities(telegramId);

  return list.some(
    item =>
      item.kecamatanCode === kecamatanCode
  );
}

// ========================================
// EXPORT
// ========================================

module.exports = {
  selectedCities,
  getSelectedCities,
  addSelectedCity,
  removeSelectedCity,
  clearSelectedCities,
  formatSelectedCities,
  hasSelectedCity
};
