// adminContact.js
// Sistem HUBUNGI ADMIN

const adminContact = {
  name: "HAMBALI",
  telegram: "@Hambali1995",

  whatsapp1: "083160776091",
  whatsapp2: "083182333956"
};

// ========================================
// LINK WHATSAPP
// ========================================

function whatsappLink(number) {
  // 0838xxxx -> 62838xxxx
  const internationalNumber =
    number.startsWith("0")
      ? "62" + number.substring(1)
      : number;

  return `https://wa.me/${internationalNumber}`;
}

// ========================================
// PESAN HUBUNGI ADMIN
// ========================================

function getAdminContactMessage() {
  return (
    "👨‍💼 HUBUNGI ADMIN\n\n" +
    "👤 Nama: HAMBALI\n\n" +
    "📱 Telegram: @Hambali1995\n\n" +
    "📞 Pilih WhatsApp Admin di bawah ini."
  );
}

// ========================================
// TOMBOL KONTAK ADMIN
// ========================================

function getAdminContactKeyboard() {
  return {
    inline_keyboard: [
      [
        {
          text: "📞 WhatsApp Admin 1",
          url: whatsappLink(
            adminContact.whatsapp1
          )
        }
      ],
      [
        {
          text: "📞 WhatsApp Admin 2",
          url: whatsappLink(
            adminContact.whatsapp2
          )
        }
      ],
      [
        {
          text: "📱 Telegram Admin",
          url: "https://t.me/Hambali1995"
        }
      ]
    ]
  };
}

module.exports = {
  adminContact,
  whatsappLink,
  getAdminContactMessage,
  getAdminContactKeyboard
};
