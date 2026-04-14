import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { toolDefinitions, executeTool } from "./tools";
import { createServerSupabase } from "@/lib/supabase-server";

function getAnthropicClient() {
  return new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });
}

const SYSTEM_PROMPT = `You are Aiden, the AI sales agent for the Aiden Sales platform by MBC Group.

You have real access to the user's CRM database. You can search leads, create new ones, update deals, move leads through the pipeline, send emails, and log activities.

CAPABILITIES:
- Search and browse all leads in the database
- Create new leads with full details
- Update lead status, score, value, notes, or any field
- View the full sales pipeline with dollar values
- Send real emails to contacts
- Add notes and log activities on leads

PERSONALITY:
- You're a sharp, friendly sales assistant — like a top-performing SDR
- Be concise and actionable — no fluff
- When showing lead data, format it cleanly with names, companies, values, and stages
- When asked to do something (create a lead, send email, move a deal), just do it — don't ask for permission unless critical info is missing
- Use dollar formatting for values ($5,000 not 5000)
- Use markdown formatting for readability

RULES:
- Always use the tools to get real data — never make up lead information
- When creating leads, confirm what you created
- When sending emails, tell the user who you emailed and the subject
- If the user mentions a company or person, search for them first
- Format lists and data cleanly with bullet points or tables`;

// Resolve the user ID from their Supabase access token
async function getUserId(token: string | null): Promise<string | null> {
  if (!token) return null;
  const db = createServerSupabase();
  const { data, error } = await db.auth.getUser(token);
  if (error) {
    console.error("getUserId error:", error.message);
    return null;
  }
  return data?.user?.id || null;
}

export async function POST(req: NextRequest) {
  try {
    const { messages, accessToken } = await req.json();

    // Get the user ID from the access token
    const userId = await getUserId(accessToken || null);

    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Build the conversation for Claude
    const conversationMessages = messages.map((m: { role: string; content: string }) => ({
      role: m.role,
      content: m.content,
    }));

    // Tool use loop — Claude may call multiple tools before giving a final answer
    let currentMessages = [...conversationMessages];
    let maxIterations = 8; // safety limit

    while (maxIterations > 0) {
      maxIterations--;

      const response = await getAnthropicClient().messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 2048,
        system: SYSTEM_PROMPT,
        tools: toolDefinitions,
        messages: currentMessages,
      });

      // Check if Claude wants to use tools
      const toolUseBlocks = response.content.filter(
        (block) => block.type === "tool_use"
      );

      if (toolUseBlocks.length === 0 || response.stop_reason === "end_turn") {
        // No tool calls — extract the final text response
        const textBlocks = response.content.filter(
          (block) => block.type === "text"
        );
        const text = textBlocks
          .map((block) => (block.type === "text" ? block.text : ""))
          .join("\n");

        return NextResponse.json({ content: text || "Done!" });
      }

      // Execute each tool call and build the response
      const assistantContent = response.content;
      const toolResults: Array<{
        type: "tool_result";
        tool_use_id: string;
        content: string;
      }> = [];

      for (const block of toolUseBlocks) {
        if (block.type === "tool_use") {
          const result = await executeTool(
            block.name,
            block.input as Record<string, unknown>,
            userId
          );
          toolResults.push({
            type: "tool_result",
            tool_use_id: block.id,
            content: result,
          });
        }
      }

      // Add the assistant's response and tool results to continue the loop
      currentMessages = [
        ...currentMessages,
        { role: "assistant", content: assistantContent },
        { role: "user", content: toolResults },
      ];
    }

    // If we hit the iteration limit, return what we have
    return NextResponse.json({
      content: "I ran into a limit while processing your request. Please try a simpler question.",
    });
  } catch (error: unknown) {
    console.error("AI route error:", error);
    const message = error instanceof Error ? error.message : "AI request failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
