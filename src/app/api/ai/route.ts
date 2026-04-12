import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are Aiden, an AI sales agent for MBC Group's Aiden Sales platform. You help sales teams by:
- Researching leads and companies
- Writing personalized outreach emails
- Scoring and qualifying leads
- Suggesting follow-up actions
- Analyzing pipeline health

Keep responses concise and actionable. Use markdown formatting for readability.
When asked to draft emails, write them ready to send.
When analyzing leads, give specific scores and reasoning.`;

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: messages.map((m: { role: string; content: string }) => ({
        role: m.role,
        content: m.content,
      })),
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";

    return NextResponse.json({ content: text });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "AI request failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
