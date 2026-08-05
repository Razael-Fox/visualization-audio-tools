import dotenv from 'dotenv';
import axios from 'axios';
dotenv.config();

const BOT_TOKEN = process.env.BOT_TOKEN;

if (!BOT_TOKEN) {
  console.error("BOT_TOKEN is missing in environment variables!");
}

// Use the NAT VPS webhook server as a proxy to bypass local network blocks
const TELEGRAM_API_URL = process.env.TELEGRAM_API_PROXY || 'https://webhook.purplefoxbot.xyz/proxy';

export async function sendMessage(chatId: number, text: string, options?: any) {
  try {
    const response = await axios.post(`${TELEGRAM_API_URL}/sendMessage`, {
      chat_id: chatId,
      text,
      ...options,
    });
    return response.data;
  } catch (error) {
    console.error('Error sending message:', error);
  }
}

export async function sendVideo(chatId: number, videoUrl: string, options?: any) {
    try {
      const response = await axios.post(`${TELEGRAM_API_URL}/sendVideo`, {
        chat_id: chatId,
        video: videoUrl,
        ...options,
      });
      return response.data;
    } catch (error) {
      console.error('Error sending video:', error);
    }
}
