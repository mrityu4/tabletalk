import { Redis } from 'ioredis';
import { NextRequest } from 'next/server';
export const dynamic = 'force-dynamic';

const redis = new Redis(process.env.REDIS_URL!);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const table = searchParams.get('table');

  const encoder = new TextEncoder();
  const subscriber = redis.duplicate();
  const stream = new ReadableStream({
    async start(controller) {
      await subscriber.subscribe(`table:${table}`);
      subscriber.on('message', (channel, message) => {
        controller.enqueue(encoder.encode(`data: ${message}\n\n`));
      });
    },
    cancel() {
      subscriber.unsubscribe();
      subscriber.quit();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

