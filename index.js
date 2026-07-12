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
  const { state, saveCreds } = await useMultiFileAuthState("auth-new");

  const sock = makeWASocket({
    auth: state,
    logger: pino({ level: "silent" }),
    browser: ["Chrome", "Windows", "10"],
    markOnlineOnConnect: false
  });

  sock.ev.on("creds.update", saveCreds);

  let pairingStarted = false;

  sock.ev.on("connection.update", async ({ connection, lastDisconnect }) => {

    if (connection === "connecting" && !state.creds.registered && !pairingStarted) {
      pairingStarted = true;

      setTimeout(async () => {
        try {
          const code = await sock.requestPairingCode("93772798327");

          console.log("==============================");
          console.log("PAIRING CODE:", code);
          console.log("==============================");

        } catch (err) {
          console.log("Pairing error:", err.message);
          pairingStarted = false;
        }
      }, 3000);
    }

    if (connection === "open") {
      console.log("✅ WhatsApp Connected!");
    }

    if (connection === "close") {
      const reason = lastDisconnect?.error?.output?.statusCode;
      console.log("❌ Connection closed:", reason);

      if (reason !== DisconnectReason.loggedOut) {
        setTimeout(() => {
          startBot();
        }, 10000);
      }
    }
  });
}

startBot();
