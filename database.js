// database.js
// Penyimpanan data bot secara lokal

const fs = require("fs");
const path = require("path");

// ========================================
// LOKASI DATABASE
// ========================================

const DATA_DIR = path.join(
  __dirname,
  "data"
);

const DATABASE_FILE = path.join(
  DATA_DIR,
  "database.json"
);

// ========================================
// DATA DEFAULT
// ========================================

const defaultDatabase = {
  users: {},
  selectedCities: {},
  blacklist: {},
  topups: {}
};

// ========================================
// PASTIKAN FOLDER DATABASE ADA
// ========================================

function ensureDatabase() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, {
      recursive: true
    });
  }

  if (!fs.existsSync(DATABASE_FILE)) {
    fs.writeFileSync(
      DATABASE_FILE,
      JSON.stringify(
        defaultDatabase,
        null,
        2
      ),
      "utf8"
    );
  }
}

// ========================================
// BACA DATABASE
// ========================================

function readDatabase() {
  try {
    ensureDatabase();

    const data =
      fs.readFileSync(
        DATABASE_FILE,
        "utf8"
      );

    if (!data.trim()) {
      return {
        ...defaultDatabase
      };
    }

    return JSON.parse(data);

  } catch (error) {
    console.error(
      "❌ Gagal membaca database:",
      error.message
    );

    return {
      ...defaultDatabase
    };
  }
}

// ========================================
// SIMPAN DATABASE
// ========================================

function writeDatabase(data) {
  try {
    ensureDatabase();

    fs.writeFileSync(
      DATABASE_FILE,
      JSON.stringify(
        data,
        null,
        2
      ),
      "utf8"
    );

    return true;

  } catch (error) {
    console.error(
      "❌ Gagal menyimpan database:",
      error.message
    );

    return false;
  }
}

// ========================================
// UPDATE DATABASE
// ========================================

function updateDatabase(callback) {
  const database =
    readDatabase();

  callback(database);

  return writeDatabase(database);
}

// ========================================
// AMBIL USER
// ========================================

function getDatabaseUser(
  telegramId
) {
  const database =
    readDatabase();

  return (
    database.users[
      String(telegramId)
    ] || null
  );
}

// ========================================
// SIMPAN USER
// ========================================

function saveDatabaseUser(
  telegramId,
  userData
) {
  return updateDatabase(
    database => {
      database.users[
        String(telegramId)
      ] = userData;
    }
  );
}

// ========================================
// AMBIL SEMUA USER
// ========================================

function getAllUsers() {
  const database =
    readDatabase();

  return database.users;
}

// ========================================
// HAPUS USER
// ========================================

function deleteDatabaseUser(
  telegramId
) {
  return updateDatabase(
    database => {
      delete database.users[
        String(telegramId)
      ];
    }
  );
}

// ========================================
// RESET DATABASE
// ========================================

function resetDatabase() {
  return writeDatabase({
    ...defaultDatabase
  });
}

// ========================================
// EXPORT
// ========================================

module.exports = {
  DATA_DIR,
  DATABASE_FILE,

  ensureDatabase,
  readDatabase,
  writeDatabase,
  updateDatabase,

  getDatabaseUser,
  saveDatabaseUser,
  getAllUsers,
  deleteDatabaseUser,

  resetDatabase
};
