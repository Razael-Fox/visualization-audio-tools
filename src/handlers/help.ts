import { sendMessage } from '../api.js';

export async function handleHelp(message: any) {
  const chatId = message.chat.id;
  
  const text = `**VANT Bot Instructions** 🎵
  
Here is how you can use the bot:
1. **Send Audio**: Simply send me any valid audio file (.mp3, .wav, etc.).
2. **Process**: I will process it using the VANT engine.
3. **Receive**: You will receive a cool visualization video back.

**Commands:**
/start - Show the welcome menu
/help - Show these instructions

_Note: The visualization generation uses your quota. You can see your remaining quota when you use /start._`;
  
  await sendMessage(chatId, text, { parse_mode: 'Markdown' });
}
