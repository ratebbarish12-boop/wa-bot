const { default: makeWASocket, useMultiFileAuthState } = require("@whiskeysockets/baileys");
const pino = require("pino");

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("auth");

  const sock = makeWASocket({
    auth: state,
    logger: pino({ level: "silent" })
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", (update) => {
    const { connection, qr } = update;

    if (qr) {
      console.log("QR CODE:", qr);
    }

    if (connection === "open") {
      console.log("WhatsApp Connected!");
    }

    if (connection === "close") {
      console.log("Connection closed");
      startBot();
    }
  });
}

startBot();
