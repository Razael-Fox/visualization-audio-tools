import express from 'express';
import dotenv from 'dotenv';
import axios from 'axios';
import { processUpdate } from './router.js';

dotenv.config();

const app = express();
app.use(express.json());

app.use((req, res, next) => {
  console.log(`[HTTP] ${req.method} ${req.url}`);
  next();
});

const PORT = process.env.PORT || 3000;
const BOT_TOKEN = process.env.BOT_TOKEN;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'secret';
const WEBHOOK_URL = 'https://webhook.purplefoxbot.xyz/telegram';

app.post(['/', '/telegram', '/process'], async (req, res) => {
  console.log("Received webhook request on path:", req.url, req.body);
  const secretToken = req.headers['x-telegram-bot-api-secret-token'] || req.headers['X-Telegram-Bot-Api-Secret-Token'];
  
  if (secretToken && secretToken !== WEBHOOK_SECRET) {
    return res.status(403).send('Unauthorized');
  } else if (!secretToken) {
    console.warn("Warning: Received webhook request without secret token. Processing anyway because it might be forwarded by the VPS.");
  }

  const update = req.body;
  
  // Acknowledge receipt to Telegram so they don't retry
  res.sendStatus(200);
  
  try {
    await processUpdate(update);
  } catch (error) {
    console.error("Error processing update:", error);
  }
});

async function setWebhook() {
  if (!BOT_TOKEN) return;
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`;
  
  try {
    const response = await axios.post(url, {
      url: WEBHOOK_URL,
      secret_token: WEBHOOK_SECRET,
    });
    console.log("Webhook setup result:", response.data);
  } catch (error) {
    console.error("Failed to set webhook:", error);
  }
}

app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
  // setWebhook(); // Disabled locally as it times out and is managed by the VPS
});
