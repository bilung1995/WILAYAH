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

      locationQuota: 0

    };


    saveDatabase();

  }


  return database.users[id];

}


// ======================================================
// USER LOCATIONS
// ======================================================

function getUserLocations(chatId) {

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
// SIMPAN WILAYAH USER
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
  // CEK DUPLIKAT
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


  if (
    exists
  ) {

    return false;

  }


  // ==================================================
  // SIMPAN WILAYAH
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
// SHOW PROFILE
// ======================================================

async function showProfile(chatId) {

  const user =
    getUser(chatId);

  const locations =
    getUserLocations(chatId);


  let subscriptionInfo =
    "🔴 Subscription tidak aktif.";


  if (

    subscription.hasActiveSubscription(
      user
    )

  ) {

    subscriptionInfo =

      subscription.getSubscriptionInfo(
        user
      );

  }


  await bot.sendMessage(

    chatId,

    "👤 PROFIL ANDA\n\n" +

    `🆔 ID: ${chatId}\n` +

    `👤 Nama: ${
      user.firstName || "-"
    }\n` +

    `🔗 Username: ${
      user.username
        ? "@" + user.username
        : "-"
    }\n\n` +

    subscriptionInfo +

    "\n\n" +

    `🎟️ Kuota wilayah: ${
      Number(
        user.locationQuota || 0
      )
    }\n` +

    `📍 Jumlah wilayah: ${
      locations.length
    }`,

    {

      reply_markup:
        mainKeyboard(chatId)

    }

  );

}


// ======================================================
// SHOW LOCATIONS
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

      "Silakan tekan 🏙️ TAMBAH KOTA.",

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

    (item, index) => {

      text +=

        `${index + 1}. ${item.kecamatan}\n` +

        `   ${item.kabupaten}, ${item.provinsi}\n\n`;

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
// SHOW STATUS
// ======================================================

async function showStatus(chatId) {

  const user =
    getUser(chatId);


  let subscriptionInfo =
    "🔴 Subscription tidak aktif.";


  if (

    subscription.hasActiveSubscription(
      user
    )

  ) {

    subscriptionInfo =

      subscription.getSubscriptionInfo(
        user
      );

  }


  await bot.sendMessage(

    chatId,

    "📊 STATUS AKUN\n\n" +

    subscriptionInfo +

    "\n\n" +

    `🎟️ Kuota wilayah: ${
      Number(
        user.locationQuota || 0
      )
    }\n` +

    `📍 Wilayah dipilih: ${
      getUserLocations(chatId).length
    }`,

    {

      reply_markup:
        mainKeyboard(chatId)

    }

  );

}


// ======================================================
// SHOW HELP
// ======================================================

async function showHelp(chatId) {

  await bot.sendMessage(

    chatId,

    "❓ BANTUAN\n\n" +

    "👤 PROFIL\n" +
    "Melihat informasi akun dan subscription.\n\n" +

    "📍 KOTA YANG DIPILIH\n" +
    "Melihat wilayah yang sudah dipilih.\n\n" +

    "🏙️ TAMBAH KOTA\n" +
    "Memilih wilayah berdasarkan Provinsi → Kabupaten/Kota → Kecamatan.\n\n" +

    "💳 TOP UP\n" +
    "Membeli tambahan kuota wilayah.\n\n" +

    "📊 STATUS\n" +
    "Melihat status subscription dan kuota.\n\n" +

    "👨‍💼 HUBUNGI ADMIN\n" +
    "Menghubungi admin.",

    {

      reply_markup:
        mainKeyboard(chatId)

    }

  );

}


// ======================================================
// HUBUNGI ADMIN
// ======================================================

async function contactAdmin(chatId) {

  await bot.sendMessage(

    chatId,

    "👨‍💼 HUBUNGI ADMIN\n\n" +

    "Silakan hubungi admin untuk bantuan.",

    {

      reply_markup:
        mainKeyboard(chatId)

    }

  );

}


// ======================================================
// SHOW BLACKLIST
// ======================================================

async function showBlacklist(chatId) {

  const list =
    blacklist.getBlacklist();


  if (
    !list ||
    list.length === 0
  ) {

    await bot.sendMessage(

      chatId,

      "🚫 NOMOR BLACKLIST\n\n" +

      "Belum ada nomor yang masuk blacklist.",

      {

        reply_markup:
          mainKeyboard(chatId)

      }

    );

    return;

  }


  await bot.sendMessage(

    chatId,

    "🚫 NOMOR BLACKLIST\n\n" +

    list.join("\n"),

    {

      reply_markup:
        mainKeyboard(chatId)

    }

  );

           }


// ======================================================
// PESAN / START
// ======================================================

bot.on(
  "message",
  async message => {

    try {

      const chatId =
        message.chat.id;


      // ==================================================
      // SIMPAN DATA USER
      // ==================================================

      const user =
        getUser(chatId);


      user.firstName =
        message.from?.first_name || "";


      user.username =
        message.from?.username || "";


      saveDatabase();


      // ==================================================
      // FOTO / DOKUMEN DITANGANI DI HANDLER KHUSUS
      // ==================================================

      if (
        message.photo ||
        message.document
      ) {

        return;

      }


      // ==================================================
      // CALLBACK DIABAIKAN
      // ==================================================

      if (
        message.from?.is_bot
      ) {

        return;

      }


      const text =
        message.text || "";


      // ==================================================
      // START
      // ==================================================

      if (
        text === "/start"
      ) {

        await bot.sendMessage(

          chatId,

          "🤖 SELAMAT DATANG!\n\n" +

          "Bot siap digunakan.\n\n" +

          "Silakan pilih menu di bawah.",

          {

            reply_markup:
              mainKeyboard(chatId)

          }

        );


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
        text === "📍 KOTA YANG DIPILIH"
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
        text === "👨‍💼 HUBUNGI ADMIN"
      ) {

        await contactAdmin(
          chatId
        );

        return;

      }


      // ==================================================
      // BLACKLIST
      // ==================================================

      if (
        text === "🚫 NOMOR BLACKLIST"
      ) {

        if (
          !isAdmin(chatId)
        ) {

          await bot.sendMessage(

            chatId,

            "⛔ Menu ini khusus admin.",

            {

              reply_markup:
                mainKeyboard(chatId)

            }

          );

          return;

        }


        await showBlacklist(
          chatId
        );

        return;

      }


      // ==================================================
      // TAMBAH KOTA
      // ==================================================

      if (
        text === "🏙️ TAMBAH KOTA"
      ) {

        // ================================================
        // CEK SUBSCRIPTION
        // ================================================

        if (

          !subscription.hasActiveSubscription(
            user
          )

        ) {

          await bot.sendMessage(

            chatId,

            "⚠️ SUBSCRIPTION BELUM AKTIF\n\n" +

            "Silakan aktifkan subscription terlebih dahulu.",

            {

              reply_markup:
                mainKeyboard(chatId)

            }

          );

          return;

        }


        // ================================================
        // CEK KUOTA WILAYAH
        // ================================================

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

            "💳 Silakan TOP UP terlebih dahulu untuk mendapatkan kuota wilayah lagi.",

            {

              reply_markup:
                mainKeyboard(chatId)

            }

          );

          return;

        }


        // ================================================
        // TAMPILKAN PROVINSI
        // ================================================

        await wilayah.showProvinsi(

          bot,

          chatId

        );


        return;

      }


      // ==================================================
      // TOP UP
      // ==================================================

      if (
        text === "💳 TOP UP"
      ) {

        await topup.showTopupMenu(

          bot,

          chatId

        );


        return;

      }


      // ==================================================
      // PANEL ADMIN
      // ==================================================

      if (
        text === "🛠️ PANEL ADMIN"
      ) {

        if (
          !isAdmin(chatId)
        ) {

          await bot.sendMessage(

            chatId,

            "⛔ Anda bukan admin.",

            {

              reply_markup:
                mainKeyboard(chatId)

            }

          );

          return;

        }


        await showAdminPanel(
          chatId
        );


        return;

      }

    } catch (error) {

      console.error(

        "❌ ERROR MESSAGE:",

        error

      );

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
      // ADMIN REFRESH
      // ==================================================

      if (
        data === "ADMIN_REFRESH"
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
          query.id
        );


        await showAdminPanel(
          chatId
        );


        return;

      }


      // ==================================================
      // APPROVE / REJECT
      // ==================================================

      if (

        data.startsWith("APPROVE_") ||

        data.startsWith("REJECT_")

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


        const userId =

          data
            .replace("APPROVE_", "")
            .replace("REJECT_", "");


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
          data.startsWith("APPROVE_")
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


          const packageId =

            user
              .subscriptionRequest
              .packageId;


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
          // 1 SUBSCRIPTION = 1 KUOTA WILAYAH
          // ==================================================

          user.locationQuota = 1;


          // ==================================================
          // RESET PEMBAYARAN
          // ==================================================

          user.waitingPaymentProof =
            false;

          user.paymentProof =
            null;

          user.subscriptionRequest =
            null;


          saveDatabase();


          await bot.answerCallbackQuery(

            query.id,

            {
              text:
                "✅ Subscription berhasil diaktifkan."
            }

          );


          await bot.sendMessage(

            userId,

            "🎉 PEMBAYARAN DITERIMA!\n\n" +

            "✅ Subscription Anda sudah aktif.\n\n" +

            subscription.getSubscriptionInfo(
              user
            ) +

            "\n\n" +

            "🎟️ Kuota wilayah: 1\n\n" +

            "Silakan pilih 🏙️ TAMBAH KOTA.",

            {

              reply_markup:
                mainKeyboard(userId)

            }

          );


          await bot.sendMessage(

            chatId,

            "✅ SUBSCRIPTION BERHASIL DIAKTIFKAN\n\n" +

            `👤 User ID: ${userId}\n` +

            "🎟️ Kuota wilayah: 1"

          );


          return;

        }


        // ==================================================
        // REJECT
        // ==================================================

        if (
          data.startsWith("REJECT_")
        ) {

          user.subscriptionRequest =
            null;

          user.waitingPaymentProof =
            false;

          user.paymentProof =
            null;


          saveDatabase();


          await bot.answerCallbackQuery(

            query.id,

            {
              text:
                "❌ Pembayaran ditolak."
            }

          );


          await bot.sendMessage(

            userId,

            "❌ PEMBAYARAN DITOLAK\n\n" +

            "Bukti pembayaran Anda ditolak oleh admin.",

            {

              reply_markup:
                mainKeyboard(userId)

            }

          );


          return;

        }

      }


      // ==================================================
      // SUBSCRIBE
      // ==================================================

      if (
        data.startsWith("SUBSCRIBE_")
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
          packageId === "TRIAL"
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


          // ==================================================
          // TRIAL = 1 KUOTA
          // ==================================================

          user.locationQuota = 1;


          saveDatabase();


          await bot.answerCallbackQuery(
            query.id
          );


          await bot.sendMessage(

            chatId,

            "🎉 TRIAL BERHASIL DIAKTIFKAN!\n\n" +

            subscription.getSubscriptionInfo(
              user
            ) +

            "\n\n" +

            "🎟️ Kuota wilayah: 1\n\n" +

            "Silakan pilih 🏙️ TAMBAH KOTA.",

            {

              reply_markup:
                mainKeyboard(chatId)

            }

          );


          return;

        }


        // ==================================================
        // BUAT PERMINTAAN SUBSCRIPTION
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
            formatRupiah(
              result.package.price
            )
          }\n` +

          `⏳ Masa aktif: ${
            result.package.durationDays
          } hari\n\n` +

          "Silakan lakukan pembayaran.\n\n" +

          "Setelah pembayaran selesai, " +

          "kirim FOTO bukti transfer di chat ini.",

          {

            reply_markup:
              mainKeyboard(chatId)

          }

        );


        return;

      }

    } catch (error) {

      console.error(
        "❌ ERROR CALLBACK:",
        error
      );

    }

  }
);




// ======================================================
// PILIH PROVINSI
// ======================================================

if (
  data.startsWith("prov_")
) {

  const provData =

    data.replace(
      "prov_",
      ""
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


// ======================================================
// PILIH KABUPATEN / KOTA
// ======================================================

if (
  data.startsWith("kab_")
) {

  const kabData =

    data.replace(
      "kab_",
      ""
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


// ======================================================
// PILIH KECAMATAN
// ======================================================

if (
  data.startsWith("kec_")
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


  // ==================================================
  // CEK USER
  // ==================================================

  const user =
    getUser(chatId);


  // ==================================================
  // CEK KUOTA
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
          "⚠️ Kuota wilayah habis. Silakan TOP UP.",
        show_alert: true

      }

    );


    await bot.sendMessage(

      chatId,

      "⚠️ KUOTA WILAYAH HABIS\n\n" +

      "Anda sudah menggunakan seluruh kuota wilayah.\n\n" +

      "💳 Silakan TOP UP terlebih dahulu untuk mendapatkan kuota wilayah lagi.",

      {

        reply_markup:
          mainKeyboard(chatId)

      }

    );


    return;

  }


  // ==================================================
  // CEK DATA WILAYAH
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
  // CEK DUPLIKAT
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
          "ℹ️ Wilayah ini sudah dipilih.",
        show_alert: true

      }

    );


    await bot.sendMessage(

      chatId,

      "ℹ️ WILAYAH SUDAH DIPILIH\n\n" +

      `🇮🇩 Provinsi: ${provinsi}\n` +

      `🏙️ Kabupaten/Kota: ${kabupaten}\n` +

      `📍 Kecamatan: ${kecamatan}\n\n` +

      `🎟️ Sisa kuota wilayah: ${currentQuota}`,

      {

        reply_markup:
          mainKeyboard(chatId)

      }

    );


    return;

  }


  // ==================================================
  // SIMPAN WILAYAH
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


// ==================================================
// BERHASIL
// ==================================================

await bot.answerCallbackQuery(
  query.id,
  {
    text:
      "✅ Wilayah berhasil dipilih."
  }
);


await bot.sendMessage(

  chatId,

  "✅ WILAYAH BERHASIL DIPILIH\n\n" +

  `🇮🇩 Provinsi: ${provinsi}\n` +

  `🏙️ Kabupaten/Kota: ${kabupaten}\n` +

  `📍 Kecamatan: ${kecamatan}\n\n` +

  `🎟️ Sisa kuota wilayah: ${
    user.locationQuota
  }`,

  {

    reply_markup:
      mainKeyboard(chatId)

  }

);


// ==================================================
// SELESAI CALLBACK KECAMATAN
// ==================================================

return;

  } catch (error) {

    console.error(
      "❌ ERROR CALLBACK:",
      error
    );

  }

});


// ======================================================
// FOTO BUKTI PEMBAYARAN
// ======================================================

bot.on(
  "photo",
  async message => {

    try {

      const chatId =
        message.chat.id;

      const user =
        getUser(chatId);


      // ==================================================
      // CEK USER MENUNGGU BUKTI PEMBAYARAN
      // ==================================================

      if (
        !user.waitingPaymentProof
      ) {

        return;

      }


      // ==================================================
      // CEK REQUEST SUBSCRIPTION
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

      const photo =
        message.photo[
          message.photo.length - 1
        ];


      const fileId =
        photo.file_id;


      // ==================================================
      // SIMPAN BUKTI PEMBAYARAN
      // ==================================================

      user.paymentProof =
        fileId;

      user.waitingPaymentProof =
        false;


      saveDatabase();


      // ==================================================
      // KIRIM KONFIRMASI KE USER
      // ==================================================

      await bot.sendMessage(

        chatId,

        "✅ BUKTI PEMBAYARAN DITERIMA\n\n" +

        "Bukti pembayaran sudah dikirim ke admin.\n\n" +

        "⏳ Silakan tunggu proses pemeriksaan admin.",

        {

          reply_markup:
            mainKeyboard(chatId)

        }

      );


      // ==================================================
      // KIRIM BUKTI KE ADMIN
      // ==================================================

      if (
        !ADMIN_ID
      ) {

        console.error(
          "❌ ADMIN_ID belum diatur."
        );

        return;

      }


      const request =
        user.subscriptionRequest;


      await bot.sendPhoto(

        ADMIN_ID,

        fileId,

        {

          caption:

            "🔔 BUKTI PEMBAYARAN SUBSCRIPTION\n\n" +

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
              request.packageName || "-"
            }\n` +

            `💰 Harga: ${
              formatRupiah(
                request.price || 0
              )
            }\n` +

            `⏳ Durasi: ${
              request.durationDays || 0
            } hari\n\n` +

            "Silakan periksa bukti pembayaran.",


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

        `💳 Bukti pembayaran ${chatId} dikirim ke admin.`

      );


    } catch (error) {

      console.error(

        "❌ ERROR FOTO PEMBAYARAN:",

        error

      );

    }

  }
);


// ======================================================
// GREEN API WEBHOOK
// ======================================================

async function handleWhatsAppWebhook(body) {

  try {

    console.log(
      "📲 WEBHOOK WHATSAPP MASUK"
    );


    if (!body) {
      return;
    }


    // ==================================================
    // HANYA PESAN MASUK
    // ==================================================

    if (
      body.typeWebhook !==
      "incomingMessageReceived"
    ) {

      return;

    }


    const messageData =
      body.messageData || {};

    const senderData =
      body.senderData || {};


    // ==================================================
    // CHAT ID WHATSAPP
    // ==================================================

    const whatsappChatId =
      senderData.chatId || "";


    // ==================================================
    // HANYA GRUP
    // ==================================================

    if (
      !whatsappChatId.endsWith("@g.us")
    ) {

      return;

    }


    // ==================================================
    // AMBIL PESAN TEXT
    // ==================================================

    let messageText = "";


    if (
      messageData.typeMessage ===
      "textMessage"
    ) {

      messageText =

        messageData
          .textMessageData
          ?.textMessage || "";

    }


    if (
      messageData.typeMessage ===
      "extendedTextMessage"
    ) {

      messageText =

        messageData
          .extendedTextMessageData
          ?.text || "";

    }


    if (
      !messageText
    ) {

      return;

    }


    // ==================================================
    // DATA PENGIRIM
    // ==================================================

    const groupName =
      senderData.chatName ||
      "WhatsApp Group";

    const senderName =
      senderData.senderName ||
      "Tidak diketahui";


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


    for (
      const telegramId of userIds
    ) {

      const locations =

        database.locations[
          telegramId
        ];


      if (
        !Array.isArray(locations) ||
        locations.length === 0
      ) {

        continue;

      }


      const user =
        getUser(telegramId);


      // ==================================================
      // HANYA USER SUBSCRIPTION AKTIF
      // ==================================================

      if (

        !subscription.hasActiveSubscription(
          user
        )

      ) {

        continue;

      }


      // ==================================================
      // KIRIM PESAN KE TELEGRAM
      // ==================================================

      try {

        await bot.sendMessage(

          telegramId,

          "📩 PESAN WHATSAPP BARU\n\n" +

          `👥 Grup: ${groupName}\n` +

          `👤 Pengirim: ${senderName}\n\n` +

          `💬 Pesan:\n${messageText}`

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

const server = http.createServer(
  async (req, res) => {

    try {

      // ==================================================
      // HEALTH CHECK
      // ==================================================

      if (
        req.method === "GET" &&
        req.url === "/"
      ) {

        res.writeHead(
          200,
          {
            "Content-Type":
              "text/plain"
          }
        );

        res.end(
          "🤖 Telegram Bot is running"
        );

        return;

      }


      // ==================================================
      // WEBHOOK GREEN API
      // ==================================================

      if (
        req.method === "POST" &&
        req.url === "/webhook"
      ) {

        let body = "";


        req.on(
          "data",
          chunk => {

            body +=
              chunk.toString();

          }
        );


        req.on(
          "end",
          async () => {

            try {

              const data =
                JSON.parse(body);


              await handleWhatsAppWebhook(
                data
              );


            } catch (error) {

              console.error(

                "❌ ERROR WEBHOOK:",

                error

              );

            }


            res.writeHead(
              200,
              {
                "Content-Type":
                  "application/json"
              }
            );


            res.end(

              JSON.stringify({
                success: true
              })

            );

          }
        );


        return;

      }


      // ==================================================
      // 404
      // ==================================================

      res.writeHead(
        404,
        {
          "Content-Type":
            "text/plain"
        }
      );


      res.end(
        "Not Found"
      );


    } catch (error) {

      console.error(
        "❌ HTTP SERVER ERROR:",
        error
      );


      res.writeHead(
        500,
        {
          "Content-Type":
            "text/plain"
        }
      );


      res.end(
        "Internal Server Error"
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
      "======================================"
    );

    console.log(
      `🌐 HTTP SERVER PORT: ${PORT}`
    );

    console.log(
      "📡 WEBHOOK: /webhook"
    );

    console.log(
      "❤️ HEALTH: /"
    );

    console.log(
      "🤖 BOT SIAP DIGUNAKAN"
    );

    console.log(
      "======================================"
    );

  }
);


// ======================================================
// ERROR SERVER
// ======================================================

server.on(
  "error",
  error => {

    console.error(
      "❌ SERVER ERROR:",
      error
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
// SELESAI
// ======================================================

console.log(
  "🤖 BOT TELEGRAM + GREEN API SIAP"
);
