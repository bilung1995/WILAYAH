// session.js
// Pengelola sesi/percakapan user Telegram

const sessions = new Map();

// ========================================
// MEMBUAT / MENGAMBIL SESSION
// ========================================

function getSession(telegramId) {
  const id = String(telegramId);

  if (!sessions.has(id)) {
    sessions.set(id, {
      step: null,

      provinsi: null,
      provinsiCode: null,

      kabupaten: null,
      kabupatenCode: null,

      kecamatan: null,
      kecamatanCode: null,

      updatedAt: new Date().toISOString()
    });
  }

  return sessions.get(id);
}

// ========================================
// UPDATE SESSION
// ========================================

function updateSession(telegramId, data) {
  const session = getSession(telegramId);

  Object.assign(session, data);

  session.updatedAt =
    new Date().toISOString();

  return session;
}

// ========================================
// SET LANGKAH SESSION
// ========================================

function setStep(telegramId, step) {
  return updateSession(
    telegramId,
    {
      step
    }
  );
}

// ========================================
// RESET SESSION
// ========================================

function resetSession(telegramId) {
  const id = String(telegramId);

  sessions.set(id, {
    step: null,

    provinsi: null,
    provinsiCode: null,

    kabupaten: null,
    kabupatenCode: null,

    kecamatan: null,
    kecamatanCode: null,

    updatedAt: new Date().toISOString()
  });

  return sessions.get(id);
}

// ========================================
// SIMPAN PROVINSI
// ========================================

function setProvince(
  telegramId,
  province
) {
  return updateSession(
    telegramId,
    {
      provinsi: province.name,
      provinsiCode: province.code,

      kabupaten: null,
      kabupatenCode: null,

      kecamatan: null,
      kecamatanCode: null,

      step: "SELECT_REGENCY"
    }
  );
}

// ========================================
// SIMPAN KABUPATEN / KOTA
// ========================================

function setRegency(
  telegramId,
  regency
) {
  return updateSession(
    telegramId,
    {
      kabupaten: regency.name,
      kabupatenCode: regency.code,

      kecamatan: null,
      kecamatanCode: null,

      step: "SELECT_DISTRICT"
    }
  );
}

// ========================================
// SIMPAN KECAMATAN
// ========================================

function setDistrict(
  telegramId,
  district
) {
  return updateSession(
    telegramId,
    {
      kecamatan: district.name,
      kecamatanCode: district.code,

      step: "CONFIRM_LOCATION"
    }
  );
}

// ========================================
// AMBIL LOKASI SESSION
// ========================================

function getSessionLocation(telegramId) {
  const session =
    getSession(telegramId);

  return {
    provinsi: session.provinsi,
    provinsiCode: session.provinsiCode,

    kabupaten: session.kabupaten,
    kabupatenCode: session.kabupatenCode,

    kecamatan: session.kecamatan,
    kecamatanCode: session.kecamatanCode
  };
}

// ========================================
// CEK SESSION
// ========================================

function hasActiveSession(telegramId) {
  const session =
    getSession(telegramId);

  return Boolean(session.step);
}

// ========================================
// EXPORT
// ========================================

module.exports = {
  sessions,

  getSession,
  updateSession,
  setStep,
  resetSession,

  setProvince,
  setRegency,
  setDistrict,

  getSessionLocation,
  hasActiveSession
};
