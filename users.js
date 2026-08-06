// user.js
// Pengelola data user Telegram

const users = new Map();

// ========================================
// MEMBUAT USER BARU
// ========================================

function createUser(telegramUser) {
  const id = String(telegramUser.id);

  if (!users.has(id)) {
    users.set(id, {
      telegramId: telegramUser.id,

      nama:
        `${telegramUser.first_name || ""} ${
          telegramUser.last_name || ""
        }`.trim(),

      username:
        telegramUser.username
          ? `@${telegramUser.username}`
          : null,

      provinsi: null,
      provinsiCode: null,

      kabupaten: null,
      kabupatenCode: null,

      kecamatan: null,
      kecamatanCode: null,

      saldo: 0,

      status: "Aktif",

      blacklist: [],

      createdAt: new Date().toISOString()
    });
  }

  return users.get(id);
}

// ========================================
// AMBIL DATA USER
// ========================================

function getUser(telegramId) {
  return users.get(String(telegramId)) || null;
}

// ========================================
// UPDATE DATA USER
// ========================================

function updateUser(telegramId, data) {
  const id = String(telegramId);

  const user = users.get(id);

  if (!user) {
    return null;
  }

  Object.assign(user, data);

  return user;
}

// ========================================
// SIMPAN WILAYAH USER
// ========================================

function setUserLocation(
  telegramId,
  location
) {
  return updateUser(
    telegramId,
    {
      provinsi: location.provinsi,
      provinsiCode: location.provinsiCode,

      kabupaten: location.kabupaten,
      kabupatenCode: location.kabupatenCode,

      kecamatan: location.kecamatan,
      kecamatanCode: location.kecamatanCode
    }
  );
}

// ========================================
// TAMBAH NOMOR BLACKLIST
// ========================================

function addBlacklist(
  telegramId,
  nomor
) {
  const user = getUser(telegramId);

  if (!user) {
    return null;
  }

  if (!user.blacklist.includes(nomor)) {
    user.blacklist.push(nomor);
  }

  return user;
}

// ========================================
// HAPUS NOMOR BLACKLIST
// ========================================

function removeBlacklist(
  telegramId,
  nomor
) {
  const user = getUser(telegramId);

  if (!user) {
    return null;
  }

  user.blacklist =
    user.blacklist.filter(
      item => item !== nomor
    );

  return user;
}

// ========================================
// TAMBAH SALDO
// ========================================

function addSaldo(
  telegramId,
  jumlah
) {
  const user = getUser(telegramId);

  if (!user) {
    return null;
  }

  user.saldo += Number(jumlah);

  return user;
}

// ========================================
// KURANGI SALDO
// ========================================

function subtractSaldo(
  telegramId,
  jumlah
) {
  const user = getUser(telegramId);

  if (!user) {
    return null;
  }

  const amount = Number(jumlah);

  if (user.saldo < amount) {
    return false;
  }

  user.saldo -= amount;

  return user;
}

// ========================================
// EXPORT
// ========================================

module.exports = {
  users,
  createUser,
  getUser,
  updateUser,
  setUserLocation,
  addBlacklist,
  removeBlacklist,
  addSaldo,
  subtractSaldo
};
