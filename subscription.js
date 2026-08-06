// ======================================================
// subscription.js
// SISTEM SUBSCRIPTION BOT
// ======================================================

const PACKAGES = {
  TRIAL: {
    id: "TRIAL",
    name: "Trial 1 Hari",
    price: 0,
    durationDays: 1,
    free: true
  },

  WEEK: {
    id: "WEEK",
    name: "1 Minggu",
    price: 35000,
    durationDays: 7,
    free: false
  },

  MONTH: {
    id: "MONTH",
    name: "1 Bulan",
    price: 100000,
    durationDays: 30,
    free: false
  },

  TWO_MONTH: {
    id: "TWO_MONTH",
    name: "2 Bulan",
    price: 180000,
    durationDays: 60,
    free: false
  }
};

// ======================================================
// FORMAT RUPIAH
// ======================================================

function formatRupiah(amount) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(amount);
}

// ======================================================
// TAMPILKAN PAKET
// ======================================================

function getSubscriptionKeyboard() {
  return {
    inline_keyboard: [
      [
        {
          text: "🎁 TRIAL 1 HARI • GRATIS",
          callback_data: "SUBSCRIBE_TRIAL"
        }
      ],
      [
        {
          text: "🗓️ 1 MINGGU • Rp35.000",
          callback_data: "SUBSCRIBE_WEEK"
        }
      ],
      [
        {
          text: "📅 1 BULAN • Rp100.000",
          callback_data: "SUBSCRIBE_MONTH"
        }
      ],
      [
        {
          text: "📆 2 BULAN • Rp180.000",
          callback_data: "SUBSCRIBE_TWO_MONTH"
        }
      ]
    ]
  };
}

// ======================================================
// PESAN SUBSCRIPTION
// ======================================================

function getSubscriptionMessage() {
  return (
    "⚠️ SUBSCRIPTION DIPERLUKAN\n\n" +

    "Untuk menggunakan fitur wilayah dan " +
    "menerima notifikasi WhatsApp, Anda harus " +
    "memiliki subscription aktif terlebih dahulu.\n\n" +

    "💳 PILIH PAKET:\n\n" +

    "🎁 TRIAL 1 HARI\n" +
    "💰 GRATIS\n" +
    "⏳ Berlaku 1 hari\n\n" +

    "🗓️ 1 MINGGU\n" +
    "💰 Rp35.000\n" +
    "⏳ Berlaku 7 hari\n\n" +

    "📅 1 BULAN\n" +
    "💰 Rp100.000\n" +
    "⏳ Berlaku 30 hari\n\n" +

    "📆 2 BULAN\n" +
    "💰 Rp180.000\n" +
    "⏳ Berlaku 60 hari\n\n" +

    "👇 Silakan pilih paket:"
  );
}

// ======================================================
// CEK SUBSCRIPTION
// ======================================================

function hasActiveSubscription(user) {
  if (!user) {
    return false;
  }

  if (!user.subscription) {
    return false;
  }

  if (
    user.subscription.status !==
    "active"
  ) {
    return false;
  }

  if (
    !user.subscription.expiresAt
  ) {
    return false;
  }

  const now = Date.now();

  const expires =
    new Date(
      user.subscription.expiresAt
    ).getTime();

  if (expires <= now) {
    user.subscription.status =
      "expired";

    return false;
  }

  return true;
}

// ======================================================
// SISA HARI SUBSCRIPTION
// ======================================================

function getRemainingDays(user) {
  if (
    !hasActiveSubscription(user)
  ) {
    return 0;
  }

  const expires =
    new Date(
      user.subscription.expiresAt
    ).getTime();

  const now =
    Date.now();

  const difference =
    expires - now;

  return Math.ceil(
    difference /
      (1000 * 60 * 60 * 24)
  );
}

// ======================================================
// CEK APAKAH SUDAH PERNAH TRIAL
// ======================================================

function hasUsedTrial(user) {
  return Boolean(
    user?.trialUsed
  );
}

// ======================================================
// AKTIFKAN TRIAL
// ======================================================

function activateTrial(user) {
  if (
    hasUsedTrial(user)
  ) {
    return {
      success: false,
      message:
        "❌ Trial 1 hari sudah pernah digunakan."
    };
  }

  const now =
    new Date();

  const expires =
    new Date(
      now.getTime() +
      24 *
      60 *
      60 *
      1000
    );

  user.trialUsed =
    true;

  user.subscription = {
    packageId: "TRIAL",
    packageName:
      PACKAGES.TRIAL.name,
    price: 0,
    status: "active",
    startedAt:
      now.toISOString(),
    expiresAt:
      expires.toISOString()
  };

  return {
    success: true,
    subscription:
      user.subscription
  };
}

// ======================================================
// BUAT PERMINTAAN SUBSCRIPTION
// ======================================================

function createSubscriptionRequest(
  user,
  packageId
) {
  const selectedPackage =
    Object.values(
      PACKAGES
    ).find(
      item =>
        item.id === packageId
    );

  if (!selectedPackage) {
    return {
      success: false,
      message:
        "❌ Paket tidak ditemukan."
    };
  }

  user.subscriptionRequest = {
    packageId:
      selectedPackage.id,

    packageName:
      selectedPackage.name,

    price:
      selectedPackage.price,

    durationDays:
      selectedPackage.durationDays,

    status:
      selectedPackage.free
        ? "free"
        : "waiting_payment",

    createdAt:
      new Date().toISOString()
  };

  return {
    success: true,
    package:
      selectedPackage
  };
}

// ======================================================
// AKTIFKAN SUBSCRIPTION SETELAH ADMIN MENYETUJUI
// ======================================================

function activateSubscription(
  user,
  packageId
) {
  const selectedPackage =
    Object.values(
      PACKAGES
    ).find(
      item =>
        item.id === packageId
    );

  if (!selectedPackage) {
    return {
      success: false,
      message:
        "❌ Paket tidak ditemukan."
    };
  }

  const now =
    new Date();

  const expires =
    new Date(
      now.getTime() +
      selectedPackage.durationDays *
      24 *
      60 *
      60 *
      1000
    );

  user.subscription = {
    packageId:
      selectedPackage.id,

    packageName:
      selectedPackage.name,

    price:
      selectedPackage.price,

    status:
      "active",

    startedAt:
      now.toISOString(),

    expiresAt:
      expires.toISOString()
  };

  user.subscriptionRequest =
    null;

  return {
    success: true,
    subscription:
      user.subscription
  };
}

// ======================================================
// INFO SUBSCRIPTION USER
// ======================================================

function getSubscriptionInfo(
  user
) {
  if (
    !hasActiveSubscription(user)
  ) {
    return (
      "❌ Subscription tidak aktif."
    );
  }

  const subscription =
    user.subscription;

  const remaining =
    getRemainingDays(user);

  return (
    "🟢 SUBSCRIPTION AKTIF\n\n" +
    `📦 Paket: ${subscription.packageName}\n` +
    `💰 Harga: ${formatRupiah(subscription.price)}\n` +
    `⏳ Sisa: ${remaining} hari\n` +
    `📅 Berakhir: ${new Date(
      subscription.expiresAt
    ).toLocaleString("id-ID")}`
  );
}

// ======================================================
// EXPORT
// ======================================================

module.exports = {
  PACKAGES,
  formatRupiah,
  getSubscriptionKeyboard,
  getSubscriptionMessage,
  hasActiveSubscription,
  getRemainingDays,
  hasUsedTrial,
  activateTrial,
  createSubscriptionRequest,
  activateSubscription,
  getSubscriptionInfo
};
