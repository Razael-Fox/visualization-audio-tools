import { PrismaClient } from '../generated/prisma/client.js';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

import 'dotenv/config';

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || 'file:./dev.db'
});

export const db = new PrismaClient({ adapter });

export async function getUser(telegramId: number) {
  const id = BigInt(telegramId);
  let user = await db.user.findUnique({ where: { id } });
  if (!user) {
    user = await db.user.create({
      data: {
        id,
        quota: 5,
      },
    });
  }
  return user;
}

export async function decreaseQuota(telegramId: number) {
  const id = BigInt(telegramId);
  return db.user.update({
    where: { id },
    data: { quota: { decrement: 1 } },
  });
}
