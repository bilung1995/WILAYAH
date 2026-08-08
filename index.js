// ======================================================
// INDEX.JS
// BAGIAN 1 — SETUP, ENV, DATABASE
// ======================================================

require("dotenv").config();

const http = require("http");
const fs = require("fs");
const path = require("path");
const TelegramBot = require("node-telegram-bot-api");

const wilayah = require("./wilayah");
const subscription = require("./subscription");
const topup = require("./topup");
const {
  forwardWhatsAppMessage
} = require("./green-router");

// ======================================================
// ENV
// ======================================================

const TELEGRAM_TOKEN =
  process.env.TELEGRAM_TOKEN ||
  process.env.BOT_TOKEN;

const ADMIN_ID = String(
  process.env.ADMIN_ID ||
  process.env.TELEGRAM_CHAT_ID ||
  ""
);

const PORT =
  Number(process.env.PORT) || 8080;

// ======================================================
// CEK TOKEN
// ======================================================

if (!TELEGRAM_TOKEN) {

  console.error(
    "❌ TELEGRAM_TOKEN / BOT_TOKEN belum diisi."
  );

  process.exit(1);
}

// ======================================================
// DATABASE
// ======================================================

const DATA_FILE = path.join(
  __dirname,
  "bot-data.json"
);

function createDefaultDatabase() {

  return {
    users: {},
    locations: {},
    transactions: {},
    topups: {},
    blacklist: []
  };

}

// ======================================================
// LOAD DATABASE
// ======================================================

function loadDatabase() {

  try {

    if (!fs.existsSync(DATA_FILE)) {

      const database =
        createDefaultDatabase();

      fs.writeFileSync(
        DATA_FILE,
        JSON.stringify(
          database,
          null,
          2
        )
      );

      return database;
    }

    const raw =
      fs.readFileSync(
        DATA_FILE,
        "utf8"
      );

    const database =
      JSON.parse(raw);

    return {
      ...createDefaultDatabase(),
      ...database
    };

  } catch (error) {

    console.error(
      "❌ GAGAL MEMUAT DATABASE:",
      error.message
    );

    return createDefaultDatabase();
  }

}

let database =
  loadDatabase();

// ======================================================
// SAVE DATABASE
// ======================================================

function saveDatabase() {

  try {

    fs.writeFileSync(
      DATA_FILE,
      JSON.stringify(
        database,
        null,
        2
      )
    );

  } catch (error) {

    console.error(
      "❌ GAGAL MENYIMPAN DATABASE:",
      error.message
    );

  }

}

// ======================================================
// TELEGRAM BOT
// ======================================================

const bot =
  new TelegramBot(
    TELEGRAM_TOKEN,
    {
      polling: true
    }
  );

console.log(
  "======================================"
);

console.log(
  "🤖 BOT TELEGRAM STARTING"
);

console.log(
  "======================================"
);


// ======================================================
// BAGIAN 2 — USER, LOKASI, ADMIN, MENU UTAMA
// ======================================================

// ======================================================
// USER
// ======================================================

function getUser(chatId) {

  const id = String(chatId);

  if (!database.users[id]) {

    database.users[id] = {
      id,
      firstName: "",
      username: "",
      balance: 0,

      subscription: null,
subscriptionRequest: null,

locationQuotaUsed: false,

waitingPaymentProof: false,
      paymentProof: null,

      createdAt:
        new Date().toISOString()
    };

    saveDatabase();
  }

  return database.users[id];
}


// ======================================================
// LOKASI USER
// ======================================================

function getUserLocations(chatId) {

  const id = String(chatId);

  if (!database.locations[id]) {

    database.locations[id] = [];

    saveDatabase();
  }

  return database.locations[id];
}


// ======================================================
// SIMPAN LOKASI
// ======================================================

function saveUserLocation(
  chatId,
  location
) {

  const id = String(chatId);

  if (!database.locations[id]) {
    database.locations[id] = [];
  }

  const exists =
    database.locations[id].some(
      item =>
        String(item.kecamatanCode) ===
        String(location.kecamatanCode)
    );

  if (exists) {
    return false;
  }

  database.locations[id].push(
    location
  );

  saveDatabase();

  return true;
}


// ======================================================
// CEK ADMIN
// ======================================================

function isAdmin(chatId) {

  return (
    ADMIN_ID &&
    String(chatId) ===
    String(ADMIN_ID)
  );

}


// ======================================================
// MENU UTAMA
// ======================================================

function mainKeyboard(chatId) {

  const keyboard = [

    [
      "👤 PROFIL",
      "📍 KOTA YANG DIPILIH"
    ],

    [
      "🏙️ TAMBAH KOTA",
      "💳 TOP UP"
    ],

    [
      "📊 STATUS",
      "❓ BANTUAN"
    ],

    [
      "👨‍💼 HUBUNGI ADMIN"
    ]

  ];


  // ====================================================
  // MENU ADMIN
  // ====================================================

  if (isAdmin(chatId)) {

    keyboard.push([
      "🛠️ PANEL ADMIN"
    ]);

    keyboard.push([
      "🚫 NOMOR BLACKLIST"
    ]);

  }


  return {

    keyboard,

    resize_keyboard: true,

    one_time_keyboard: false

  };

}


// ======================================================
// KIRIM MENU UTAMA
// ======================================================

async function sendMainMenu(
  chatId,
  text =
    "Silakan pilih menu di bawah."
) {

  await bot.sendMessage(

    chatId,

    text,

    {
      reply_markup:
        mainKeyboard(chatId)
    }

  );

  }



// ======================================================
// BAGIAN 3 — MENU INFORMASI USER
// ======================================================

// ======================================================
// PROFIL
// ======================================================

async function showProfile(chatId) {

  const user =
    getUser(chatId);

  const locations =
    getUserLocations(chatId);

  let subscriptionText =
    "❌ Tidak aktif";

  if (
    subscription.hasActiveSubscription(user)
  ) {

    const remaining =
      subscription.getRemainingDays(user);

    subscriptionText =
      `🟢 Aktif\n` +
      `📦 ${user.subscription.packageName}\n` +
      `⏳ Sisa ${remaining} hari`;

  }

  await bot.sendMessage(

    chatId,

    "👤 PROFIL\n\n" +

    `🆔 Telegram ID: ${chatId}\n` +

    `👤 Nama: ${
      user.firstName || "-"
    }\n` +

    `🔗 Username: ${
      user.username
        ? "@" + user.username
        : "-"
    }\n\n` +

    `💳 Subscription:\n${subscriptionText}\n\n` +

    `📍 Wilayah tersimpan: ${
      locations.length
    }`,

    {
      reply_markup:
        mainKeyboard(chatId)
    }

  );

}


// ======================================================
// KOTA YANG DIPILIH
// ======================================================

async function showLocations(chatId) {

  const locations =
    getUserLocations(chatId);

  if (
    locations.length === 0
  ) {

    await bot.sendMessage(

      chatId,

      "📍 KOTA YANG DIPILIH\n\n" +

      "Belum ada wilayah yang dipilih.\n\n" +

      "Tekan 🏙️ TAMBAH KOTA untuk memilih wilayah.",

      {
        reply_markup:
          mainKeyboard(chatId)
      }

    );

    return;
  }

  let text =
    "📍 KOTA YANG DIPILIH\n\n";

  locations.forEach(
    (location, index) => {

      text +=

        `${index + 1}. ` +
        `${location.provinsi || "-"}\n` +

        `   ${location.kabupaten || "-"}\n` +

        `   ${location.kecamatan || "-"}\n\n`;

    }
  );

  await bot.sendMessage(

    chatId,

    text,

    {
      reply_markup:
        mainKeyboard(chatId)
    }

  );

}


// ======================================================
// STATUS
// ======================================================

async function showStatus(chatId) {

  const user =
    getUser(chatId);

  const active =
    subscription.hasActiveSubscription(
      user
    );

  let subscriptionStatus =
    "❌ TIDAK AKTIF";

  if (active) {

    const remaining =
      subscription.getRemainingDays(
        user
      );

    subscriptionStatus =
      "🟢 AKTIF\n" +

      `📦 Paket: ${
        user.subscription.packageName
      }\n` +

      `⏳ Sisa: ${
        remaining
      } hari\n` +

      `📅 Berakhir: ${
        new Date(
          user.subscription.expiresAt
        ).toLocaleString("id-ID")
      }`;

  }

  await bot.sendMessage(

    chatId,

    "📊 STATUS BOT\n\n" +

    "🟢 Telegram: AKTIF\n" +

    "🇯🇵 Database: AKTIF\n" +

    "🚀 Server: AKTIF\n\n" +

    `💳 SUBSCRIPTION:\n` +

    `${subscriptionStatus}\n\n` +

    `📍 Wilayah tersimpan: ${
      getUserLocations(chatId).length
    }`,

    {
      reply_markup:
        mainKeyboard(chatId)
    }

  );

}


// ======================================================
// BANTUAN
// ======================================================

async function showHelp(chatId) {

  await bot.sendMessage(

    chatId,

    "❓ BANTUAN\n\n" +

    "🏙️ TAMBAH KOTA\n" +

    "Untuk memilih provinsi, " +
    "kabupaten/kota, dan kecamatan.\n\n" +

    "💳 TOP UP\n" +

    "Untuk memilih paket subscription " +
    "dan melakukan pembayaran.\n\n" +

    "📍 KOTA YANG DIPILIH\n" +

    "Untuk melihat wilayah yang sudah tersimpan.\n\n" +

    "👤 PROFIL\n" +

    "Untuk melihat informasi akun dan subscription.\n\n" +

    "📊 STATUS\n" +

    "Untuk melihat status bot dan subscription.\n\n" +

    "👨‍💼 HUBUNGI ADMIN\n" +

    "Untuk menghubungi admin.",

    {
      reply_markup:
        mainKeyboard(chatId)
    }

  );

}


// ======================================================
// HUBUNGI ADMIN
// ======================================================

async function showAdmin(chatId) {

  await bot.sendMessage(

    chatId,

    "👨‍💼 HUBUNGI ADMIN\n\n" +

    "Telegram: @Hambali1995\n\n" +

    "WhatsApp 1:\n" +

    "083160776091\n\n" +

    "WhatsApp 2:\n" +

    "083182333956",

    {
      reply_markup: {

        inline_keyboard: [

          [

            {
              text:
                "📱 WhatsApp 1",

              url:
                "https://wa.me/6283160776091"
            }

          ],

          [

            {
              text:
                "📱 WhatsApp 2",

              url:
                "https://wa.me/6283182333956"
            }

          ]

        ]

      }

    }

  );

}


// ======================================================
// BAGIAN 4 — START, ID, DAN MESSAGE HANDLER
// ======================================================

// ======================================================
// /START
// ======================================================

bot.onText(
  /^\/start$/,
  async message => {

    try {

      const chatId =
        message.chat.id;

      const user =
        getUser(chatId);

      user.firstName =
        message.from?.first_name || "";

      user.username =
        message.from?.username || "";

      saveDatabase();

      await sendMainMenu(

        chatId,

        "🎉 BOT BERHASIL AKTIF!\n\n" +

        "✅ Telegram terhubung\n" +
        "✅ Database siap\n" +
        "✅ Menu aktif\n\n" +

        `🆔 Chat ID: ${chatId}\n\n` +

        "Silakan pilih menu di bawah."

      );

      console.log(
        `✅ /start dari ${chatId}`
      );

    } catch (error) {

      console.error(
        "❌ ERROR /start:",
        error
      );

    }

  }
);


// ======================================================
// /ID
// ======================================================

bot.onText(
  /^\/id$/,
  async message => {

    try {

      const chatId =
        message.chat.id;

      await sendMainMenu(

        chatId,

        `🆔 Chat ID Anda:\n\n${chatId}`

      );

    } catch (error) {

      console.error(
        "❌ ERROR /id:",
        error
      );

    }

  }
);


// ======================================================
// MESSAGE HANDLER UTAMA
// ======================================================

bot.on(
  "message",
  async message => {

    try {

      const chatId =
        message.chat.id;

      const user =
        getUser(chatId);

      // ==================================================
      // SIMPAN DATA USER
      // ==================================================

      if (message.from) {

        user.firstName =
          message.from.first_name || "";

        user.username =
          message.from.username || "";

        saveDatabase();

      }

      // ==================================================
      // ==================================================
// FOTO BUKTI PEMBAYARAN
// ==================================================

if (
  message.photo &&
  message.photo.length > 0
) {

  if (
    !user.subscriptionRequest
  ) {

    await bot.sendMessage(
      chatId,
      "⚠️ Belum ada permintaan subscription."
    );

    return;
  }


  if (
    !user.waitingPaymentProof
  ) {

    await bot.sendMessage(
      chatId,
      "⚠️ Bot belum menunggu bukti pembayaran."
    );

    return;
  }


  const photos =
    message.photo;

  const photo =
    photos[photos.length - 1];

  const photoId =
    photo.file_id;

  const request =
    user.subscriptionRequest;


  // ==================================================
  // SIMPAN BUKTI
  // ==================================================

  user.paymentProof = {

    fileId:
      photoId,

    messageId:
      message.message_id,

    receivedAt:
      new Date().toISOString()

  };

  user.waitingPaymentProof =
    false;

  saveDatabase();


  // ==================================================
  // KONFIRMASI USER
  // ==================================================

  await bot.sendMessage(

    chatId,

    "✅ BUKTI PEMBAYARAN DITERIMA\n\n" +

    `📦 Paket: ${
      request.packageName
    }\n` +

    `💰 Total: ${
      subscription.formatRupiah(
        request.price
      )
    }\n\n` +

    "⏳ Bukti pembayaran sedang diperiksa admin.\n" +
    "Mohon tunggu persetujuan."

  );


  // ==================================================
  // CEK ADMIN
  // ==================================================

  if (!ADMIN_ID) {

    console.error(
      "❌ ADMIN_ID belum diatur."
    );

    return;
  }


  // ==================================================
  // KIRIM FOTO KE ADMIN
  // ==================================================

  await bot.sendPhoto(

    ADMIN_ID,

    photoId,

    {

      caption:

        "🔔 PEMBAYARAN SUBSCRIPTION MASUK\n\n" +

        `👤 User ID: ${chatId}\n` +

        `👤 Nama: ${
          user.firstName || "-"
        }\n` +

        `🔗 Username: ${
          user.username
            ? "@" + user.username
            : "-"
        }\n\n` +

        `📦 Paket: ${
          request.packageName
        }\n` +

        `💰 Total: ${
          subscription.formatRupiah(
            request.price
          )
        }\n` +

        `⏳ Durasi: ${
          request.durationDays
        } hari\n\n` +

        "👇 Silakan periksa bukti pembayaran.",

      reply_markup: {

        inline_keyboard: [

          [

            {
              text:
                "✅ SETUJUI",

              callback_data:
                `APPROVE_${chatId}`
            },

            {
              text:
                "❌ TOLAK",

              callback_data:
                `REJECT_${chatId}`
            }

          ]

        ]

      }

    }

  );


  console.log(
    `✅ BUKTI PEMBAYARAN ${chatId} → ADMIN`
  );

  return;
}

      // ==================================================
      // PESAN TANPA TEXT
      // ==================================================

      if (!message.text) {
        return;
      }

      const text =
        message.text.trim();

      // ==================================================
      // COMMAND
      // ==================================================

      if (text.startsWith("/")) {
        return;
      }


      // ==================================================
      // PROFIL
      // ==================================================

      if (
        text === "👤 PROFIL"
      ) {

        await showProfile(
          chatId
        );

        return;
      }


      // ==================================================
      // KOTA YANG DIPILIH
      // ==================================================

      if (
        text ===
        "📍 KOTA YANG DIPILIH"
      ) {

        await showLocations(
          chatId
        );

        return;
      }


      // ==================================================
      // STATUS
      // ==================================================

      if (
        text === "📊 STATUS"
      ) {

        await showStatus(
          chatId
        );

        return;
      }


      // ==================================================
      // BANTUAN
      // ==================================================

      if (
        text === "❓ BANTUAN"
      ) {

        await showHelp(
          chatId
        );

        return;
      }


      // ==================================================
      // HUBUNGI ADMIN
      // ==================================================

      if (
        text ===
        "👨‍💼 HUBUNGI ADMIN"
      ) {

        await showAdmin(
          chatId
        );

        return;
      }


      // ==================================================
// MENU LAIN
// ==================================================

// ==================================================
// TOP UP / PILIH PAKET SUBSCRIPTION
// ==================================================

if (text === "💳 TOP UP") {

  await bot.sendMessage(

    chatId,

    subscription.getSubscriptionMessage(),

    {
      reply_markup:
        subscription.getSubscriptionKeyboard()
    }

  );

  return;
}


// ==================================================
// ==================================================
// TAMBAH KOTA
// ==================================================

if (text === "🏙️ TAMBAH KOTA") {

  // CEK SUBSCRIPTION AKTIF
  if (
    !subscription.hasActiveSubscription(user)
  ) {

    await bot.sendMessage(

      chatId,

      "🔒 FITUR TERKUNCI\n\n" +

      "Untuk memilih kota/kecamatan, " +
      "akun Anda harus memiliki subscription aktif.\n\n" +

      "💳 Silakan pilih paket terlebih dahulu " +
      "melalui menu TOP UP."

    );

    return;
  }


  // CEK KUOTA WILAYAH
  if (
    user.locationQuotaUsed === true
  ) {

    await bot.sendMessage(

      chatId,

      "🔒 KUOTA WILAYAH SUDAH DIGUNAKAN\n\n" +

      "Subscription Anda sudah digunakan " +
      "untuk memilih 1 wilayah.\n\n" +

      "💳 Untuk menambahkan kota/kecamatan lagi, " +
      "silakan lakukan TOP UP dan pilih paket baru."

    );

    return;
  }


  // BUKA PEMILIHAN WILAYAH
  try {

    await wilayah.showProvinsi(
      bot,
      chatId
    );

  } catch (error) {

    console.error(
      "❌ ERROR TAMBAH KOTA:",
      error
    );

    await bot.sendMessage(

      chatId,

      "❌ Gagal membuka pemilihan wilayah."

    );

  }

  return;
}

// ==================================================
// PANEL ADMIN
// ==================================================

if (text === "🛠️ PANEL ADMIN") {

  if (!isAdmin(chatId)) {

    await bot.sendMessage(
      chatId,
      "⛔ AKSES DITOLAK."
    );

    return;
  }

  const totalUsers =
    Object.keys(
      database.users
    ).length;

  const totalLocations =
    Object.values(
      database.locations
    ).reduce(

      (total, list) =>

        total +
        (
          Array.isArray(list)
            ? list.length
            : 0
        ),

      0
    );

  await bot.sendMessage(

    chatId,

    "🛠️ PANEL ADMIN\n\n" +

    `👥 Total User: ${totalUsers}\n` +

    `📍 Total Wilayah: ${totalLocations}`,

    {
      reply_markup:
        mainKeyboard(chatId)
    }

  );

  return;
}


// ==================================================
// NOMOR BLACKLIST
// ==================================================

if (text === "🚫 NOMOR BLACKLIST") {

  if (!isAdmin(chatId)) {

    await bot.sendMessage(
      chatId,
      "⛔ AKSES DITOLAK."
    );

    return;
  }

  await bot.sendMessage(

    chatId,

    "🚫 NOMOR BLACKLIST\n\n" +

    "Menu blacklist siap digunakan.",

    {
      reply_markup:
        mainKeyboard(chatId)
    }

  );

  return;
}



// ==================================================
// PESAN LAIN
// ==================================================

return;

} catch (error) {

  console.error(
    "❌ ERROR MESSAGE HANDLER:",
    error
  );

}

}
);


// ======================================================
// BAGIAN 5 — CALLBACK QUERY
// ======================================================

bot.on(
  "callback_query",
  async query => {

    try {

      const data =
        query.data || "";

      const chatId =
        query.message?.chat?.id;

      if (!chatId || !data) {
        return;
      }

      const user =
        getUser(chatId);

      console.log(
        "🔘 CALLBACK:",
        data,
        "USER:",
        chatId
      );


      // ==================================================
// PILIH PAKET — 1 MINGGU
// ==================================================

if (
  data === "SUBSCRIBE_WEEK"
) {

  await bot.answerCallbackQuery(
    query.id
  );

  const result =
    subscription.createSubscriptionRequest(
      user,
      "WEEK"
    );

  if (!result.success) {

    await bot.sendMessage(
      chatId,
      result.message
    );

    return;
  }

  user.waitingPaymentProof =
    true;

  saveDatabase();

  await bot.sendMessage(

    chatId,

    "💳 PEMBAYARAN SUBSCRIPTION\n\n" +

    "📦 Paket: 1 Minggu\n" +
    "💰 Harga: Rp35.000\n" +
    "⏳ Masa aktif: 7 hari\n\n" +

    topup.getTopupMessage() +

    "\n\n📸 Setelah transfer, " +
    "kirim FOTO bukti pembayaran di chat ini."

  );

  return;
}

      // ==================================================
// PILIH PAKET — 1 BULAN
// ==================================================

if (
  data === "SUBSCRIBE_MONTH"
) {

  await bot.answerCallbackQuery(
    query.id
  );

  const result =
    subscription.createSubscriptionRequest(
      user,
      "MONTH"
    );

  if (!result.success) {

    await bot.sendMessage(
      chatId,
      result.message
    );

    return;
  }

  user.waitingPaymentProof =
    true;

  saveDatabase();

  await bot.sendMessage(

    chatId,

    "💳 PEMBAYARAN SUBSCRIPTION\n\n" +

    "📦 Paket: 1 Bulan\n" +
    "💰 Harga: Rp100.000\n" +
    "⏳ Masa aktif: 30 hari\n\n" +

    topup.getTopupMessage() +

    "\n\n📸 Setelah transfer, " +
    "kirim FOTO bukti pembayaran di chat ini."

  );

  return;
}

      // ==================================================
// PILIH PAKET — 2 BULAN
// ==================================================

if (
  data === "SUBSCRIBE_TWO_MONTH"
) {

  await bot.answerCallbackQuery(
    query.id
  );

  const result =
    subscription.createSubscriptionRequest(
      user,
      "TWO_MONTH"
    );

  if (!result.success) {

    await bot.sendMessage(
      chatId,
      result.message
    );

    return;
  }

  user.waitingPaymentProof =
    true;

  saveDatabase();

  await bot.sendMessage(

    chatId,

    "💳 PEMBAYARAN SUBSCRIPTION\n\n" +

    "📦 Paket: 2 Bulan\n" +
    "💰 Harga: Rp180.000\n" +
    "⏳ Masa aktif: 60 hari\n\n" +

    topup.getTopupMessage() +

    "\n\n📸 Setelah transfer, " +
    "kirim FOTO bukti pembayaran di chat ini."

  );

  return;
}

      // ==================================================
      // PROVINSI
      // ==================================================

      if (
        data.startsWith("prov_")
      ) {

        await bot.answerCallbackQuery(
          query.id
        );

        const provData =
          data.substring(5);

        await wilayah.showKabupaten(
          bot,
          chatId,
          provData
        );

        return;
      }


      // ==================================================
      // KABUPATEN / KOTA
      // ==================================================

      if (
        data.startsWith("kab_")
      ) {

        await bot.answerCallbackQuery(
          query.id
        );

        const kabData =
          data.substring(4);

        await wilayah.showKecamatan(
          bot,
          chatId,
          kabData
        );

        return;
      }


      // ==================================================
      // KECAMATAN
      // ==================================================

      if (
        data.startsWith("kec_")
      ) {

        await bot.answerCallbackQuery(
          query.id
        );

        // CEK SUBSCRIPTION LAGI
        // Supaya user tidak bisa masuk wilayah
        // kalau subscription sudah expired.

        if (
          !subscription.hasActiveSubscription(
            user
          )
        ) {

          await bot.sendMessage(

            chatId,

            "🔒 SUBSCRIPTION TIDAK AKTIF\n\n" +

            "Akses wilayah membutuhkan " +
            "subscription aktif.\n\n" +

            "💳 Silakan buka menu TOP UP."

          );

          return;
        }

        const kecData =
          data.substring(4);

        const parts =
          kecData.split("|");

        const kecId =
          parts[0] || "";

        const provinsi =
          parts[1] || "";

        const kabupaten =
          parts[2] || "";

        const kecamatan =
          parts[3] || "";

        if (!kecId) {

          await bot.sendMessage(
            chatId,
            "❌ Data kecamatan tidak valid."
          );

          return;
        }

        const saved =
          saveUserLocation(

            chatId,

            {
              provinsi,
              kabupaten,
              kecamatan,
              kecamatanCode:
                kecId
            }

          );

        if (!saved) {

          await bot.sendMessage(

            chatId,

            "ℹ️ Wilayah tersebut sudah tersimpan.",

            {
              reply_markup:
                mainKeyboard(chatId)
            }

          );

          return;
        }

user.locationQuotaUsed = true;

saveDatabase();

await bot.sendMessage(

          chatId,

          "✅ WILAYAH BERHASIL DISIMPAN\n\n" +

          `🇮🇩 Provinsi: ${provinsi}\n` +

          `🏙️ Kabupaten/Kota: ${kabupaten}\n` +

          `📍 Kecamatan: ${kecamatan}\n\n` +

          "Wilayah sudah tersimpan di akun Anda.",

          {
            reply_markup:
              mainKeyboard(chatId)
          }

        );

        return;
      }

      // ==================================================
// ADMIN SETUJUI SUBSCRIPTION
// ==================================================

if (
  data.startsWith("APPROVE_")
) {

  if (!isAdmin(chatId)) {

    await bot.answerCallbackQuery(
      query.id,
      {
        text: "⛔ Akses ditolak.",
        show_alert: true
      }
    );

    return;
  }

  const targetUserId =
    data.substring("APPROVE_".length);

  const targetUser =
    getUser(targetUserId);

  if (
    !targetUser.subscriptionRequest
  ) {

    await bot.answerCallbackQuery(
      query.id,
      {
        text:
          "❌ Permintaan subscription tidak ditemukan.",
        show_alert: true
      }
    );

    return;
  }

  const packageId =
    targetUser
      .subscriptionRequest
      .packageId;

  const result =
    subscription.activateSubscription(
      targetUser,
      packageId
    );

  if (!result.success) {

    await bot.answerCallbackQuery(
      query.id,
      {
        text: result.message,
        show_alert: true
      }
    );

    return;
  }

  saveDatabase();

  await bot.answerCallbackQuery(
    query.id,
    {
      text:
        "✅ Subscription berhasil diaktifkan."
    }
  );

  await bot.sendMessage(

    targetUserId,

    "🎉 PEMBAYARAN DISETUJUI\n\n" +

    `📦 Paket: ${
      result.subscription.packageName
    }\n` +

    `💰 Harga: ${
      subscription.formatRupiah(
        result.subscription.price
      )
    }\n` +

    `⏳ Masa aktif: ${
      result.subscription.durationDays || 
      targetUser.subscriptionRequest?.durationDays ||
      "-"
    } hari\n\n` +

    "✅ Subscription Anda sekarang AKTIF.\n\n" +

    "🏙️ Anda sekarang dapat memilih kota/kecamatan.",

    {
      reply_markup:
        mainKeyboard(targetUserId)
    }

  );

  return;
}


            // ==================================================
      // CALLBACK TIDAK DIKENAL
      // ==================================================

      await bot.answerCallbackQuery(

        query.id,

        {
          text:
            "⚠️ Tombol tidak dikenali.",
          show_alert: false
        }

      );

    } catch (error) {

      console.error(
        "❌ ERROR CALLBACK QUERY:",
        error
      );

      try {

        await bot.answerCallbackQuery(

          query.id,

          {
            text:
              "❌ Terjadi kesalahan.",
            show_alert: true
          }

        );

      } catch (_) {}

    }

  }
);


// ======================================================
// TELEGRAM ERROR
// ======================================================

bot.on(
  "polling_error",
  error => {

    console.error(
      "❌ TELEGRAM POLLING ERROR:",
      error.message
    );

  }
);


// ======================================================
// ERROR GLOBAL
// ======================================================

process.on(
  "uncaughtException",
  error => {

    console.error(
      "❌ UNCAUGHT EXCEPTION:",
      error
    );

  }
);

process.on(
  "unhandledRejection",
  error => {

    console.error(
      "❌ UNHANDLED REJECTION:",
      error
    );

  }
);


// ======================================================
// HTTP SERVER
// ======================================================

const server =
  http.createServer(
    async (req, res) => {

      try {

        // ======================================================
        // HEALTH CHECK
        // ======================================================

        if (
          req.url === "/" ||
          req.url === "/health"
        ) {

          res.writeHead(
            200,
            {
              "Content-Type":
                "application/json"
            }
          );

          res.end(
            JSON.stringify({
              status: "ok",
              bot: "Telegram aktif"
            })
          );

          return;
        }


        // ======================================================
        // GREEN API WEBHOOK
        // ======================================================

        if (
          req.method === "POST" &&
          req.url === "/green-api/webhook"
        ) {

          let body = "";

          req.on(
            "data",
            chunk => {

              body +=
                chunk.toString();

            }
          );

          await new Promise(
            resolve => {

              req.on(
                "end",
                resolve
              );

            }
          );


          // ====================================================
          // PARSE DATA GREEN API
          // ====================================================

          let data;

          try {

            data =
              JSON.parse(body);

          } catch (error) {

            console.error(
              "❌ GREEN API JSON ERROR:",
              error
            );

            res.writeHead(
              400,
              {
                "Content-Type":
                  "application/json"
              }
            );

            res.end(
              JSON.stringify({
                status: "error",
                message:
                  "Invalid JSON"
              })
            );

            return;
          }


          // ====================================================
// GREEN API WEBHOOK — DATA PESAN WHATSAPP
// ====================================================

const groupId =
  data?.senderData?.chatId ||
  "tidak diketahui";

const groupName =
  data?.senderData?.chatName ||
  "Nama grup tidak diketahui";

const senderName =
  data?.senderData?.senderName ||
  "Pengirim tidak diketahui";

const messageType =
  data?.messageData?.typeMessage ||
  "tidak diketahui";

let messageText = "";

if (
  messageType === "textMessage"
) {

  messageText =
    data?.messageData?.textMessageData?.textMessage ||
    "";

}

else if (
  messageType === "extendedTextMessage"
) {

  messageText =
    data?.messageData?.extendedTextMessageData?.text ||
    "";

}


// ====================================================
// TAMPILKAN DI RAILWAY
// ====================================================

console.log(
  "📱 GREEN API WEBHOOK MASUK"
);

console.log(
  "👥 GRUP WHATSAPP:",
  groupName
);

console.log(
  "📌 ID GRUP:",
  groupId
);

console.log(
  "👤 PENGIRIM:",
  senderName
);

console.log(
  "💬 ISI PESAN:",
  messageText || "(pesan kosong)"
);

console.log(
  "📱 TIPE:",
  messageType
);
          
          // ====================================================
          // BALAS GREEN API
          // ====================================================

          res.writeHead(
            200,
            {
              "Content-Type":
                "application/json"
            }
          );

          res.end(
            JSON.stringify({
              status: "ok"
            })
          );

          return;
        }


        // ====================================================
// TERUSKAN PESAN GRUP BERDASARKAN KABUPATEN + KECAMATAN
// ====================================================

// Hanya proses pesan dari GRUP WhatsApp
const chatIdWA =
  data?.senderData?.chatId || "";

if (
  chatIdWA.endsWith("@g.us")
) {

  // ==================================================
  // AMBIL ISI PESAN
  // ==================================================

  const isiPesan =
    data?.messageData?.textMessageData?.textMessage ||
    data?.messageData?.extendedTextMessageData?.text ||
    "";

  // ==================================================
  // AMBIL NAMA GRUP & PENGIRIM
  // ==================================================

  const namaGrup =
    data?.senderData?.chatName ||
    "Grup WhatsApp";

  const namaPengirim =
    data?.senderData?.senderName ||
    "Tidak diketahui";

  console.log(
    "📝 ISI PESAN:",
    isiPesan || "KOSONG"
  );

  // Kalau tidak ada isi pesan, abaikan
  if (!isiPesan) {
    return;
  }

  // ====================================================
// TERUSKAN PESAN KE GREEN ROUTER
// ====================================================

await forwardWhatsAppMessage(
  bot,
  database,
  data
);

  // ==================================================
  // CARI KABUPATEN
  // ==================================================

  const kabupatenMatch =
    isiPesan.match(
      /KABUPATEN\s*:\s*(.+)/i
    );

  // ==================================================
  // CARI KECAMATAN
  // ==================================================

  const kecamatanMatch =
    isiPesan.match(
      /KECAMATAN\s*:\s*(.+)/i
    );

  if (
    !kabupatenMatch ||
    !kecamatanMatch
  ) {

    console.log(
      "ℹ️ Kabupaten/kecamatan tidak ditemukan."
    );

  } else {

    const kabupatenPesan =
      kabupatenMatch[1]
        .trim()
        .toUpperCase();

    const kecamatanPesan =
      kecamatanMatch[1]
        .trim()
        .toUpperCase();

    console.log(
      "🏙️ KABUPATEN:",
      kabupatenPesan
    );

    console.log(
      "📍 KECAMATAN:",
      kecamatanPesan
    );

    // ==================================================
    // CARI USER TELEGRAM YANG COCOK
    // ==================================================

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

      for (
        const location of locations
      ) {

        const kabupatenUser =
          String(
            location.kabupaten || ""
          )
            .trim()
            .toUpperCase();

        const kecamatanUser =
          String(
            location.kecamatan || ""
          )
            .trim()
            .toUpperCase();

        // ==================================================
        // COCOK KABUPATEN + KECAMATAN
        // ==================================================

        if (
          kabupatenUser ===
            kabupatenPesan &&
          kecamatanUser ===
            kecamatanPesan
        ) {

          console.log(
            "🎯 WILAYAH COCOK USER:",
            userId
          );

          // ==================================================
          // KIRIM KE TELEGRAM
          // ==================================================

          await bot.sendMessage(

            userId,

            "📢 PESAN WILAYAH ANDA\n\n" +

            `👥 Grup: ${namaGrup}\n` +

            `👤 Pengirim: ${namaPengirim}\n\n` +

            `🏙️ Kabupaten: ${kabupatenPesan}\n` +

            `📍 Kecamatan: ${kecamatanPesan}\n\n` +

            "━━━━━━━━━━━━━━\n\n" +

            isiPesan

          );

          console.log(
            `✅ PESAN DITERUSKAN → ${userId}`
          );

        }

      }

    }

  }

}


        // ======================================================
        // URL TIDAK DITEMUKAN
        // ======================================================

        res.writeHead(
          404,
          {
            "Content-Type":
              "application/json"
          }
        );

        res.end(
          JSON.stringify({
            error:
              "Not Found"
          })
        );


      } catch (error) {

        console.error(
          "❌ HTTP ERROR:",
          error
        );

        res.writeHead(
          500,
          {
            "Content-Type":
              "application/json"
          }
        );

        res.end(
          JSON.stringify({
            error:
              "Internal Server Error"
          })
        );

      }

    }
  );


        
// ======================================================
// START SERVER
// ======================================================

server.listen(
  PORT,
  () => {

    console.log(
      `🌐 HTTP SERVER AKTIF DI PORT ${PORT}`
    );

    console.log(
      "🤖 BOT TELEGRAM SIAP DIGUNAKAN"
    );

  }
);
