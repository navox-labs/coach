import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  const { messages, systemPrompt } = await req.json();

  const stream = await openai.responses.create({
    model: "gpt-4o",
    instructions: systemPrompt,
    input: messages,
    tools: [{ type: "web_search" }],
    stream: true,
    max_output_tokens: 1000,
    temperature: 0.7,
    store: false,
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      for await (const event of stream) {
        if (event.type === "response.output_text.delta") {
          controller.enqueue(encoder.encode(event.delta));
        }
      }
      controller.close();
    },
  });

  return new NextResponse(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
