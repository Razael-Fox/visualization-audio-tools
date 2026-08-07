import { sendMessage, getFileUrl, sendVideoStream } from '../api.js';
import { getUser, decreaseQuota } from '../services/index.js';
import axios from 'axios';

export async function handleAudio(message: any) {
  const chatId = message.chat.id;
  const fromId = message.from.id;
  
  const user = await getUser(fromId);
  
  if (user.quota <= 0) {
    await sendMessage(chatId, "Sorry, you have exhausted your visualization quota! 😢");
    return;
  }

  // Deduct quota
  await decreaseQuota(fromId);
  
  const audioFile = message.audio || message.voice || message.document;
  
  if (!audioFile) return;

  await sendMessage(chatId, "🎵 Audio received! Processing your visualization... This might take a few moments. (Quota decreased by 1)");
  
  try {
    const fileUrl = await getFileUrl(audioFile.file_id);
    if (!fileUrl) {
      await sendMessage(chatId, "❌ Failed to retrieve the audio file from Telegram.");
      return;
    }

    // Call the external API to generate the video
    const response = await axios({
      method: 'post',
      url: 'http://127.0.0.1:8080/generate',
      data: { audioUrl: fileUrl, chatId: chatId },
      responseType: 'stream'
    });

    await sendVideoStream(chatId, response.data, { caption: "✅ Your visualization is ready!" });
  } catch (error) {
    console.error('Error generating visualization:', error);
    await sendMessage(chatId, "❌ An error occurred while generating your visualization.");
  }
}
