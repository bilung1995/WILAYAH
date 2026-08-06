// health.js
// Pemeriksaan kesehatan bot

const {
  isTelegramConfigured
} = require("./telegram");

const {
  isGreenApiConfigured
} = require("./whatsapp");

const {
  checkConfig
} = require("./config");

const {
  info,
  success,
  warning
} = require("./logger");

// ========================================
// CEK TELEGRAM
// ========================================

function checkTelegram() {
  const configured =
    isTelegramConfigured();

  return {
    service: "Telegram",
    configured,
    status: configured
      ? "READY"
      : "NOT_CONFIGURED"
  };
}

// ========================================
// CEK GREEN API
// ========================================

function checkGreenApi() {
  const configured =
    isGreenApiConfigured();

  return {
    service: "Green API",
    configured,
    status: configured
      ? "READY"
      : "NOT_CONFIGURED"
  };
}

// ========================================
// CEK KONFIGURASI
// ========================================

function checkEnvironment() {
  const valid =
    checkConfig();

  return {
    service: "Environment",
    configured: valid,
    status: valid
      ? "READY"
      : "INCOMPLETE"
  };
}

// ========================================
// CEK SEMUA SISTEM
// ========================================

function getHealthStatus() {
  const telegram =
    checkTelegram();

  const greenApi =
    checkGreenApi();

  const environment =
    checkEnvironment();

  const ready =
    telegram.configured &&
    greenApi.configured &&
    environment.configured;

  return {
    status: ready
      ? "READY"
      : "WARNING",

    telegram,
    greenApi,
    environment,

    timestamp:
      new Date().toISOString()
  };
}

// ========================================
// TAMPILKAN STATUS
// ========================================

function printHealthStatus() {
  const health =
    getHealthStatus();

  info(
    "Memeriksa kesehatan sistem..."
  );

  console.log(
    JSON.stringify(
      health,
      null,
      2
    )
  );

  if (health.status === "READY") {
    success(
      "Semua konfigurasi utama siap."
    );
  } else {
    warning(
      "Masih ada konfigurasi yang belum siap."
    );
  }

  return health;
}

// ========================================
// EXPORT
// ========================================

module.exports = {
  checkTelegram,
  checkGreenApi,
  checkEnvironment,
  getHealthStatus,
  printHealthStatus
};
