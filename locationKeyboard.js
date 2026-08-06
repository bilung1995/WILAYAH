// locationKeyboard.js
// Keyboard pemilihan wilayah
// Provinsi -> Kabupaten/Kota -> Kecamatan -> Konfirmasi

// ========================================
// KEYBOARD PROVINSI
// ========================================

function provinceKeyboard(provinces = []) {
  const keyboard = [];

  for (let i = 0; i < provinces.length; i += 2) {
    const row = [];

    const province1 = provinces[i];

    if (province1) {
      row.push({
        text: `🇮🇩 ${province1.name}`,
        callback_data:
          `province:${province1.code}`
      });
    }

    const province2 = provinces[i + 1];

    if (province2) {
      row.push({
        text: `🇮🇩 ${province2.name}`,
        callback_data:
          `province:${province2.code}`
      });
    }

    keyboard.push(row);
  }

  return {
    inline_keyboard: keyboard
  };
}

// ========================================
// KEYBOARD KABUPATEN / KOTA
// ========================================

function regencyKeyboard(regencies = []) {
  const keyboard = [];

  for (let i = 0; i < regencies.length; i += 2) {
    const row = [];

    const regency1 = regencies[i];

    if (regency1) {
      row.push({
        text: `🏙️ ${regency1.name}`,
        callback_data:
          `regency:${regency1.code}`
      });
    }

    const regency2 = regencies[i + 1];

    if (regency2) {
      row.push({
        text: `🏙️ ${regency2.name}`,
        callback_data:
          `regency:${regency2.code}`
      });
    }

    keyboard.push(row);
  }

  keyboard.push([
    {
      text: "⬅️ Kembali ke Provinsi",
      callback_data: "location:province"
    }
  ]);

  return {
    inline_keyboard: keyboard
  };
}

// ========================================
// KEYBOARD KECAMATAN
// ========================================

function districtKeyboard(districts = []) {
  const keyboard = [];

  for (let i = 0; i < districts.length; i += 2) {
    const row = [];

    const district1 = districts[i];

    if (district1) {
      row.push({
        text: `📌 ${district1.name}`,
        callback_data:
          `district:${district1.code}`
      });
    }

    const district2 = districts[i + 1];

    if (district2) {
      row.push({
        text: `📌 ${district2.name}`,
        callback_data:
          `district:${district2.code}`
      });
    }

    keyboard.push(row);
  }

  keyboard.push([
    {
      text: "⬅️ Kembali ke Kabupaten/Kota",
      callback_data: "location:regency"
    }
  ]);

  return {
    inline_keyboard: keyboard
  };
}

// ========================================
// KONFIRMASI WILAYAH
// ========================================

function confirmLocationKeyboard() {
  return {
    inline_keyboard: [
      [
        {
          text: "✅ TAMBAHKAN WILAYAH",
          callback_data:
            "location:confirm"
        }
      ],
      [
        {
          text: "🔄 PILIH ULANG",
          callback_data:
            "location:restart"
        }
      ],
      [
        {
          text: "❌ BATAL",
          callback_data:
            "location:cancel"
        }
      ]
    ]
  };
}

// ========================================
// KEYBOARD KOTA YANG DIPILIH
// ========================================

function selectedCitiesKeyboard(
  locations = []
) {
  const keyboard = [];

  locations.forEach(
    (location, index) => {
      keyboard.push([
        {
          text:
            `❌ Hapus ${index + 1}. ${location.kecamatan}`,
          callback_data:
            `removeCity:${location.kecamatanCode}`
        }
      ]);
    }
  );

  if (locations.length > 0) {
    keyboard.push([
      {
        text: "🗑️ HAPUS SEMUA",
        callback_data:
          "removeCity:all"
      }
    ]);
  }

  keyboard.push([
    {
      text: "➕ TAMBAH KOTA",
      callback_data:
        "location:add"
    }
  ]);

  return {
    inline_keyboard: keyboard
  };
}

// ========================================
// EXPORT
// ========================================

module.exports = {
  provinceKeyboard,
  regencyKeyboard,
  districtKeyboard,
  confirmLocationKeyboard,
  selectedCitiesKeyboard
};
