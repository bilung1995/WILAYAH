require("dotenv").config();

const fs = require("fs");
const path = require("path");

const TelegramBot =
  require("node-telegram-bot-api");

const subscription =
  require("./subscription");

const topup =
  require("./topup");

const wilayah =
  require("./wilayah");


// ======================================================
// ENV
// ======================================================

const TOKEN =
  process.env.TELEGRAM_TOKEN ||
  process.env.BOT_TOKEN;


const ADMIN_ID =
  String(
    process.env.ADMIN_ID || ""
  );


if(!TOKEN){

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

  users:{},

  locations:{},

  transactions:{},

  topups:{}

 };

}



function loadDatabase(){

 try{

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


 }catch(error){

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
// TELEGRAM
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

   id,

   firstName:"",

   username:"",

   balance:0,

   subscription:null,

   waitingPaymentProof:false,

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

function getUserLocations(chatId){

 const id =
  String(chatId);


 if(
  !database.locations[id]
 ){

  database.locations[id]=[];

 }


 return database.locations[id];

}



function saveUserLocation(
 chatId,
 location
){

 const id =
  String(chatId);


 if(
  !database.locations[id]
 ){

  database.locations[id]=[];

 }


 const exists =
  database.locations[id].some(
   item =>
    item.kecamatanCode ===
    location.kecamatanCode
  );


 if(!exists){

  database.locations[id].push(
   location
  );

 }


 saveDatabase();

}



// ======================================================
// KEYBOARD UTAMA
// ======================================================

function mainKeyboard(){

 return {

  keyboard:[

   [
    {
     text:"🏙️ TAMBAH KOTA"
    },
    {
     text:"📍 KOTA YANG DIPILIH"
    }
   ],

   [
    {
     text:"👤 PROFIL"
    },
    {
     text:"💳 TOP UP"
    }
   ],

   [
    {
     text:"📊 STATUS"
    },
    {
     text:"❓ BANTUAN"
    }
   ],

   [
    {
     text:"👨‍💼 HUBUNGI ADMIN"
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
 async message=>{


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

   "✅ Database siap\n\n" +

   "Silakan pilih menu.",


   {
    reply_markup:
     mainKeyboard()
   }

  );


 }

);


// ======================================================
// PROFIL
// ======================================================

async function showProfile(chatId){

  const user =
    getUser(chatId);


  const locations =
    getUserLocations(chatId);


  await bot.sendMessage(

    chatId,

    "👤 PROFIL\n\n" +

    `🆔 ID: ${chatId}\n` +

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

    `📍 Wilayah dipilih: ${
      locations.length
    }\n\n` +

    subscription.getSubscriptionInfo(
      user
    ),

    {
      reply_markup:
        mainKeyboard()
    }

  );

}



// ======================================================
// KOTA YANG DIPILIH
// ======================================================

async function showLocations(chatId){

 const locations =
  getUserLocations(chatId);


 if(
  locations.length === 0
 ){

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
  (item,index)=>{


   text +=
    `${index+1}. ${item.provinsi}\n` +
    `   ${item.kabupaten}\n` +
    `   ${item.kecamatan}\n\n`;


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
// STATUS
// ======================================================

async function showStatus(chatId){

  await bot.sendMessage(

    chatId,

    "📊 STATUS BOT\n\n" +

    "🟢 Telegram: AKTIF\n" +

    "🟢 Database: AKTIF\n" +

    "🟢 Sistem berjalan.",

    {
      reply_markup:
        mainKeyboard()
    }

  );

}



// ======================================================
// TOP UP
// ======================================================

async function showTopup(chatId){

  topup.startTopup(chatId);


  await bot.sendMessage(

    chatId,

    topup.getTopupMessage()

  );

}



// ======================================================
// PESAN MENU USER
// ======================================================

bot.on(
  "message",
  async message => {


    try {


      if(
        !message.text ||
        message.text.startsWith("/")
      ){

        return;

      }



      const chatId =
        message.chat.id;



      const text =
        message.text.trim();



      getUser(chatId);



      switch(text){


        case "📊 STATUS":


          await showStatus(
            chatId
          );


          break;



        case "💳 TOP UP":


          await showTopup(
            chatId
          );


          break;



        case "🏙️ TAMBAH KOTA":


          const user =
            getUser(chatId);



          if(
            !subscription.hasActiveSubscription(
              user
            )
          ){


            await bot.sendMessage(

              chatId,

              subscription.getSubscriptionMessage(),

              {
                reply_markup:
                  subscription.getSubscriptionKeyboard()
              }

            );


            break;

          }



          await wilayah.showProvinsi(

            bot,

            chatId

          );


          break;



        default:


          break;


      }



    } catch(error){


      console.log(

        "ERROR MENU:",

        error.message

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
        query.message.chat.id;


      const data =
        query.data;



      console.log(
        "CALLBACK:",
        data
      );



// ======================================================
// SUBSCRIPTION
// ======================================================

if(
  data.startsWith("SUBSCRIBE_")
){


  const packageId =
    data.replace(
      "SUBSCRIBE_",
      ""
    );



  const user =
    getUser(chatId);



  const result =
    subscription.createSubscriptionRequest(
      user,
      packageId
    );



  if(
    !result.success
  ){

    await bot.answerCallbackQuery(
      query.id
    );


    await bot.sendMessage(
      chatId,
      result.message
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

    "✅ Permintaan subscription dibuat.\n\n" +

    `📦 Paket: ${result.package.name}\n` +

    `💰 Harga: ${subscription.formatRupiah(result.package.price)}\n\n` +

    "Silakan lakukan pembayaran lalu kirim bukti transfer."

  );


  return;

}




// ======================================================
// ADMIN APPROVE / REJECT
// ======================================================

if(
 data.startsWith("APPROVE_") ||
 data.startsWith("REJECT_")
){


 if(
  String(chatId) !== ADMIN_ID
 ){

  return;

 }



 const userId =
  data.split("_")[1];



 const user =
  getUser(userId);



 if(
  data.startsWith("APPROVE_")
 ){


  subscription.activateSubscription(

    user,

    user.subscriptionRequest.packageId

  );


  saveDatabase();



  await bot.sendMessage(

    userId,

    "🎉 Pembayaran diterima.\n\n" +

    "Subscription Anda sudah aktif."

  );



  await bot.sendMessage(

    chatId,

    "✅ Subscription user berhasil diaktifkan."

  );


 }



 if(
  data.startsWith("REJECT_")
 ){


  user.subscriptionRequest =
    null;


  saveDatabase();



  await bot.sendMessage(

    userId,

    "❌ Pembayaran ditolak.\n\n" +

    "Silakan hubungi admin."

  );



  await bot.sendMessage(

    chatId,

    "❌ Pembayaran ditolak."

  );


 }


 return;

}



// ======================================================
// PILIH PROVINSI
// ======================================================

if(
 data.startsWith("prov_")
){


 const provId =
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

  provId

 );


 return;

}




// ======================================================
// PILIH KABUPATEN
// ======================================================

if(
 data.startsWith("kab_")
){


 const kabId =
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

  kabId

 );


 return;

}




// ======================================================
// PILIH KECAMATAN
// ======================================================

if(
 data.startsWith("kec_")
){


 const kecId =
  data.replace(
   "kec_",
   ""
  );



 const lokasi = {

  provinsi:
   "Dipilih",

  kabupaten:
   "Dipilih",

  kecamatan:
   kecId,

  kecamatanCode:
   kecId

 };



 saveUserLocation(

  chatId,

  lokasi

 );



 await bot.answerCallbackQuery(
  query.id
 );



 await bot.sendMessage(

  chatId,

  "✅ Wilayah berhasil disimpan.",

  {
   reply_markup:
    mainKeyboard()
  }

 );


 return;

}



    }


    catch(error){


      console.log(

        "ERROR CALLBACK:",

        error.message

      );


    }


  }

);


// ======================================================
// FOTO BUKTI TRANSFER
// ======================================================

bot.on(
  "photo",
  async msg => {

    try {

      const chatId =
        msg.chat.id;


      const user =
        getUser(chatId);



      if(
        !user.waitingPaymentProof
      ){

        return;

      }



      if(
        !user.subscriptionRequest
      ){

        await bot.sendMessage(
          chatId,
          "❌ Tidak ada permintaan subscription aktif."
        );

        return;

      }



      const photoId =
        msg.photo[
          msg.photo.length - 1
        ].file_id;



      user.paymentProof =
        photoId;


      user.waitingPaymentProof =
        false;


      saveDatabase();



      await bot.sendMessage(

        chatId,

        "✅ Bukti transfer berhasil dikirim.\n\n" +

        "⏳ Menunggu persetujuan admin."

      );



      await bot.sendPhoto(

        ADMIN_ID,

        photoId,

        {

          caption:

          "🔔 PEMBAYARAN SUBSCRIPTION MASUK\n\n" +

          `👤 User ID: ${chatId}\n` +

          `📦 Paket: ${user.subscriptionRequest.packageName}\n` +

          `💰 Harga: Rp ${Number(
            user.subscriptionRequest.price
          ).toLocaleString("id-ID")}\n\n` +

          "Silakan pilih tindakan:",



          reply_markup:{

            inline_keyboard:[

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


    }

    catch(error){

      console.log(
        "ERROR FOTO:",
        error.message
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

    console.log(
      "❌ TELEGRAM ERROR:",
      error.message
    );

  }
);



// ======================================================
// SHUTDOWN
// ======================================================

process.on(
  "SIGINT",
  () => {

    console.log(
      "⚠️ SIGINT diterima"
    );


    bot.stopPolling();


    process.exit(0);

  }
);



process.on(
  "SIGTERM",
  () => {

    console.log(
      "⚠️ SIGTERM diterima"
    );


    bot.stopPolling();


    process.exit(0);

  }
);



// ======================================================
// SELESAI
// ======================================================

console.log(
  "✅ SISTEM BOT SIAP"
);
