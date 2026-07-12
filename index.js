const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require("@whiskeysockets/baileys");
const pino = require("pino");
const express = require("express");

const app = express();
const PORT = process.env.PORT || 10000;

app.get("/", (req, res) => {
  res.send("Bot is running");
});

app.listen(PORT, "0.0.0.0", () => {
  console.log("Server running on port " + PORT);
});

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("auth");

  const sock = makeWASocket({
    auth: state,
    logger: pino({ level: "silent" }),
    printQRInTerminal: false,
    browser: ["Ubuntu", "Chrome", "20"]
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === "open") {
      console.log("✅ WhatsApp Connected!");
    }

    if (connection === "close") {
      const reason = lastDisconnect?.error?.output?.statusCode;

      console.log("❌ Connection closed:", reason);

      if (reason !== DisconnectReason.loggedOut) {
        console.log("🔄 Reconnecting...");
        setTimeout(() => startBot(), 5000);
      } else {
        console.log("WhatsApp logged out. Delete auth folder and pair again.");
      }
    }
  });

  if (!state.creds.registered) {
    try {
      await new Promise(resolve => setTimeout(resolve, 15000));

      const phoneNumber = "93772798327";

      const code = await sock.requestPairingCode(phoneNumber);

      console.log("==============================");
      console.log("PAIRING CODE:", code);
      console.log("==============================");

    } catch (error) {
      console.log("Pairing code error:");
      console.log(error.message);
    }
  }
}

startBot();
