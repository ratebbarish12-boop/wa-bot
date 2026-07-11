const { default: makeWASocket, useMultiFileAuthState } = require("@whiskeysockets/baileys");
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
    browser: ["Chrome", "Windows", "10"]
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", async ({ connection, lastDisconnect }) => {

    if (connection === "open") {
      console.log("WhatsApp Connected!");
    }

    if (connection === "close") {
      console.log("Connection closed");
      startBot();
    }
  });

  if (!state.creds.registered) {
    setTimeout(async () => {
      const phoneNumber = "93772798327";
      const code = await sock.requestPairingCode(phoneNumber);
      console.log("Pairing Code:", code);
    }, 10000);
  }
}

startBot();
