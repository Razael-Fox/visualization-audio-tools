import { sendMessage } from '../api.js';
import { getUser } from '../services/index.js';

export async function handleStart(message: any) {
  const chatId = message.chat.id;
  const fromId = message.from.id;
  
  // Register or get user
  const user = await getUser(fromId);
  
  const text = `Welcome to VANT Bot! 🎵✨\n\nYou currently have ${user.quota} visualizations available in your quota.\n\nSend me an audio file to get started, or use /help to see more instructions.`;
  
  await sendMessage(chatId, text, {
    reply_markup: {
      inline_keyboard: [
        [{ text: 'Help & Instructions', callback_data: 'help' }]
      ]
    }
  });
}
