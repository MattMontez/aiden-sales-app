"use client";

import { useState, useRef, useEffect } from "react";
import TopBar from "@/components/TopBar";
import { supabase } from "@/lib/supabase-browser";
import { Bot, Send, User, Sparkles, Zap, Target, Mail, Search, PlusCircle } from "lucide-react";

interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
}

const quickActions = [
  { icon: Search, label: "Show my leads", prompt: "Show me all my current leads" },
  { icon: Target, label: "Pipeline summary", prompt: "Give me a summary of my sales pipeline" },
  { icon: PlusCircle, label: "Add a lead", prompt: "Add a new lead: John Smith at Acme Corp, value $10,000, source: website" },
  { icon: Mail, label: "Draft cold email", prompt: "Draft a cold email to introduce our AI-powered digital marketing services" },
  { icon: Sparkles, label: "Score my leads", prompt: "Look at my leads and score them based on likelihood to close" },
  { icon: Zap, label: "Suggest follow-ups", prompt: "Which of my leads need follow-up and what should I say?" },
];

// Simple markdown-ish renderer for common patterns
function renderContent(text: string) {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];

  lines.forEach((line, i) => {
    let rendered: React.ReactNode = line;

    // Headers
    if (line.startsWith("### ")) {
      elements.push(
        <h4 key={i} className="text-sm font-bold text-foreground mt-3 mb-1">
          {processInline(line.slice(4))}
        </h4>
      );
      return;
    }
    if (line.startsWith("## ")) {
      elements.push(
        <h3 key={i} className="text-sm font-bold text-foreground mt-3 mb-1">
          {processInline(line.slice(3))}
        </h3>
      );
      return;
    }
    if (line.startsWith("# ")) {
      elements.push(
        <h3 key={i} className="font-bold text-foreground mt-3 mb-1">
          {processInline(line.slice(2))}
        </h3>
      );
      return;
    }

    // Bullet points
    if (line.match(/^[\-\*]\s/)) {
      elements.push(
        <div key={i} className="flex gap-2 ml-1">
          <span className="text-primary mt-0.5">•</span>
          <span>{processInline(line.slice(2))}</span>
        </div>
      );
      return;
    }

    // Numbered lists
    if (line.match(/^\d+\.\s/)) {
      const num = line.match(/^(\d+)\.\s/)![1];
      elements.push(
        <div key={i} className="flex gap-2 ml-1">
          <span className="text-primary font-semibold min-w-[1.2em]">{num}.</span>
          <span>{processInline(line.replace(/^\d+\.\s/, ""))}</span>
        </div>
      );
      return;
    }

    // Horizontal rule
    if (line.match(/^---+$/)) {
      elements.push(<hr key={i} className="border-border my-2" />);
      return;
    }

    // Empty line
    if (line.trim() === "") {
      elements.push(<div key={i} className="h-2" />);
      return;
    }

    // Regular text
    elements.push(
      <p key={i}>{processInline(line)}</p>
    );
  });

  return <div className="space-y-0.5">{elements}</div>;
}

// Process inline markdown (bold, italic, code, links)
function processInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    // Bold **text**
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
    // Inline code `text`
    const codeMatch = remaining.match(/`(.+?)`/);

    // Find the earliest match
    type InlineMatch = { index: number; length: number; node: React.ReactNode };
    let earliest: InlineMatch | null = null;

    if (boldMatch && boldMatch.index !== undefined) {
      const idx = boldMatch.index;
      if (!earliest || idx < (earliest as InlineMatch).index) {
        earliest = {
          index: idx,
          length: boldMatch[0].length,
          node: <strong key={`b${key}`} className="font-semibold text-foreground">{boldMatch[1]}</strong>,
        };
      }
    }

    if (codeMatch && codeMatch.index !== undefined) {
      const idx = codeMatch.index;
      if (!earliest || idx < (earliest as InlineMatch).index) {
        earliest = {
          index: idx,
          length: codeMatch[0].length,
          node: <code key={`c${key}`} className="bg-secondary px-1.5 py-0.5 rounded text-xs font-mono">{codeMatch[1]}</code>,
        };
      }
    }

    if (earliest) {
      // Add text before the match
      if (earliest.index > 0) {
        parts.push(remaining.slice(0, earliest.index));
      }
      parts.push(earliest.node);
      remaining = remaining.slice(earliest.index + earliest.length);
      key++;
    } else {
      parts.push(remaining);
      break;
    }
  }

  return parts.length === 1 ? parts[0] : <>{parts}</>;
}

export default function AgentPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: "assistant",
      content:
        "Hey! I'm Aiden, your AI sales agent. I can **actually** work with your data now — search leads, add new ones, move deals through the pipeline, send emails, and give you pipeline insights. What would you like to do?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (text?: string) => {
    const msg = text || input;
    if (!msg.trim() || loading) return;

    const userMsg: Message = { id: Date.now(), role: "user", content: msg };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    setLoading(true);

    try {
      // Get the current session token
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const apiMessages = updated
        .filter((m) => m.id !== 1)
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: apiMessages,
          accessToken: session?.access_token,
        }),
      });

      const data = await res.json();

      if (data.error) {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now(),
            role: "assistant",
            content: `Sorry, something went wrong: ${data.error}`,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { id: Date.now(), role: "assistant", content: data.content },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          role: "assistant",
          content:
            "Sorry, I couldn't connect to the AI service. Please try again.",
        },
      ]);
    }

    setLoading(false);
  };

  return (
    <>
      <TopBar title="AI Agent" />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Messages */}
        <div className="flex-1 overflow-auto p-6 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}
            >
              {msg.role === "assistant" && (
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-primary-foreground" />
                </div>
              )}
              <div
                className={`max-w-2xl rounded-2xl px-4 py-3 ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-card border border-border text-foreground"
                }`}
              >
                <div className="text-sm">
                  {msg.role === "assistant"
                    ? renderContent(msg.content)
                    : msg.content}
                </div>
              </div>
              {msg.role === "user" && (
                <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-primary-foreground" />
              </div>
              <div className="bg-card border border-border rounded-2xl px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                  <span className="text-sm text-muted-foreground">Aiden is working...</span>
                </div>
              </div>
            </div>
          )}

          {/* Quick actions */}
          {messages.length === 1 && (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 max-w-3xl ml-11">
              {quickActions.map((action) => (
                <button
                  key={action.label}
                  onClick={() => send(action.prompt)}
                  className="flex items-center gap-3 p-4 bg-card border border-border rounded-xl hover:border-primary hover:shadow-sm transition-all text-left"
                >
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <action.icon className="w-4.5 h-4.5 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-foreground">
                    {action.label}
                  </span>
                </button>
              ))}
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="border-t border-border bg-card p-4">
          <div className="max-w-4xl mx-auto flex items-center gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder="Ask Aiden to search leads, add contacts, send emails, check your pipeline..."
                disabled={loading}
                className="w-full px-4 py-3 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary pr-12 disabled:opacity-50"
              />
              <button
                onClick={() => send()}
                disabled={loading}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary-light transition-colors disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
