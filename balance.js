// balance.js
// Sistem saldo user

const {
  getDatabaseUser,
  saveDatabaseUser
} = require("./database");

// ========================================
// AMBIL SALDO USER
// ========================================

function getBalance(telegramId) {
  const user =
    getDatabaseUser(telegramId);

  if (!user) {
    return 0;
  }

  return Number(user.balance) || 0;
}

// ========================================
// SET SALDO USER
// ========================================

function setBalance(
  telegramId,
  amount
) {
  const user =
    getDatabaseUser(telegramId);

  if (!user) {
    return {
      success: false,
      message:
        "❌ User belum terdaftar."
    };
  }

  const newBalance =
    Number(amount);

  if (
    !Number.isFinite(newBalance) ||
    newBalance < 0
  ) {
    return {
      success: false,
      message:
        "❌ Nominal saldo tidak valid."
    };
  }

  user.balance =
    newBalance;

  saveDatabaseUser(
    telegramId,
    user
  );

  return {
    success: true,
    balance: newBalance
  };
}

// ========================================
// TAMBAH SALDO
// ========================================

function addBalance(
  telegramId,
  amount
) {
  const current =
    getBalance(telegramId);

  const nominal =
    Number(amount);

  if (
    !Number.isFinite(nominal) ||
    nominal <= 0
  ) {
    return {
      success: false,
      message:
        "❌ Nominal tidak valid."
    };
  }

  return setBalance(
    telegramId,
    current + nominal
  );
}

// ========================================
// KURANGI SALDO
// ========================================

function deductBalance(
  telegramId,
  amount
) {
  const current =
    getBalance(telegramId);

  const nominal =
    Number(amount);

  if (
    !Number.isFinite(nominal) ||
    nominal <= 0
  ) {
    return {
      success: false,
      message:
        "❌ Nominal tidak valid."
    };
  }

  if (current < nominal) {
    return {
      success: false,
      message:
        "❌ Saldo tidak mencukupi.",
      balance: current
    };
  }

  return setBalance(
    telegramId,
    current - nominal
  );
}

// ========================================
// CEK SALDO CUKUP
// ========================================

function hasEnoughBalance(
  telegramId,
  amount
) {
  return (
    getBalance(telegramId) >=
    Number(amount)
  );
}

// ========================================
// FORMAT SALDO
// ========================================

function formatBalance(amount) {
  return new Intl.NumberFormat(
    "id-ID",
    {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }
  ).format(
    Number(amount) || 0
  );
}

// ========================================
// PESAN SALDO
// ========================================

function getBalanceMessage(
  telegramId
) {
  const balance =
    getBalance(telegramId);

  return (
    "💰 SALDO ANDA\n\n" +
    `Saldo saat ini: ${formatBalance(
      balance
    )}`
  );
}

// ========================================
// EXPORT
// ========================================

module.exports = {
  getBalance,
  setBalance,
  addBalance,
  deductBalance,
  hasEnoughBalance,
  formatBalance,
  getBalanceMessage
};
