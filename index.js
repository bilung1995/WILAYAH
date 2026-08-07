// ================================================
// BOT TELEGRAM + GREEN API
// VERSI DENGAN KUOTA WILAYAH
//
// 1 TOP UP = 2 KUOTA WILAYAH
// 1 PILIH KOTA = 1 KUOTA
// KUOTA HABIS = WAJIB TOP UP LAGI
// ================================================

require("dotenv").config();

const http = require("http");
const fs = require("fs");
const path = require("path");
const TelegramBot = require("node-telegram-bot-api");

const subscription = require("./subscription");
const topup = require("./topup");
const wilayah = require("./wilayah");
const blacklist = require("./blacklist");

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
// START
// ======================================================

console.log(
  "======================================"
);

console.log(
  "🚀 BOT TELEGRAM STARTING"
);

console.log(
  "======================================"
);


// ======================================================
// DATABASE
// ======================================================

const DATA_FILE =
  path.join(
    __dirname,
    "bot-data.json"
  );


function defaultDatabase() {

  return {

    users: {},

    locations: {},

    transactions: {},

    topups: {},

    blacklist: []

  };

}


function loadDatabase() {

  try {

    if (
      !fs.existsSync(DATA_FILE)
    ) {

      const data =
        defaultDatabase();

      fs.writeFileSync(

        DATA_FILE,

        JSON.stringify(
          data,
          null,
          2
        )

      );

      return data;

    }


    const raw =
      fs.readFileSync(
        DATA_FILE,
        "utf8"
      );


    const parsed =
      JSON.parse(raw);


    return {

      ...defaultDatabase(),

      ...parsed

    };


  } catch (error) {

    console.error(
      "❌ DATABASE ERROR:",
      error.message
    );

    return defaultDatabase();

  }

}


let database =
  loadDatabase();


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
// TELEGRAM
// ======================================================

const bot =
  new TelegramBot(

    TELEGRAM_TOKEN,

    {
      polling: true
    }

  );


console.log(
  "✅ Telegram polling aktif."
);


// ======================================================
// USER
// ======================================================

function getUser(chatId) {

  const id =
    String(chatId);


  if (
    !database.users[id]
  ) {

    database.users[id] = {

      id,

      firstName: "",

      username: "",

      balance: 0,

      subscription: null,

      subscriptionRequest: null,

      waitingPaymentProof: false,

      paymentProof: null,

      trialUsed: false,

      // ==============================================
      // KUOTA WILAYAH
      // 1 TOP UP = 2 KUOTA
      // ==============================================

      locationQuota: 0,

      createdAt:
        new Date().toISOString()

    };


    saveDatabase();

  }


  // ==================================================
  // MIGRASI USER LAMA
  // ==================================================

  if (
    typeof database.users[id].locationQuota !==
    "number"
  ) {

    database.users[id].locationQuota = 0;

  }


  return database.users[id];

}


// ======================================================
// LOKASI
// ======================================================

function getUserLocations(
  chatId
) {

  const id =
    String(chatId);


  if (
    !database.locations[id]
  ) {

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

  const id =
    String(chatId);


  if (
    !database.locations[id]
  ) {

    database.locations[id] = [];

  }


  // ==================================================
  // CEK APAKAH KECAMATAN SUDAH ADA
  // ==================================================

  const exists =
    database.locations[id].some(

      item =>

        String(
          item.kecamatanCode
        ) ===
        String(
          location.kecamatanCode
        )

    );


  // ==================================================
  // JIKA SUDAH ADA
  // JANGAN TAMBAHKAN DAN
  // JANGAN KURANGI KUOTA
  // ==================================================

  if (exists) {

    return false;

  }


  // ==================================================
  // SIMPAN WILAYAH BARU
  // ==================================================

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

    ADMIN_ID !== "" &&

    String(chatId) ===
    String(ADMIN_ID)

  );

}


// ======================================================
// KEYBOARD UTAMA
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


  // ==================================================
  // MENU KHUSUS ADMIN
  // HANYA ADMIN YANG BISA MELIHAT
  // ==================================================

  if (
    isAdmin(chatId)
  ) {

    keyboard.push(

      [
        "🛠️ PANEL ADMIN",
        "🚫 NOMOR BLACKLIST"
      ]

    );

  }


  return {

    keyboard,

    resize_keyboard: true,

    one_time_keyboard: false

  };

}


// ======================================================
// PROFIL
// ======================================================

async function showProfile(
  chatId
) {

  const user =
    getUser(chatId);


  const locations =
    getUserLocations(chatId);


  const subscriptionText =
    subscription.getSubscriptionInfo(
      user
    );


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
    }\n` +

    `💰 Saldo: Rp ${
      Number(
        user.balance || 0
      ).toLocaleString("id-ID")
    }\n` +

    `📍 Wilayah tersimpan: ${
      locations.length
    }\n` +

    `🎟️ Sisa kuota wilayah: ${
      Number(
        user.locationQuota || 0
      )
    }\n\n` +

    subscriptionText,

    {

      reply_markup:
        mainKeyboard(chatId)

    }

  );

}


// ======================================================
// KOTA YANG DIPILIH
// ======================================================

async function showLocations(
  chatId
) {

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

        `${index + 1}. ${
          location.provinsi || "-"
        }\n` +

        `   ${
          location.kabupaten || "-"
        }\n` +

        `   ${
          location.kecamatan || "-"
        }\n\n`;

    }

  );


  text +=

    `🎟️ Sisa kuota wilayah: ${
      Number(
        getUser(chatId).locationQuota || 0
      )
    }`;


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
// TOP UP
// ======================================================

async function showTopup(
  chatId
) {

  topup.startTopup(
    String(chatId)
  );


  await bot.sendMessage(

    chatId,

    topup.getTopupMessage(),

    {

      reply_markup:
        mainKeyboard(chatId)

    }

  );

}


// ======================================================
// BANTUAN
// ======================================================

async function showHelp(
  chatId
) {

  await bot.sendMessage(

    chatId,

    "❓ BANTUAN\n\n" +

    "1️⃣ Tekan /start untuk membuka menu.\n\n" +

    "2️⃣ Pilih 🏙️ TAMBAH KOTA.\n\n" +

    "3️⃣ Pilih provinsi.\n\n" +

    "4️⃣ Pilih kabupaten/kota.\n\n" +

    "5️⃣ Pilih kecamatan.\n\n" +

    "6️⃣ Wilayah yang dipilih akan tersimpan di akun Anda.\n\n" +

    "7️⃣ Satu kali TOP UP memberikan 2 kuota wilayah.\n\n" +

    "8️⃣ Setiap wilayah baru menggunakan 1 kuota.\n\n" +

    "9️⃣ Jika kuota habis, lakukan TOP UP lagi.\n\n" +

    "🔟 Untuk subscription, pilih paket lalu ikuti instruksi pembayaran.",

    {

      reply_markup:
        mainKeyboard(chatId)

    }

  );

}


// ======================================================
// HUBUNGI ADMIN
// ======================================================

async function showAdmin(
  chatId
) {

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
// PANEL ADMIN
// ======================================================

async function showAdminPanel(
  chatId
) {

  // ==================================================
  // CEK ADMIN
  // ==================================================

  if (
    !isAdmin(chatId)
  ) {

    await bot.sendMessage(

      chatId,

      "⛔ AKSES DITOLAK.\n\n" +
      "Menu ini hanya dapat digunakan oleh admin."

    );

    return;

  }


  // ==================================================
  // DATA USER
  // ==================================================

  const users =
    Object.keys(
      database.users
    ).length;


  // ==================================================
  // DATA WILAYAH
  // ==================================================

  const locations =
    Object.values(
      database.locations || {}
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


  // ==================================================
  // DATA TOP UP
  // ==================================================

  const topups =
    Object.keys(
      database.topups || {}
    ).length;


  // ==================================================
  // DATA BLACKLIST
  // ==================================================

  const blacklistCount =

    Array.isArray(
      blacklist.blacklistNumbers
    )

      ? blacklist.blacklistNumbers.length

      : 0;


  // ==================================================
  // HITUNG USER AKTIF
  // ==================================================

  let activeSubscriptions = 0;


  Object.values(
    database.users || {}
  ).forEach(

    user => {

      try {

        if (
          subscription.hasActiveSubscription(
            user
          )
        ) {

          activeSubscriptions++;

        }

      } catch (_) {}

    }

  );


  // ==================================================
  // KIRIM PANEL
  // ==================================================

  await bot.sendMessage(

    chatId,

    "🛠️ PANEL ADMIN\n\n" +

    "📊 STATISTIK BOT\n\n" +

    `👥 Total User: ${users}\n` +

    `🟢 Subscription Aktif: ${
      activeSubscriptions
    }\n` +

    `📍 Total Wilayah: ${
      locations
    }\n` +

    `💳 Total Top Up: ${
      topups
    }\n` +

    `🚫 Blacklist: ${
      blacklistCount
    }\n\n` +

    "🤖 Telegram Bot: AKTIF\n" +

    "📲 Green API: AKTIF\n" +

    "💾 Database: AKTIF",

    {

      reply_markup: {

        inline_keyboard: [

          [

            {

              text:
                "🔄 REFRESH PANEL",

              callback_data:
                "ADMIN_REFRESH"

            }

          ]

        ]

      }

    }

  );

}


// ======================================================
// BLACKLIST
// ======================================================

async function showBlacklist(
  chatId
) {

  // ==================================================
  // CEK ADMIN
  // ==================================================

  if (
    !isAdmin(chatId)
  ) {

    await bot.sendMessage(

      chatId,

      "⛔ Menu blacklist hanya untuk admin."

    );

    return;

  }


  // ==================================================
  // AMBIL DAFTAR BLACKLIST
  // ==================================================

  let blacklistText;


  try {

    blacklistText =
      blacklist.getBlacklistList();

  } catch (error) {

    console.error(
      "❌ ERROR BLACKLIST:",
      error
    );

    blacklistText =
      "🚫 DAFTAR BLACKLIST\n\n" +
      "Gagal mengambil daftar blacklist.";

  }


  // ==================================================
  // KIRIM
  // ==================================================

  await bot.sendMessage(

    chatId,

    blacklistText,

    {

      reply_markup:
        mainKeyboard(chatId)

    }

  );

}


// ======================================================
// COMMAND /START
// ======================================================

bot.onText(

  /^\/start$/,

  async message => {

    try {

      const chatId =
        message.chat.id;


      // ==================================================
      // BUAT / AMBIL USER
      // ==================================================

      const user =
        getUser(chatId);


      // ==================================================
      // UPDATE DATA TELEGRAM
      // ==================================================

      user.firstName =
        message.from?.first_name || "";


      user.username =
        message.from?.username || "";


      saveDatabase();


      // ==================================================
      // CEK ADMIN
      // ==================================================

      const adminText =

        isAdmin(chatId)

          ? "\n🛠️ Anda login sebagai ADMIN."

          : "";


      // ==================================================
      // PESAN START
      // ==================================================

      await bot.sendMessage(

        chatId,

        "🎉 BOT BERHASIL AKTIF!\n\n" +

        "✅ Telegram terhubung\n" +

        "✅ Database siap\n" +

        "✅ Menu aktif\n" +

        "📲 Green API siap menerima pesan\n\n" +

        `🆔 Chat ID: ${chatId}\n` +

        `🎟️ Kuota wilayah: ${
          Number(
            user.locationQuota || 0
          )
        }` +

        adminText +

        "\n\nSilakan pilih menu di bawah.",

        {

          reply_markup:
            mainKeyboard(chatId)

        }

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
// COMMAND /ID
// ======================================================

bot.onText(

  /^\/id$/,

  async message => {

    try {

      const chatId =
        message.chat.id;


      await bot.sendMessage(

        chatId,

        `🆔 Chat ID Anda:\n\n${chatId}`,

        {

          reply_markup:
            mainKeyboard(chatId)

        }

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
// MENU UTAMA
// ======================================================

bot.on(

  "message",

  async message => {

    try {

      // ==================================================
      // ABAIKAN PESAN BUKAN TEKS
      // ==================================================

      if (
        !message.text
      ) {

        return;

      }


      // ==================================================
      // ABAIKAN COMMAND
      // /start DAN /id SUDAH DITANGANI DI ATAS
      // ==================================================

      if (
        message.text.startsWith("/")
      ) {

        return;

      }


      // ==================================================
      // DATA USER
      // ==================================================

      const chatId =
        message.chat.id;


      const text =
        message.text.trim();


      const user =
        getUser(chatId);


      // ==================================================
      // UPDATE NAMA USER
      // ==================================================

      user.firstName =
        message.from?.first_name ||
        user.firstName ||
        "";


      user.username =
        message.from?.username ||
        user.username ||
        "";


      saveDatabase();


      // ==================================================
      // PROFIL
      // ==================================================

      if (
        text ===
        "👤 PROFIL"
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
      // TOP UP
      // ==================================================

      if (
        text ===
        "💳 TOP UP"
      ) {

        await showTopup(
          chatId
        );

        return;

      }


      // ==================================================
      // STATUS
      // ==================================================

      if (
        text ===
        "📊 STATUS"
      ) {

        let statusSubscription;


        if (

          subscription.hasActiveSubscription(
            user
          )

        ) {

          statusSubscription =
            subscription.getSubscriptionInfo(
              user
            );

        } else {

          statusSubscription =
            "🔴 Subscription tidak aktif.";

        }


        await bot.sendMessage(

          chatId,

          "📊 STATUS BOT\n\n" +

          "🟢 Telegram: AKTIF\n" +

          "🟢 Database: AKTIF\n" +

          "🟢 Server: AKTIF\n" +

          "🟢 Green API: SIAP\n\n" +

          `🎟️ Kuota wilayah: ${
            Number(
              user.locationQuota || 0
            )
          }\n\n` +

          statusSubscription,

          {

            reply_markup:
              mainKeyboard(chatId)

          }

        );


        return;

      }


      // ==================================================
      // BANTUAN
      // ==================================================

      if (
        text ===
        "❓ BANTUAN"
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
      // NOMOR BLACKLIST
      // ==================================================

      if (
        text ===
        "🚫 NOMOR BLACKLIST"
      ) {

        await showBlacklist(
          chatId
        );

        return;

      }


      // ==================================================
      // PANEL ADMIN
      // ==================================================

      if (
        text ===
        "🛠️ PANEL ADMIN"
      ) {

        await showAdminPanel(
          chatId
        );

        return;

      }


      // ==================================================
// TAMBAH KOTA
// ==================================================

if (
  text ===
  "🏙️ TAMBAH KOTA"
) {

  // ==================================================
  // CEK SUBSCRIPTION
  // ==================================================

  if (
    !subscription.hasActiveSubscription(
      user
    )
  ) {

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
  // CEK KUOTA WILAYAH
  //
  // 1 TOP UP = 2 KUOTA
  // 1 PILIH WILAYAH = 1 KUOTA
  // ==================================================

  const quota =
    Number(
      user.locationQuota || 0
    );


  if (
    quota <= 0
  ) {

    await bot.sendMessage(

      chatId,

      "⚠️ KUOTA WILAYAH HABIS\n\n" +

      "Anda sudah menggunakan seluruh kuota wilayah.\n\n" +

      "💳 Silakan TOP UP terlebih dahulu " +

      "untuk mendapatkan 2 kuota wilayah lagi.",

      {
        reply_markup:
          mainKeyboard(chatId)
      }

    );

    return;

  }


  // ==================================================
  // SUBSCRIPTION AKTIF
  // + KUOTA MASIH ADA
  // ==================================================

  await wilayah.showProvinsi(

    bot,

    chatId

  );


  return;

    }


      // ==================================================
      // PESAN TIDAK DIKENAL
      // ==================================================

      await bot.sendMessage(

        chatId,

        "⚠️ Menu tidak dikenali.\n\n" +

        "Silakan pilih tombol yang tersedia.",

        {

          reply_markup:
            mainKeyboard(chatId)

        }

      );


    } catch (error) {

      console.error(

        "❌ ERROR MENU UTAMA:",

        error

      );


      try {

        await bot.sendMessage(

          message.chat.id,

          "❌ Terjadi kesalahan pada bot.\n\n" +
          "Silakan coba lagi."

        );

      } catch (_) {}

    }

  }

);


// ======================================================
// CALLBACK QUERY
// ======================================================

bot.on(
  "callback_query",
  async query => {

    try {

      const chatId =
        query.message?.chat?.id;

      const data =
        query.data || "";


      if (
        !chatId ||
        !data
      ) {

        return;

      }


      console.log(
        "🔘 CALLBACK:",
        data,
        "USER:",
        chatId
      );


      // ==================================================
      // ADMIN REFRESH PANEL
      // ==================================================

      if (
        data ===
        "ADMIN_REFRESH"
      ) {

        if (
          !isAdmin(chatId)
        ) {

          await bot.answerCallbackQuery(

            query.id,

            {
              text:
                "⛔ Anda bukan admin.",
              show_alert: true
            }

          );

          return;

        }


        await bot.answerCallbackQuery(
          query.id,
          {
            text:
              "🔄 Panel diperbarui."
          }
        );


        await showAdminPanel(
          chatId
        );


        return;

      }


      // ==================================================
      // ADMIN APPROVE / REJECT SUBSCRIPTION
      // ==================================================

      if (

        data.startsWith(
          "APPROVE_"
        ) ||

        data.startsWith(
          "REJECT_"
        )

      ) {


        // ==================================================
        // CEK ADMIN
        // ==================================================

        if (
          !isAdmin(chatId)
        ) {

          await bot.answerCallbackQuery(

            query.id,

            {
              text:
                "⛔ Anda bukan admin.",
              show_alert: true
            }

          );

          return;

        }


        // ==================================================
        // AMBIL USER ID
        // ==================================================

        const userId =

          data
            .replace(
              "APPROVE_",
              ""
            )
            .replace(
              "REJECT_",
              ""
            );


        const user =
          getUser(userId);


        if (
          !user
        ) {

          await bot.answerCallbackQuery(

            query.id,

            {
              text:
                "❌ User tidak ditemukan.",
              show_alert: true
            }

          );

          return;

        }


        // ==================================================
        // APPROVE
        // ==================================================

        if (

          data.startsWith(
            "APPROVE_"
          )

        ) {


          if (
            !user.subscriptionRequest
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


          // ==================================================
          // AMBIL PAKET
          // ==================================================

          const packageId =

            user
              .subscriptionRequest
              .packageId;


          // ==================================================
          // AKTIFKAN SUBSCRIPTION
          // ==================================================

          const result =

            subscription.activateSubscription(

              user,

              packageId

            );


          if (
            !result.success
          ) {

            await bot.answerCallbackQuery(

              query.id,

              {
                text:
                  result.message ||
                  "❌ Gagal mengaktifkan subscription.",
                show_alert: true
              }

            );

            return;

          }


          // ==================================================
          // RESET STATUS PEMBAYARAN
          // ==================================================

          user.waitingPaymentProof =
            false;

          user.paymentProof =
            null;

          user.subscriptionRequest =
            null;


          saveDatabase();


          // ==================================================
          // CALLBACK ADMIN
          // ==================================================

          await bot.answerCallbackQuery(

            query.id,

            {
              text:
                "✅ Subscription diaktifkan."
            }

          );


          // ==================================================
          // KIRIM KE USER
          // ==================================================

          await bot.sendMessage(

            userId,

            "🎉 PEMBAYARAN DITERIMA!\n\n" +

            "✅ Subscription Anda sudah aktif.\n\n" +

            subscription.getSubscriptionInfo(
              user
            ) +

            "\n\n" +

            `🎟️ Kuota wilayah Anda: ${
              Number(
                user.locationQuota || 0
              )
            }`,

            {

              reply_markup:
                mainKeyboard(userId)

            }

          );


          // ==================================================
          // KIRIM KONFIRMASI ADMIN
          // ==================================================

          await bot.sendMessage(

            chatId,

            "✅ SUBSCRIPTION BERHASIL DIAKTIFKAN\n\n" +

            `👤 User ID: ${userId}\n` +

            `📦 Paket: ${
              result.subscription.packageName
            }`

          );


          return;

        }


        // ==================================================
        // REJECT
        // ==================================================

        if (

          data.startsWith(
            "REJECT_"
          )

        ) {


          // ==================================================
          // RESET REQUEST
          // ==================================================

          user.subscriptionRequest =
            null;

          user.waitingPaymentProof =
            false;

          user.paymentProof =
            null;


          saveDatabase();


          // ==================================================
          // CALLBACK ADMIN
          // ==================================================

          await bot.answerCallbackQuery(

            query.id,

            {
              text:
                "❌ Pembayaran ditolak."
            }

          );


          // ==================================================
          // KIRIM KE USER
          // ==================================================

          await bot.sendMessage(

            userId,

            "❌ PEMBAYARAN DITOLAK\n\n" +

            "Bukti pembayaran Anda ditolak oleh admin.\n\n" +

            "Silakan hubungi admin jika ada masalah.",

            {

              reply_markup:
                mainKeyboard(userId)

            }

          );


          // ==================================================
          // KONFIRMASI KE ADMIN
          // ==================================================

          await bot.sendMessage(

            chatId,

            "❌ PEMBAYARAN USER DITOLAK\n\n" +

            `👤 User ID: ${userId}`

          );


          return;

        }

      }


      // ==================================================
      // SUBSCRIPTION
      // ==================================================

      if (

        data.startsWith(
          "SUBSCRIBE_"
        )

      ) {

        const packageId =

          data.replace(
            "SUBSCRIBE_",
            ""
          );


        const user =
          getUser(chatId);


        // ==================================================
        // TRIAL
        // ==================================================

        if (

          packageId ===
          "TRIAL"

        ) {


          const result =

            subscription.activateTrial(
              user
            );


          if (
            !result.success
          ) {

            await bot.answerCallbackQuery(

              query.id,

              {
                text:
                  result.message,
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
                "🎁 Trial berhasil diaktifkan!"
            }

          );


          await bot.sendMessage(

            chatId,

            "🎉 TRIAL BERHASIL DIAKTIFKAN!\n\n" +

            subscription.getSubscriptionInfo(
              user
            ) +

            "\n\n" +

            "Sekarang Anda sudah bisa memilih wilayah.",

            {

              reply_markup:
                mainKeyboard(chatId)

            }

          );


          return;

        }


        // ==================================================
        // PAKET BERBAYAR
        // ==================================================

        const result =

          subscription.createSubscriptionRequest(

            user,

            packageId

          );


        if (
          !result.success
        ) {

          await bot.answerCallbackQuery(

            query.id,

            {
              text:
                result.message ||
                "❌ Gagal membuat permintaan.",
              show_alert: true
            }

          );

          return;

        }


        // ==================================================
        // TUNGGU BUKTI PEMBAYARAN
        // ==================================================

        user.waitingPaymentProof =
          true;


        saveDatabase();


        await bot.answerCallbackQuery(
          query.id
        );


        await bot.sendMessage(

          chatId,

          "✅ PERMINTAAN SUBSCRIPTION DIBUAT\n\n" +

          `📦 Paket: ${
            result.package.name
          }\n` +

          `💰 Harga: ${
            subscription.formatRupiah(
              result.package.price
            )
          }\n` +

          `⏳ Masa aktif: ${
            result.package.durationDays
          } hari\n\n` +

          "Silakan lakukan pembayaran.\n\n" +

          "Setelah pembayaran selesai, " +

          "kirim FOTO bukti transfer di chat ini.\n\n" +

          "⏳ Bukti akan diteruskan kepada admin untuk diperiksa.",

          {

            reply_markup:
              mainKeyboard(chatId)

          }

        );


        return;

      }


      // ==================================================
      // PILIH PROVINSI
      // ==================================================

      if (

        data.startsWith(
          "prov_"
        )

      ) {

        const provData =

          data.replace(
            "prov_",
            ""
          );


        console.log(

          "🏙️ PROVINSI DIPILIH:",

          provData

        );


        await bot.answerCallbackQuery(
          query.id
        );


        await wilayah.showKabupaten(

          bot,

          chatId,

          provData

        );


        return;

      }


      // ==================================================
      // PILIH KABUPATEN / KOTA
      // ==================================================

      if (

        data.startsWith(
          "kab_"
        )

      ) {

        const kabData =

          data.replace(
            "kab_",
            ""
          );


        console.log(

          "🏙️ KABUPATEN DIPILIH:",

          kabData

        );


        await bot.answerCallbackQuery(
          query.id
        );


        await wilayah.showKecamatan(

          bot,

          chatId,

          kabData

        );


        return;

      }


      // ==================================================
      // PILIH KECAMATAN
      // ==================================================

      if (

        data.startsWith(
          "kec_"
        )

      ) {

        const kecData =

          data.replace(
            "kec_",
            ""
          );


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


        console.log(

          "📍 KECAMATAN DIPILIH:",

          {

            kecId,

            provinsi,

            kabupaten,

            kecamatan

          }

        );


        // ==================================================
        // CEK KECAMATAN VALID
        // ==================================================

        if (
          !kecId
        ) {

          await bot.answerCallbackQuery(

            query.id,

            {

              text:
                "❌ Kecamatan tidak valid.",

              show_alert: true

            }

          );

          return;

        }


        // ==================================================
        // AMBIL USER
        // ==================================================

        const user =
          getUser(chatId);


        // ==================================================
        // CEK KUOTA
        //
        // 1 TOP UP = 2
        // 1 WILAYAH = 1
        // ==================================================

        const currentQuota =

          Number(
            user.locationQuota || 0
          );


        if (
          currentQuota <= 0
        ) {

          await bot.answerCallbackQuery(

            query.id,

            {

              text:
                "⚠️ Kuota wilayah habis. Silakan TOP UP terlebih dahulu.",

              show_alert: true

            }

          );


          await bot.sendMessage(

            chatId,

            "⚠️ KUOTA WILAYAH HABIS\n\n" +

            "Anda sudah menggunakan 2 kuota wilayah dari TOP UP sebelumnya.\n\n" +

            "💳 Silakan TOP UP untuk mendapatkan 2 kuota wilayah lagi.",

            {

              reply_markup:
                mainKeyboard(chatId)

            }

          );


          return;

        }


        // ==================================================
        // CEK APAKAH WILAYAH SUDAH TERSIMPAN
        // ==================================================

        const locations =
          getUserLocations(chatId);


        const alreadyExists =

          locations.some(

            item =>

              String(
                item.kecamatanCode
              ) ===
              String(
                kecId
              )

          );


        if (
          alreadyExists
        ) {

          await bot.answerCallbackQuery(

            query.id,

            {

              text:
                "ℹ️ Wilayah ini sudah tersimpan.",

              show_alert: true

            }

          );


          await bot.sendMessage(

            chatId,

            "ℹ️ WILAYAH SUDAH TERSIMPAN\n\n" +

            `🇮🇩 Provinsi: ${provinsi}\n` +

            `🏙️ Kabupaten/Kota: ${kabupaten}\n` +

            `📍 Kecamatan: ${kecamatan}\n\n` +

            `🎟️ Sisa kuota wilayah: ${
              currentQuota
            }\n\n` +

            "Kuota tidak dikurangi karena wilayah ini sudah pernah dipilih.",

            {

              reply_markup:
                mainKeyboard(chatId)

            }

          );


          return;

        }


        // ==================================================
        // SIMPAN WILAYAH BARU
        // ==================================================

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


        if (
          !saved
        ) {

          await bot.answerCallbackQuery(

            query.id,

            {

              text:
                "ℹ️ Wilayah sudah tersimpan.",

              show_alert: true

            }

          );

          return;

        }


        // ==================================================
        // KURANGI 1 KUOTA
        // ==================================================

        user.locationQuota =

          currentQuota - 1;


        saveDatabase();


        console.log(

          "📊 SISA KUOTA WILAYAH:",

          user.locationQuota

        );


        // ==================================================
        // BERHASIL
        // ==================================================

        await bot.answerCallbackQuery(

          query.id,

          {

            text:
              "✅ Wilayah berhasil disimpan."

          }

        );


        await bot.sendMessage(

          chatId,

          "✅ WILAYAH BERHASIL DISIMPAN\n\n" +

          `🇮🇩 Provinsi: ${provinsi}\n` +

          `🏙️ Kabupaten/Kota: ${kabupaten}\n` +

          `📍 Kecamatan: ${kecamatan}\n\n` +

          `🎟️ Sisa kuota wilayah: ${
            user.locationQuota
          }\n\n` +

          (

            user.locationQuota > 0

              ? "Anda masih bisa memilih 1 wilayah lagi."

              : "Kuota wilayah sudah habis. Untuk memilih wilayah berikutnya, silakan TOP UP lagi."

          ),

          {

            reply_markup:
              mainKeyboard(chatId)

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
            "⚠️ Perintah tidak dikenali."

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
// CALLBACK QUERY SELESAI
// ======================================================


// ======================================================
// FOTO BUKTI PEMBAYARAN SUBSCRIPTION
// ======================================================

bot.on(
  "photo",
  async message => {

    try {

      const chatId =
        message.chat.id;


      // ==================================================
      // AMBIL USER
      // ==================================================

      const user =
        getUser(chatId);


      // ==================================================
      // CEK APAKAH USER MENUNGGU BUKTI
      // ==================================================

      if (
        !user.waitingPaymentProof
      ) {

        return;

      }


      // ==================================================
      // CEK PERMINTAAN SUBSCRIPTION
      // ==================================================

      if (
        !user.subscriptionRequest
      ) {

        user.waitingPaymentProof =
          false;


        saveDatabase();


        await bot.sendMessage(

          chatId,

          "❌ Tidak ada permintaan subscription yang sedang diproses.",

          {

            reply_markup:
              mainKeyboard(chatId)

          }

        );


        return;

      }


      // ==================================================
      // AMBIL FOTO TERBESAR
      // ==================================================

      if (
        !message.photo ||
        message.photo.length === 0
      ) {

        await bot.sendMessage(

          chatId,

          "❌ Foto bukti pembayaran tidak ditemukan."

        );

        return;

      }


      const photo =

        message.photo[
          message.photo.length - 1
        ];


      const photoId =
        photo.file_id;


      // ==================================================
      // SIMPAN BUKTI
      // ==================================================

      user.paymentProof =
        photoId;


      user.waitingPaymentProof =
        false;


      saveDatabase();


      // ==================================================
      // BALAS KE USER
      // ==================================================

      await bot.sendMessage(

        chatId,

        "✅ BUKTI PEMBAYARAN DITERIMA\n\n" +

        "📸 Bukti transfer sudah diterima.\n\n" +

        "⏳ Sekarang menunggu pemeriksaan dan persetujuan admin.",

        {

          reply_markup:
            mainKeyboard(chatId)

        }

      );


      // ==================================================
      // CEK ADMIN
      // ==================================================

      if (
        !ADMIN_ID
      ) {

        console.error(
          "❌ ADMIN_ID belum diatur di .env"
        );

        return;

      }


      // ==================================================
      // DATA PEMBAYARAN
      // ==================================================

      const request =
        user.subscriptionRequest;


      const harga =
        Number(
          request.price || 0
        );


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

            `💰 Harga: Rp ${
              harga.toLocaleString(
                "id-ID"
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

        `💳 Bukti pembayaran dari ${chatId} dikirim ke admin.`

      );


    } catch (error) {

      console.error(

        "❌ ERROR FOTO PEMBAYARAN:",

        error

      );


      try {

        await bot.sendMessage(

          message.chat.id,

          "❌ Terjadi kesalahan saat menerima bukti pembayaran."

        );

      } catch (_) {}

    }

  }

);


// ======================================================
// GREEN API WEBHOOK
// ======================================================

async function handleWhatsAppWebhook(
  body
) {

  try {

    console.log(
      "📲 WEBHOOK WHATSAPP MASUK"
    );


    console.log(

      JSON.stringify(
        body,
        null,
        2
      )

    );


    // ==================================================
    // CEK BODY
    // ==================================================

    if (
      !body
    ) {

      return;

    }


    // ==================================================
    // CEK TIPE WEBHOOK
    // ==================================================

    if (

      body.typeWebhook !==
      "incomingMessageReceived"

    ) {

      return;

    }


    // ==================================================
    // DATA PESAN
    // ==================================================

    const messageData =
      body.messageData || {};


    const senderData =
      messageData.senderData || {};


    // ==================================================
    // CHAT ID WHATSAPP
    // ==================================================

    const whatsappChatId =
      senderData.chatId || "";


    // ==================================================
    // HANYA GRUP WHATSAPP
    // ==================================================

    if (

      !whatsappChatId.endsWith(
        "@g.us"
      )

    ) {

      console.log(
        "ℹ️ Pesan bukan dari grup WhatsApp."
      );

      return;

    }


    // ==================================================
    // AMBIL PESAN
    // ==================================================

    let messageText =
      "";


    // ==================================================
    // PESAN TEXT
    // ==================================================

    if (

      messageData.typeMessage ===
      "textMessage"

    ) {

      messageText =

        messageData
          .textMessageData
          ?.textMessage || "";

    }


    // ==================================================
    // PESAN EXTENDED TEXT
    // ==================================================

    if (

      messageData.typeMessage ===
      "extendedTextMessage"

    ) {

      messageText =

        messageData
          .extendedTextMessageData
          ?.text || "";

    }


    // ==================================================
    // JIKA TIDAK ADA TEXT
    // ==================================================

    if (
      !messageText
    ) {

      console.log(
        "ℹ️ Pesan WhatsApp tidak memiliki teks."
      );

      return;

    }


    // ==================================================
    // DATA GRUP
    // ==================================================

    const groupName =

      senderData.chatName ||
      "WhatsApp Group";


    const senderName =

      senderData.senderName ||
      "Tidak diketahui";


    // ==================================================
    // LOG
    // ==================================================

    console.log(
      `📲 GRUP: ${groupName}`
    );


    console.log(
      `👤 PENGIRIM: ${senderName}`
    );


    console.log(
      `💬 PESAN: ${messageText}`
    );


    // ==================================================
    // CARI USER YANG MEMILIKI WILAYAH
    // ==================================================

    const userIds =

      Object.keys(
        database.locations || {}
      );


    // ==================================================
    // LOOP USER
    // ==================================================

    for (
      const telegramId of userIds
    ) {

      const locations =

        database.locations[
          telegramId
        ];


      // ==================================================
      // USER TIDAK PUNYA WILAYAH
      // ==================================================

      if (

        !Array.isArray(
          locations
        ) ||

        locations.length === 0

      ) {

        continue;

      }


      // ==================================================
      // CEK SUBSCRIPTION
      // ==================================================

      const user =
        getUser(telegramId);


      if (

        !subscription.hasActiveSubscription(
          user
        )

      ) {

        continue;

      }


      // ==================================================
      // UNTUK SEKARANG PESAN DITERUSKAN
      // KE USER YANG MEMILIKI WILAYAH
      // ==================================================

      const text =

        "📩 PESAN WHATSAPP BARU\n\n" +

        `👥 Grup: ${groupName}\n` +

        `👤 Pengirim: ${senderName}\n\n` +

        `💬 Pesan:\n${messageText}`;


      try {

        await bot.sendMessage(

          telegramId,

          text

        );


        console.log(

          `✅ Pesan dikirim ke Telegram ${telegramId}`

        );


      } catch (error) {

        console.error(

          `❌ Gagal mengirim ke ${telegramId}:`,

          error.message

        );

      }

    }


  } catch (error) {

    console.error(

      "❌ ERROR GREEN API:",

      error

    );

  }

}


// ======================================================
// HTTP SERVER
// ======================================================

const server =

  http.createServer(

    async (req, res) => {

      try {


        // ==============================================
        // HEALTH CHECK
        // ==============================================

        if (

          req.method === "GET" &&

          req.url === "/"

        ) {

          res.writeHead(

            200,

            {

              "Content-Type":
                "text/plain; charset=utf-8"

            }

          );


          res.end(
            "🤖 Bot Telegram + Green API aktif"
          );


          return;

        }


        // ==============================================
        // HEALTH
        // ==============================================

        if (

          req.method === "GET" &&

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

              status:
                "ok",

              telegram:
                "active",

              greenApi:
                "ready"

            })

          );


          return;

        }


        // ==============================================
        // GREEN API WEBHOOK
        // ==============================================

        if (

          req.method === "POST" &&

          req.url === "/webhook"

        ) {


          let rawBody =
            "";


          // ==========================================
          // TERIMA DATA
          // ==========================================

          req.on(

            "data",

            chunk => {

              rawBody +=
                chunk.toString();

            }

          );


          // ==========================================
          // SELESAI
          // ==========================================

          req.on(

            "end",

            async () => {

              try {

                const body =

                  rawBody

                    ? JSON.parse(
                        rawBody
                      )

                    : {};


                await handleWhatsAppWebhook(
                  body
                );


                if (
                  !res.headersSent
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

                      success:
                        true

                    })

                  );

                }


              } catch (error) {

                console.error(

                  "❌ WEBHOOK PARSE ERROR:",

                  error

                );


                if (
                  !res.headersSent
                ) {

                  res.writeHead(

                    400,

                    {

                      "Content-Type":
                        "application/json"

                    }

                  );


                  res.end(

                    JSON.stringify({

                      success:
                        false,

                      error:
                        "Invalid webhook payload"

                    })

                  );

                }

              }

            }

          );


          return;

        }


        // ==============================================
        // 404
        // ==============================================

        res.writeHead(

          404,

          {

            "Content-Type":
              "text/plain; charset=utf-8"

          }

        );


        res.end(
          "404 Not Found"
        );


      } catch (error) {

        console.error(

          "❌ HTTP SERVER ERROR:",

          error

        );


        if (
          !res.headersSent
        ) {

          res.writeHead(

            500,

            {

              "Content-Type":
                "text/plain; charset=utf-8"

            }

          );


          res.end(
            "Internal Server Error"
          );

        }

      }

    }

  );


// ======================================================
// JALANKAN SERVER
// ======================================================

server.listen(

  PORT,

  () => {

    console.log(
      "======================================"
    );


    console.log(
      `🌐 HTTP SERVER: PORT ${PORT}`
    );


    console.log(
      "🌐 HEALTH: /health"
    );


    console.log(
      "🌐 WEBHOOK: /webhook"
    );


    console.log(
      "📲 GREEN API: ENABLED"
    );


    console.log(
      "🎟️ KUOTA: 2 WILAYAH / TOP UP"
    );


    console.log(
      "======================================"
    );

  }

);


// ======================================================
// ERROR TELEGRAM
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
// ERROR UMUM BOT
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
// BOT SELESAI
// ======================================================

console.log(
  "======================================"
);


console.log(
  "🤖 BOT TELEGRAM + GREEN API SIAP"
);


console.log(
  "🎟️ 1 TOP UP = 2 KUOTA WILAYAH"
);


console.log(
  "======================================"
);
