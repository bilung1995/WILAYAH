require("dotenv").config();

const fs = require("fs");
const path = require("path");

const TelegramBot =
  require("node-telegram-bot-api");


// ======================================================
// ENV
// ======================================================

const TOKEN =
  process.env.TELEGRAM_TOKEN ||
  process.env.BOT_TOKEN;


if (!TOKEN) {

  console.log(
    "❌ TOKEN TELEGRAM TIDAK ADA"
  );

  process.exit(1);

}


// ======================================================
// DATABASE
// ======================================================

const DATA_FILE =
  path.join(
    __dirname,
    "bot-data.json"
  );


function defaultDatabase(){

  return {
    users:{}
  };

}



function loadDatabase(){

  try {

    if(
      !fs.existsSync(DATA_FILE)
    ){

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


    return JSON.parse(
      fs.readFileSync(
        DATA_FILE,
        "utf8"
      )
    );


  } catch(error){

    console.log(
      "DATABASE ERROR:",
      error.message
    );


    return defaultDatabase();

  }

}



let database =
  loadDatabase();



function saveDatabase(){

  fs.writeFileSync(
    DATA_FILE,
    JSON.stringify(
      database,
      null,
      2
    )
  );

}



// ======================================================
// TELEGRAM BOT
// ======================================================

const bot =
  new TelegramBot(
    TOKEN,
    {
      polling:true
    }
  );


console.log(
  "🤖 BOT TELEGRAM AKTIF"
);



// ======================================================
// USER
// ======================================================

function getUser(chatId){

  const id =
    String(chatId);


  if(
    !database.users[id]
  ){

    database.users[id] = {

      id:id,

      firstName:"",

      username:"",

      createdAt:
        new Date().toISOString()

    };


    saveDatabase();

  }


  return database.users[id];

}



// ======================================================
// KEYBOARD
// ======================================================

function mainKeyboard(){

  return {

    keyboard:[

      [
        {
          text:"🏙️ TAMBAH KOTA"
        }
      ],

      [
        {
          text:"📍 KOTA YANG DIPILIH"
        }
      ],

      [
        {
          text:"👤 PROFIL"
        }
      ]

    ],

    resize_keyboard:true

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
      message.from.first_name || "";


    user.username =
      message.from.username || "";


    saveDatabase();



    await bot.sendMessage(

      chatId,

      "🎉 BOT BERHASIL AKTIF!\n\n" +

      "✅ Telegram terhubung\n" +

      "✅ Database siap\n\n" +

      "Silakan pilih menu.",


      {
        reply_markup:
          mainKeyboard()
      }

    );


    console.log(
      "START USER:",
      chatId
    );


  }
);



// ======================================================
// ERROR
// ======================================================

bot.on(
  "polling_error",
  error => {

    console.log(
      "❌ POLLING ERROR:",
      error.message
    );

  }
);
