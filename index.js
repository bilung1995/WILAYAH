require("dotenv").config();

const http = require("http");
const fs = require("fs");
const path = require("path");
const TelegramBot = require("node-telegram-bot-api");

// ======================================================
// ENV
// ======================================================

const TELEGRAM_TOKEN =
  process.env.TELEGRAM_TOKEN ||
  process.env.BOT_TOKEN;

const PORT =
  Number(process.env.PORT) || 8080;

const GREEN_API_URL =
  process.env.GREEN_API_URL ||
  "https://api.green-api.com";

const GREEN_API_INSTANCE_ID =
  process.env.GREEN_API_INSTANCE_ID ||
  process.env.GREEN_INSTANCE_ID;

const GREEN_API_TOKEN =
  process.env.GREEN_API_TOKEN ||
  process.env.GREEN_TOKEN;

const ADMIN_ID =
  String(
    process.env.ADMIN_ID ||
    process.env.TELEGRAM_CHAT_ID ||
    ""
  );

// ======================================================
// VALIDASI
// ======================================================

if (!TELEGRAM_TOKEN) {
  console.error(
    "❌ TELEGRAM_TOKEN belum diisi."
  );

  process.exit(1);
}

console.log(
  "======================================"
);

console.log(
  "🚀 BOT TELEGRAM + WHATSAPP STARTING"
);

console.log(
  "======================================"
);

// ======================================================
// DATABASE SEDERHANA
// ======================================================

const DATA_FILE = path.join(
  __dirname,
  "bot-data.json"
);

function defaultDatabase() {
  return {
    users: {},
    locations: {},
    blacklist: [],
    topups: {}
  };
}

function loadDatabase() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
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

    return {
      ...defaultDatabase(),
      ...JSON.parse(raw)
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

  if (!database.users[id]) {
    database.users[id] = {
      id,
      firstName: "",
      username: "",
      balance: 0,
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
  const id =
    String(chatId);

  if (!database.locations[id]) {
    database.locations[id] = [];
  }

  return database.locations[id];
}

function saveUserLocation(
  chatId,
  location
) {
  const id =
    String(chatId);

  if (!database.locations[id]) {
    database.locations[id] = [];
  }

  const exists =
    database.locations[id].some(
      item =>
        item.kecamatanCode ===
        location.kecamatanCode
    );

  if (!exists) {
    database.locations[id].push(
      location
    );
  }

  saveDatabase();
}

// ======================================================
// KEYBOARD UTAMA
// ======================================================

function mainKeyboard() {
  return {
    keyboard: [
      [
        {
          text: "🏙️ TAMBAH KOTA"
        },
        {
          text: "📍 KOTA YANG DIPILIH"
        }
      ],
      [
        {
          text: "👤 PROFIL"
        },
        {
          text: "💳 TOP UP"
        }
      ],
      [
        {
          text: "📊 STATUS"
        },
        {
          text: "❓ BANTUAN"
        }
      ],
      [
        {
          text: "👨‍💼 HUBUNGI ADMIN"
        },
        {
          text: "🚫 NOMOR BLACKLIST"
        }
      ],
      [
        {
          text: "🛠️ PANEL ADMIN"
        }
      ]
    ],
    resize_keyboard: true
  };
}

// ======================================================
// START
// ======================================================

bot.onText(
  /^\/start$/,
  async message => {
    const chatId =
      message.chat.id;

    const user =
      getUser(chatId);

    user.firstName =
      message.from?.first_name ||
      "";

    user.username =
      message.from?.username ||
      "";

    saveDatabase();

    await bot.sendMessage(
      chatId,
      "🎉 BOT BERHASIL AKTIF!\n\n" +
      "✅ Telegram terhubung\n" +
      "✅ Chat ID berhasil terdeteksi\n" +
      "✅ Siap menerima pesan WhatsApp\n\n" +
      `🆔 Chat ID Anda: ${chatId}\n\n` +
      "Silakan pilih menu di bawah.",
      {
        reply_markup:
          mainKeyboard()
      }
    );

    console.log(
      `✅ /start dari ${chatId}`
    );
  }
);

// ======================================================
// ID
// ======================================================

bot.onText(
  /^\/id$/,
  async message => {
    const chatId =
      message.chat.id;

    await bot.sendMessage(
      chatId,
      `🆔 Chat ID Anda:\n\n${chatId}`
    );
  }
);

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
    `💰 Saldo: Rp ${Number(
      user.balance || 0
    ).toLocaleString("id-ID")}\n` +
    `📍 Wilayah: ${
      locations.length
    }`,
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

  if (locations.length === 0) {
    await bot.sendMessage(
      chatId,
      "📍 KOTA YANG DIPILIH\n\n" +
      "Belum ada wilayah yang dipilih.",
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
        `${index + 1}. ` +
        `${location.provinsi}\n` +
        `   ${location.kabupaten}\n` +
        `   ${location.kecamatan}\n\n`;
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
  await bot.sendMessage(
    chatId,
    "💳 TOP UP\n\n" +
    "Silakan transfer ke salah satu rekening berikut:\n\n" +
    "🏦 SEABANK\n" +
    "901040978290\n" +
    "a.n. HAMBALI\n\n" +
    "💰 DANA\n" +
    "083824101264\n" +
    "a.n. HAMBALI\n\n" +
    "💚 GOPAY\n" +
    "083824101264\n" +
    "a.n. HAMBALI\n\n" +
    "Setelah transfer, hubungi admin untuk verifikasi.",
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
    "2️⃣ Pilih TAMBAH KOTA untuk menentukan wilayah.\n\n" +
    "3️⃣ Pilih provinsi.\n\n" +
    "4️⃣ Pilih kabupaten/kota.\n\n" +
    "5️⃣ Pilih kecamatan.\n\n" +
    "Setelah wilayah tersimpan, pesan dari grup WhatsApp yang sesuai wilayah akan diteruskan ke Telegram.",
    {
      reply_markup:
        mainKeyboard()
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
  if (
    !ADMIN_ID ||
    String(chatId) !==
      ADMIN_ID
  ) {
    await bot.sendMessage(
      chatId,
      "⛔ AKSES DITOLAK."
    );

    return;
  }

  const users =
    Object.keys(
      database.users
    ).length;

  const blacklist =
    database.blacklist.length;

  const topups =
    Object.keys(
      database.topups
    ).length;

  await bot.sendMessage(
    chatId,
    "🛠️ PANEL ADMIN\n\n" +
    `👥 User: ${users}\n` +
    `🚫 Blacklist: ${blacklist}\n` +
    `💳 Transaksi Top Up: ${topups}`,
    {
      reply_markup:
        mainKeyboard()
    }
  );
}

// ======================================================
// BLACKLIST
// ======================================================

async function showBlacklist(
  chatId
) {
  if (
    !ADMIN_ID ||
    String(chatId) !==
      ADMIN_ID
  ) {
    await bot.sendMessage(
      chatId,
      "⛔ Menu blacklist hanya untuk admin."
    );

    return;
  }

  if (
    database.blacklist.length ===
    0
  ) {
    await bot.sendMessage(
      chatId,
      "🚫 BLACKLIST\n\n" +
      "Belum ada nomor blacklist."
    );

    return;
  }

  let text =
    "🚫 NOMOR BLACKLIST\n\n";

  database.blacklist.forEach(
    (item, index) => {
      text +=
        `${index + 1}. ${item}\n`;
    }
  );

  await bot.sendMessage(
    chatId,
    text
  );
}

// ======================================================
// PESAN MENU
// ======================================================

bot.on(
  "message",
  async message => {
    try {
      if (
        !message.text ||
        message.text.startsWith("/")
      ) {
        return;
      }

      const chatId =
        message.chat.id;

      const text =
        message.text.trim();

      getUser(chatId);

      switch (text) {
        case "👤 PROFIL":
          await showProfile(
            chatId
          );
          break;

        case "📍 KOTA YANG DIPILIH":
          await showLocations(
            chatId
          );
          break;

        case "💳 TOP UP":
          await showTopup(
            chatId
          );
          break;

        case "❓ BANTUAN":
          await showHelp(
            chatId
          );
          break;

        case "👨‍💼 HUBUNGI ADMIN":
          await showAdmin(
            chatId
          );
          break;

        case "🛠️ PANEL ADMIN":
          await showAdminPanel(
            chatId
          );
          break;

        case "🚫 NOMOR BLACKLIST":
          await showBlacklist(
            chatId
          );
          break;

        case "📊 STATUS":
          await bot.sendMessage(
            chatId,
            "📊 STATUS\n\n" +
            "🟢 Telegram: AKTIF\n" +
            "🟢 Server: AKTIF\n" +
            "🟢 Sistem siap menerima pesan WhatsApp.",
            {
              reply_markup:
                mainKeyboard()
            }
          );
          break;

        case "🏙️ TAMBAH KOTA":
          await bot.sendMessage(
            chatId,
            "🏙️ TAMBAH KOTA\n\n" +
            "Modul pemilihan wilayah Indonesia siap digunakan.\n\n" +
            "Provinsi → Kabupaten/Kota → Kecamatan.",
            {
              reply_markup:
                mainKeyboard()
            }
          );
          break;

        default:
          break;
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
// GREEN API WEBHOOK
// ======================================================

async function handleWhatsAppWebhook(
  body
) {
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

  const chatId =
    senderData.chatId || "";

  // Hanya grup WhatsApp
  if (
    !chatId.endsWith("@g.us")
  ) {
    return;
  }

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

  // ====================================================
  // UNTUK SEMENTARA:
  // KIRIM KE USER YANG SUDAH MEMILIH WILAYAH
  //
  // PENCocokan kecamatan akan disambungkan
  // setelah struktur gps.js Anda diketahui.
  // ====================================================

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
      !locations ||
      locations.length === 0
    ) {
      continue;
    }

    // --------------------------------------------------
    // NOTIFIKASI
    // --------------------------------------------------

    const text =
      "📩 PESAN WHATSAPP BARU\n\n" +
      `👥 Grup: ${groupName}\n` +
      `👤 Pengirim: ${senderName}\n\n` +
      `💬 ${messageText}`;

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
        `❌ Gagal kirim Telegram ${telegramId}:`,
        error.response?.body ||
        error.message
      );
    }
  }
}

// ======================================================
// HTTP SERVER
// ======================================================

const server =
  http.createServer(
    async (
      request,
      response
    ) => {
      try {
        // ----------------------------------------------
        // HEALTH CHECK
        // ----------------------------------------------

        if (
          request.method === "GET" &&
          request.url === "/"
        ) {
          response.writeHead(
            200,
            {
              "Content-Type":
                "application/json"
            }
          );

          response.end(
            JSON.stringify({
              status: "OK",
              telegram: "ACTIVE",
              whatsapp: "WEBHOOK READY",
              time:
                new Date().toISOString()
            })
          );

          return;
        }

        // ----------------------------------------------
        // WEBHOOK WHATSAPP
        // ----------------------------------------------

        if (
          request.method === "POST" &&
          request.url === "/webhook"
        ) {
          let body = "";

          request.on(
            "data",
            chunk => {
              body += chunk.toString();
            }
          );

          request.on(
            "end",
            async () => {
              try {
                const data =
                  JSON.parse(body);

                await handleWhatsAppWebhook(
                  data
                );

                response.writeHead(
                  200,
                  {
                    "Content-Type":
                      "application/json"
                  }
                );

                response.end(
                  JSON.stringify({
                    success: true
                  })
                );

              } catch (error) {
                console.error(
                  "❌ WEBHOOK ERROR:",
                  error.message
                );

                response.writeHead(
                  400,
                  {
                    "Content-Type":
                      "application/json"
                  }
                );

                response.end(
                  JSON.stringify({
                    success: false
                  })
                );
              }
            }
          );

          return;
        }

        response.writeHead(404);
        response.end("Not Found");

      } catch (error) {
        console.error(
          "❌ SERVER ERROR:",
          error.message
        );

        response.writeHead(500);
        response.end(
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
  "0.0.0.0",
  () => {
    console.log(
      "======================================"
    );

    console.log(
      `🌐 SERVER PORT: ${PORT}`
    );

    console.log(
      "🌐 WEBHOOK: /webhook"
    );

    console.log(
      "🟢 SERVER AKTIF"
    );

    console.log(
      "======================================"
    );
  }
);

// ======================================================
// SHUTDOWN
// ======================================================

process.on(
  "SIGTERM",
  () => {
    console.log(
      "⚠️ SIGTERM diterima."
    );

    bot.stopPolling();

    server.close(
      () => {
        console.log(
          "🛑 Server berhenti."
        );

        process.exit(0);
      }
    );
  }
);

process.on(
  "SIGINT",
  () => {
    console.log(
      "⚠️ SIGINT diterima."
    );

    bot.stopPolling();

    server.close(
      () => {
        process.exit(0);
      }
    );
  }
);
