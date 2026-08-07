require("dotenv").config();

const http = require("http");
const fs = require("fs");
const path = require("path");
const TelegramBot = require("node-telegram-bot-api");
const wilayah = require("./wilayah");



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
  console.error("❌ TELEGRAM_TOKEN / BOT_TOKEN belum diisi.");
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

function loadDatabase() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      const database = createDefaultDatabase();

      fs.writeFileSync(
        DATA_FILE,
        JSON.stringify(database, null, 2)
      );

      return database;
    }

    const raw = fs.readFileSync(
      DATA_FILE,
      "utf8"
    );

    const database = JSON.parse(raw);

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

let database = loadDatabase();

function saveDatabase() {
  try {
    fs.writeFileSync(
      DATA_FILE,
      JSON.stringify(database, null, 2)
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

const bot = new TelegramBot(
  TELEGRAM_TOKEN,
  {
    polling: true
  }
);

console.log("======================================");
console.log("🤖 BOT TELEGRAM STARTING");
console.log("======================================");

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

function saveUserLocation(chatId, location) {
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

  database.locations[id].push(location);

  saveDatabase();

  return true;
}

// ======================================================
// CEK ADMIN
// ======================================================

function isAdmin(chatId) {
  return (
    ADMIN_ID &&
    String(chatId) === String(ADMIN_ID)
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

  // Menu admin hanya muncul
  // untuk akun admin.

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
// KIRIM MENU
// ======================================================

async function sendMainMenu(
  chatId,
  text = "Silakan pilih menu di bawah."
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
// PROFIL
// ======================================================

async function showProfile(chatId) {

  const user =
    getUser(chatId);

  const locations =
    getUserLocations(chatId);

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

  if (locations.length === 0) {

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

  await bot.sendMessage(

    chatId,

    "📊 STATUS BOT\n\n" +

    "🟢 Telegram: AKTIF\n" +

    "🟢 Database: AKTIF\n" +

    "🟢 Server: AKTIF\n\n" +

    `📍 Wilayah: ${
      getUserLocations(chatId).length
    }\n\n` +

    "ℹ️ Status subscription akan "
    + "ditampilkan setelah modul subscription "
    + "dipasang.",

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
    "Untuk memilih provinsi, kabupaten/kota, "
    + "dan kecamatan.\n\n" +

    "📍 KOTA YANG DIPILIH\n" +
    "Untuk melihat wilayah yang sudah tersimpan.\n\n" +

    "👤 PROFIL\n" +
    "Untuk melihat informasi akun.\n\n" +

    "📊 STATUS\n" +
    "Untuk melihat status bot.\n\n" +

    "💳 TOP UP\n" +
    "Untuk proses pengisian saldo.\n\n" +

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
              text: "📱 WhatsApp 1",
              url:
                "https://wa.me/6283160776091"
            }
          ],

          [
            {
              text: "📱 WhatsApp 2",
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
// MENU TELEGRAM
// ======================================================

bot.on(
  "message",
  async message => {

    try {

      if (!message.text) {
        return;
      }

      const text =
        message.text.trim();

      // Jangan proses command
      // seperti /start dan /id.

      if (text.startsWith("/")) {
        return;
      }

      const chatId =
        message.chat.id;

      getUser(chatId);

      // ==================================================
      // PROFIL
      // ==================================================

      if (text === "👤 PROFIL") {

        await showProfile(chatId);

        return;
      }

      // ==================================================
      // KOTA YANG DIPILIH
      // ==================================================

      if (
        text ===
        "📍 KOTA YANG DIPILIH"
      ) {

        await showLocations(chatId);

        return;
      }

      // ==================================================
      // STATUS
      // ==================================================

      if (text === "📊 STATUS") {

        await showStatus(chatId);

        return;
      }

      // ==================================================
      // BANTUAN
      // ==================================================

      if (text === "❓ BANTUAN") {

        await showHelp(chatId);

        return;
      }

      // ==================================================
      // HUBUNGI ADMIN
      // ==================================================

      if (
        text ===
        "👨‍💼 HUBUNGI ADMIN"
      ) {

        await showAdmin(chatId);

        return;
      }

      // ==================================================
      // TOP UP
      // ==================================================

      if (text === "💳 TOP UP") {

        await bot.sendMessage(

          chatId,

          "💳 TOP UP\n\n" +

          "Fitur top up akan dipasang "
          + "pada Bagian berikutnya.",

          {
            reply_markup:
              mainKeyboard(chatId)
          }

        );

        return;
      }

      // ==================================================
// TAMBAH KOTA
// ==================================================

if (
  text === "🏙️ TAMBAH KOTA"
) {

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
      "❌ Gagal membuka pemilihan wilayah.",
      {
        reply_markup:
          mainKeyboard(chatId)
      }
    );

  }

  return;
}

      
      // ==================================================
      // PANEL ADMIN
      // ==================================================

      if (
        text ===
        "🛠️ PANEL ADMIN"
      ) {

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
      // BLACKLIST
      // ==================================================

      if (
        text ===
        "🚫 NOMOR BLACKLIST"
      ) {

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

          "Modul blacklist akan "
          + "disambungkan pada bagian berikutnya.",

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

      // SENGAJA DIABAIKAN.
      //
      // Tidak ada pesan:
      // "⚠️ Menu tidak dikenali."
      //
      // Ini penting supaya pesan lain,
      // callback, atau alur modul tidak
      // mengganggu menu utama.

      return;

    } catch (error) {

      console.error(
        "❌ ERROR MENU TELEGRAM:",
        error
      );

      try {

        await sendMainMenu(

          message.chat.id,

          "❌ Terjadi kesalahan.\n\n" +
          "Silakan coba lagi."

        );

      } catch (sendError) {

        console.error(
          "❌ GAGAL KIRIM PESAN ERROR:",
          sendError.message
        );

      }

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

        // ==============================================
        // ROOT
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
              status: "ok",
              telegram: "active"
            })
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
  );

// ======================================================
// SERVER
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
      "======================================"
    );

    console.log(
      "🤖 BOT TELEGRAM SIAP DIGUNAKAN"
    );

  }
);
