// ======================================================
// FILTER.JS
// FILTER USER BERDASARKAN KABUPATEN/KOTA + KECAMATAN
// ======================================================

function normalize(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}


// ======================================================
// BACA WILAYAH DARI PESAN WHATSAPP
// ======================================================

function parseWilayah(message) {

  const text = String(message || "").trim();

  let kabupaten = "";
  let kecamatan = "";

  // ====================================================
  // FORMAT:
  // Kab : Langkat
  // Kec : Kutambaru
  // ====================================================

  const kabMatch = text.match(
    /(?:KABUPATEN|KAB)\s*:\s*(.+)/i
  );

  const kecMatch = text.match(
    /(?:KECAMATAN|KEC)\s*:\s*(.+)/i
  );

  if (kabMatch && kecMatch) {

    kabupaten = normalize(kabMatch[1]);
    kecamatan = normalize(kecMatch[1]);

  } else {

    // ==================================================
    // FORMAT:
    // PAPUA
    // KOTA JAYAPURA
    // JAYAPURA UTARA
    // ==================================================

    const lines = text
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(Boolean);

    if (lines.length >= 3) {

      kabupaten = normalize(lines[1]);
      kecamatan = normalize(lines[2]);

    }

  }

  return {
    kabupaten,
    kecamatan
  };
}


// ======================================================
// CARI USER YANG COCOK
// ======================================================

function findMatchingUsers(
  database,
  kabupaten,
  kecamatan
) {

  const targetKabupaten =
    normalize(kabupaten);

  const targetKecamatan =
    normalize(kecamatan);

  const matchedUsers = [];

  if (
    !targetKabupaten ||
    !targetKecamatan
  ) {

    return matchedUsers;

  }


  // ====================================================
  // LOOP SEMUA USER
  // ====================================================

  for (
    const userId in database.locations
  ) {

    const locations =
      database.locations[userId];

    if (
      !Array.isArray(locations)
    ) {
      continue;
    }


    // ==================================================
    // CEK SETIAP WILAYAH USER
    // ==================================================

    for (
      const location of locations
    ) {

      const userKabupaten =
        normalize(
          location.kabupaten
        );

      const userKecamatan =
        normalize(
          location.kecamatan
        );


      // ==================================================
      // FILTER UTAMA
      // ==================================================

      if (
        userKabupaten ===
          targetKabupaten &&

        userKecamatan ===
          targetKecamatan
      ) {

        matchedUsers.push(
          userId
        );

        break;

      }

    }

  }

  return matchedUsers;

}


// ======================================================
// EXPORT
// ======================================================

module.exports = {
  parseWilayah,
  findMatchingUsers
};
