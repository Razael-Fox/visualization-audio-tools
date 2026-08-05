import { getUser } from './src/services/index.js';

async function main() {
  try {
    const user = await getUser(123456);
    console.log('User:', user);
  } catch (err) {
    console.error('Error:', err);
  }
}

main();
