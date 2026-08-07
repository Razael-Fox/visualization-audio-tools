import dotenv from 'dotenv';
import axios from 'axios';
import FormData from 'form-data';
dotenv.config();

const BOT_TOKEN = process.env.BOT_TOKEN;

if (!BOT_TOKEN) {
  console.error("BOT_TOKEN is missing in environment variables!");
}

// Use direct Telegram API if proxy is not set
const TELEGRAM_API_URL = process.env.TELEGRAM_API_PROXY || `https://api.telegram.org/bot${BOT_TOKEN}`;

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
      const form = new FormData();
      form.append('chat_id', chatId);
      
      const knownLength = options?.knownLength;
      const opts = { ...options };
      delete opts.knownLength;
      
      form.append('video', videoStream, { 
        filename: 'video.mp4',
        ...(knownLength ? { knownLength } : {})
      });
      
      for (const key of Object.keys(opts)) {
        if (opts[key] !== undefined) {
          form.append(key, opts[key]);
        }
      }

      const response = await axios.post(`${TELEGRAM_API_URL}/sendVideo`, form, {
        headers: form.getHeaders(),
        // Support large uploads without timing out prematurely
        maxBodyLength: Infinity,
        maxContentLength: Infinity
      });
      return response.data;
    } catch (error) {
      console.error('Error sending video stream:', error);
      throw error;
    }
}
