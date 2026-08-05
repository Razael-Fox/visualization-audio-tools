import { handleStart } from './handlers/start.js';
import { handleHelp } from './handlers/help.js';
import { handleAudio } from './handlers/audio.js';

export async function processUpdate(update: any) {
  if (update.callback_query) {
    // Handle inline keyboard callbacks
    const data = update.callback_query.data;
    const message = update.callback_query.message;
    // Mock the from user so handleHelp works seamlessly
    message.from = update.callback_query.from;
    
    if (data === 'help') {
      await handleHelp(message);
    }
    return;
  }

  if (update.message) {
    const message = update.message;
    
    if (message.text) {
      if (message.text.startsWith('/start')) {
        await handleStart(message);
      } else if (message.text.startsWith('/help')) {
        await handleHelp(message);
      } else {
         // other text handling
      }
    } else if (message.audio || message.voice || message.document) {
      await handleAudio(message);
    }
  }
}
