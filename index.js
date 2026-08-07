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

if (!TELEGRAM_TOKEN) {
  console.error(
    "❌ TELEGRAM_TOKEN / BOT_TOKEN belum diisi."
  );

  process.exit(1);
}

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

      createdAt:
        new Date().toISOString()

    };

    saveDatabase();

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

  if (!exists) {

    database.locations[id].push(
      location
    );

    saveDatabase();

  }

  return !exists;

}

// ======================================================
// KEYBOARD
// ======================================================

function mainKeyboard() {

  return {

    keyboard: [

      [
        {
          text:
            "🏙️ TAMBAH KOTA"
        },
        {
          text:
            "📍 KOTA YANG DIPILIH"
        }
      ],

      [
        {
          text:
            "👤 PROFIL"
        },
        {
          text:
            "💳 TOP UP"
        }
      ],

      [
        {
          text:
            "📊 STATUS"
        },
        {
          text:
            "❓ BANTUAN"
        }
      ],

      [
        {
          text:
            "👨‍💼 HUBUNGI ADMIN"
        },
        {
          text:
            "🚫 NOMOR BLACKLIST"
        }
      ],

      [
        {
          text:
            "🛠️ PANEL ADMIN"
        }
      ]

    ],

    resize_keyboard: true

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
    }\n\n` +

    subscriptionText,

    {
      reply_markup:
        mainKeyboard()
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
          mainKeyboard()
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

  await bot.sendMessage(
    chatId,
    text,
    {
      reply_markup:
        mainKeyboard()
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
        mainKeyboard()
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

    "7️⃣ Untuk subscription, pilih paket lalu ikuti instruksi pembayaran.",

    {
      reply_markup:
        mainKeyboard()
    }

  );

}

// ======================================================
// ADMIN
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

async function showAdminPanel(chatId) {

  if (
    !ADMIN_ID ||
    String(chatId) !== String(ADMIN_ID)
  ) {

    await bot.sendMessage(
      chatId,
      "⛔ AKSES DITOLAK."
    );

    return;
  }

  const users =
    Object.keys(database.users).length;

  const locations =
    Object.values(
      database.locations
    ).reduce(
      (total, list) =>
        total +
        (Array.isArray(list)
          ? list.length
          : 0),
      0
    );

  const topups =
    Object.keys(
      database.topups || {}
    ).length;

  await bot.sendMessage(
    chatId,

    "🛠️ PANEL ADMIN\n\n" +

    `👥 Total User: ${users}\n` +

    `📍 Total Wilayah: ${locations}\n` +

    `💳 Total Top Up: ${topups}\n` +

    `🚫 Blacklist: ${
      blacklist.blacklistNumbers.length
    }`,

    {
      reply_markup:
        mainKeyboard()
    }
  );
}


// ======================================================
// BLACKLIST
// ======================================================

async function showBlacklist(chatId) {

  if (
    !ADMIN_ID ||
    String(chatId) !== String(ADMIN_ID)
  ) {

    await bot.sendMessage(
      chatId,
      "⛔ Menu blacklist hanya untuk admin."
    );

    return;
  }

  await bot.sendMessage(
    chatId,

    blacklist.getBlacklistList(),

    {
      reply_markup:
        mainKeyboard()
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

      const user =
        getUser(chatId);

      user.firstName =
        message.from?.first_name || "";

      user.username =
        message.from?.username || "";

      saveDatabase();

      await bot.sendMessage(

        chatId,

        "🎉 BOT BERHASIL AKTIF!\n\n" +

        "✅ Telegram terhubung\n" +

        "✅ Database siap\n" +

        "✅ Menu aktif\n\n" +

        `🆔 Chat ID: ${chatId}\n\n` +

        "Silakan pilih menu di bawah.",

        {
          reply_markup:
            mainKeyboard()
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
            mainKeyboard()
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

      // Abaikan pesan yang bukan teks
      if (!message.text) {
        return;
      }

      // Abaikan command seperti /start dan /id
      if (
        message.text.startsWith("/")
      ) {
        return;
      }

      const chatId =
        message.chat.id;

      const text =
        message.text.trim();

      // Pastikan user tersedia
      const user =
        getUser(chatId);


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
      // TOP UP
      // ==================================================

      if (
        text === "💳 TOP UP"
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
        text === "📊 STATUS"
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

          "🟢 Server: AKTIF\n\n" +

          statusSubscription,

          {
            reply_markup:
              mainKeyboard()
          }

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

        // Cek subscription
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


        // Jika subscription aktif,
        // tampilkan provinsi

        await wilayah.showProvinsi(
          bot,
          chatId
        );

        return;
      }

    } catch (error) {

      console.error(
        "❌ ERROR MENU UTAMA:",
        error
      );

      try {

        await bot.sendMessage(

          message.chat.id,

          "❌ Terjadi kesalahan.\n\n" +
          "Silakan coba lagi.",

          {
            reply_markup:
              mainKeyboard()
          }

        );

      } catch (sendError) {

        console.error(
          "❌ GAGAL KIRIM ERROR:",
          sendError.message
        );

      }

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

      if (!chatId || !data) {
        return;
      }

      console.log(
        "🔘 CALLBACK:",
        data,
        "USER:",
        chatId
      );


      // ==================================================
      // ADMIN APPROVE / REJECT SUBSCRIPTION
      // ==================================================

      if (
        data.startsWith("APPROVE_") ||
        data.startsWith("REJECT_")
      ) {

        if (
          !ADMIN_ID ||
          String(chatId) !==
            String(ADMIN_ID)
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


        if (!user) {

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


        // ================================================
        // APPROVE
        // ================================================

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
            user.subscriptionRequest
              .packageId;


          const result =
            subscription.activateSubscription(
              user,
              packageId
            );


          if (!result.success) {

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


          user.waitingPaymentProof =
            false;

          user.paymentProof =
            null;


          saveDatabase();


          await bot.answerCallbackQuery(
            query.id,
            {
              text:
                "✅ Subscription diaktifkan."
            }
          );


          await bot.sendMessage(

            userId,

            "🎉 PEMBAYARAN DITERIMA!\n\n" +

            "✅ Subscription Anda sudah aktif.\n\n" +

            subscription.getSubscriptionInfo(
              user
            ),

            {
              reply_markup:
                mainKeyboard()
            }

          );


          await bot.sendMessage(

            chatId,

            "✅ Subscription user berhasil diaktifkan.\n\n" +
            `👤 User ID: ${userId}\n` +
            `📦 Paket: ${
              result.subscription.packageName
            }`

          );


          return;
        }


        // ================================================
        // REJECT
        // ================================================

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

            "Bukti pembayaran Anda ditolak oleh admin.\n\n" +

            "Silakan hubungi admin jika ada masalah.",

            {
              reply_markup:
                mainKeyboard()
            }

          );


          await bot.sendMessage(
            chatId,
            "❌ Pembayaran user ditolak.\n\n" +
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


        // ----------------------------------------------
        // TRIAL
        // ----------------------------------------------

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

            "\n\nSekarang Anda sudah bisa memilih wilayah.",

            {
              reply_markup:
                mainKeyboard()
            }

          );


          return;
        }


        // ----------------------------------------------
        // PAKET BERBAYAR
        // ----------------------------------------------

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
              mainKeyboard()
          }

        );


        return;
      }


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


  console.log(
    "📍 KECAMATAN DIPILIH:",
    {
      kecId,
      provinsi,
      kabupaten,
      kecamatan
    }
  );


  if (!kecId) {

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

    "Wilayah sudah tersimpan di akun Anda.",

    {
      reply_markup:
        mainKeyboard()
    }

  );

  return;
}


// ======================================================
// FOTO BUKTI PEMBAYARAN SUBSCRIPTION
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
      // CEK APAKAH USER SEDANG MENUNGGU BUKTI
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
              mainKeyboard()
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
            mainKeyboard()
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
    // CEK TIPE WEBHOOK
    // ==================================================

    if (
      !body ||
      body.typeWebhook !==
        "incomingMessageReceived"
    ) {

      return;

    }


    const messageData =
      body.messageData || {};

    const senderData =
      messageData.senderData || {};

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

      return;

    }


    // ==================================================
    // AMBIL PESAN
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


    if (!messageText) {

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
    // CARI USER YANG MEMILIH WILAYAH
    // ==================================================

    const userIds =
      Object.keys(
        database.locations
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


      // =================================================
      // SEMENTARA:
      // KIRIM PESAN KE USER YANG PUNYA WILAYAH
      // =================================================

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
    async (
      req,
      res
    ) => {

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
            "🤖 Bot Telegram aktif"
          );

          return;


        
