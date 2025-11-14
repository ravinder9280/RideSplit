import { NextRequest, NextResponse } from 'next/server';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { generateText } from 'ai';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const prompt: string | undefined = body?.prompt ?? body?.question;
    const messages: Array<{ role: 'user' | 'system' | 'assistant'; content: string }> | undefined =
      Array.isArray(body?.messages) ? body.messages : undefined;

    if ((!prompt || typeof prompt !== 'string') && !messages) {
      return NextResponse.json({ error: 'Missing prompt or messages' }, { status: 400 });
    }

    const openrouter = createOpenRouter({
      apiKey: process.env.OPENROUTER_API_KEY,
    });

    // Prefer messages if provided, otherwise use prompt
    const requestMessages =
      messages && messages.length
        ? messages
        : [{ role: 'user' as const, content: String(prompt ?? '') }];

    const { text } = await generateText({
      model: openrouter('openai/gpt-oss-20b:free'),
      messages: requestMessages,

      
      
    });
    if (!text || !text.trim()) {
      return NextResponse.json({ error: 'Text Generation Error' }, { status: 502 });
     
    }

    return NextResponse.json({ text });
  } catch (err) {
    console.error('AI chat route error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}


