// logger.js
// Sistem log bot

// ========================================
// WAKTU
// ========================================

function getTime() {
  return new Date().toISOString();
}

// ========================================
// LOG INFO
// ========================================

function info(message, data = null) {
  console.log(
    `[${getTime()}] ℹ️ ${message}`,
    data || ""
  );
}

// ========================================
// LOG SUKSES
// ========================================

function success(message, data = null) {
  console.log(
    `[${getTime()}] ✅ ${message}`,
    data || ""
  );
}

// ========================================
// LOG WARNING
// ========================================

function warning(message, data = null) {
  console.warn(
    `[${getTime()}] ⚠️ ${message}`,
    data || ""
  );
}

// ========================================
// LOG ERROR
// ========================================

function error(message, data = null) {
  console.error(
    `[${getTime()}] ❌ ${message}`,
    data || ""
  );
}

// ========================================
// LOG TELEGRAM
// ========================================

function telegram(message, data = null) {
  console.log(
    `[${getTime()}] 📱 TELEGRAM: ${message}`,
    data || ""
  );
}

// ========================================
// LOG WHATSAPP
// ========================================

function whatsapp(message, data = null) {
  console.log(
    `[${getTime()}] 📲 WHATSAPP: ${message}`,
    data || ""
  );
}

// ========================================
// LOG WEBHOOK
// ========================================

function webhook(message, data = null) {
  console.log(
    `[${getTime()}] 🌐 WEBHOOK: ${message}`,
    data || ""
  );
}

// ========================================
// EXPORT
// ========================================

module.exports = {
  getTime,
  info,
  success,
  warning,
  error,
  telegram,
  whatsapp,
  webhook
};
