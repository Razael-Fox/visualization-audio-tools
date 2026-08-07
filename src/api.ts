import dotenv from 'dotenv';
import axios from 'axios';
dotenv.config();

const BOT_TOKEN = process.env.BOT_TOKEN;

if (!BOT_TOKEN) {
  console.error("BOT_TOKEN is missing in environment variables!");
}

// Use the NAT VPS webhook server as a proxy to bypass local network blocks
const TELEGRAM_API_URL = process.env.TELEGRAM_API_PROXY || 'https://webhook.purplefoxbot.xyz/proxy';

export async function getFileUrl(fileId: string): Promise<string | null> {
  try {
    const response = await axios.post(`${TELEGRAM_API_URL}/getFile`, {
      file_id: fileId
    });
    const filePath = response.data?.result?.file_path;
    if (filePath && BOT_TOKEN) {
      return `https://api.telegram.org/file/bot${BOT_TOKEN}/${filePath}`;
    }
    return null;
  } catch (error) {
    console.error('Error getting file URL:', error);
    return null;
  }
}


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

export async function sendVideoStream(chatId: number, videoStream: any, options?: any) {
    try {
      const response = await axios.post(`${TELEGRAM_API_URL}/sendVideo`, {
        chat_id: chatId,
        video: videoStream,
        ...options,
      }, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error sending video stream:', error);
    }
}
