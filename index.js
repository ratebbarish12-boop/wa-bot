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

let isStarting = false;

async function startBot() {
  if (isStarting) return;
  isStarting = true;

  const { state, saveCreds } = await useMultiFileAuthState("auth-new");

  const sock = makeWASocket({
    auth: state,
    logger: pino({ level: "silent" }),
    browser: ["Ubuntu", "Chrome", "20"],
    markOnlineOnConnect: false
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", async ({ connection, lastDisconnect }) => {

    if (connection === "connecting" && !state.creds.registered) {
      try {
        const code = await sock.requestPairingCode("93772798327");
        console.log("================================");
        console.log("PAIRING CODE:", code);
        console.log("================================");
      } catch (e) {
        console.log("Pairing error:", e.message);
      }
    }

    if (connection === "open") {
      console.log("✅ WhatsApp Connected!");
      isStarting = false;
    }

    if (connection === "close") {
      isStarting = false;

      const reason = lastDisconnect?.error?.output?.statusCode;
      console.log("Connection closed:", reason);

      if (reason !== DisconnectReason.loggedOut) {
        setTimeout(() => {
          startBot();
        }, 10000);
      }
    }
  });
}

startBot();
