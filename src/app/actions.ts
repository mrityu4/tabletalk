'use server';
import { Redis } from 'ioredis';

const redis = new Redis(process.env.REDIS_URL!);

export async function createTable(tableName: string) {
  const exists = await redis.exists(`table:${tableName}`);
  if (exists) {
    return { success: false, message: 'Table already exists' };
  }

  const tableId = Math.random().toString(36).substr(2, 9);
  const passKey = Math.floor(1000 + Math.random() * 9000).toString();

  await redis.hmset(`table:${tableId}`, {
    name: tableName,
    passKey,
  });

  return { success: true, tableId, passKey };
}

export async function joinTable(tableId: string, passKey: string) {
  const storedPassKey = await redis.hget(`table:${tableId}`, 'passKey');
  if (passKey === storedPassKey) {
    return { success: true };
  } else {
    return { success: false, message: 'Incorrect pass key' };
  }
}

export async function getDishes(tableId: string) {
  return await redis.lrange(`dishes:${tableId}`, 0, -1);
}

export async function deleteDish(tableId: string, dishName: string) {
  const removedCount = await redis.lrem(`dishes:${tableId}`, 0, dishName);
  if (removedCount > 0) {
    // Publish the deleted dish to the Redis channel
    await redis.publish(`table:${tableId}`, JSON.stringify({ type: 'delete', dish: dishName }));
    return { success: true, message: 'Dish deleted successfully' };
  }
  return { success: false, message: 'Dish not found' };
}



export async function addDish(tableId: string, dish: string) {
  await redis.rpush(`dishes:${tableId}`, dish);
  // Publish the new dish to the Redis channel
  await redis.publish(`table:${tableId}`, JSON.stringify(dish));
}

export async function searchTable(query: string) {

  const keys = await redis.keys('table:*');
  const tables = await Promise.all(
    keys.map(async (key) => {
      const name = await redis.hget(key, 'name');
      return { id: key.split(':')[1], name };
    })
  );

  return tables.filter((table) =>
    table.name && table.name.toLowerCase().includes(query.toLowerCase())
  ) as { id: string; name: string }[] || [];
}