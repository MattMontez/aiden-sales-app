"use client";

import { useState } from "react";
import TopBar from "@/components/TopBar";
import { Bot, Send, User, Sparkles, Zap, Target, Mail } from "lucide-react";

interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

const initialMessages: Message[] = [
  {
    id: 1,
    role: "assistant",
    content:
      "Hey! I'm Aiden, your AI sales agent. I can help you research leads, write outreach emails, qualify prospects, and manage your pipeline. What would you like to do?",
    timestamp: "Just now",
  },
];

const quickActions = [
  { icon: Target, label: "Research a lead", prompt: "Research the company CloudSync and find their decision makers" },
  { icon: Mail, label: "Draft cold email", prompt: "Write a cold email to a VP of Engineering about our AI platform" },
  { icon: Sparkles, label: "Score my leads", prompt: "Analyze and score my top 10 leads by likelihood to close" },
  { icon: Zap, label: "Suggest follow-ups", prompt: "Which leads need follow-up today?" },
];

export default function AgentPage() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");

  const send = (text?: string) => {
    const msg = text || input;
    if (!msg.trim()) return;

    const userMsg: Message = {
      id: messages.length + 1,
      role: "user",
      content: msg,
      timestamp: "Just now",
    };

    const botMsg: Message = {
      id: messages.length + 2,
      role: "assistant",
      content: getResponse(msg),
      timestamp: "Just now",
    };

    setMessages((prev) => [...prev, userMsg, botMsg]);
    setInput("");
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
              className={`flex gap-3 ${
                msg.role === "user" ? "justify-end" : ""
              }`}
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
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                <p
                  className={`text-xs mt-1 ${
                    msg.role === "user"
                      ? "text-primary-foreground/60"
                      : "text-muted-foreground"
                  }`}
                >
                  {msg.timestamp}
                </p>
              </div>
              {msg.role === "user" && (
                <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
          ))}

          {/* Quick actions (show when only initial message) */}
          {messages.length === 1 && (
            <div className="grid grid-cols-2 gap-3 max-w-2xl ml-11">
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
                placeholder="Ask Aiden anything about your sales..."
                className="w-full px-4 py-3 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary pr-12"
              />
              <button
                onClick={() => send()}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary-light transition-colors"
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

function getResponse(input: string): string {
  const lower = input.toLowerCase();
  if (lower.includes("research") || lower.includes("find")) {
    return `Here's what I found:\n\n**CloudSync** — Series B SaaS company ($18M raised)\n- 120 employees, growing 40% YoY\n- HQ: San Francisco\n- Key decision makers:\n  • Emily Tanaka — Head of Growth (LinkedIn connected)\n  • Ryan Foster — CTO\n  • Maria Santos — VP Operations\n\nEmily Tanaka looks like the best entry point — she's been posting about scaling challenges. Want me to draft a personalized outreach email to her?`;
  }
  if (lower.includes("email") || lower.includes("write") || lower.includes("draft")) {
    return `Here's a draft:\n\n**Subject:** Quick thought on scaling your growth ops\n\nHi [Name],\n\nI noticed CloudSync just closed a Series B — congrats! Scaling growth teams after a raise is one of the trickiest parts.\n\nWe've helped similar SaaS companies automate their outbound pipeline and cut manual prospecting time by 60%. Happy to share how in a quick 15-min call?\n\nBest,\nMatt\n\n---\nI can adjust the tone, add social proof, or create a full 3-step sequence. What would you prefer?`;
  }
  if (lower.includes("score") || lower.includes("analyze")) {
    return `Here are your top leads ranked by close probability:\n\n1. **James O'Brien** (ScaleUp Labs) — Score: 95 — $95K — In proposal stage\n2. **Sarah Chen** (TechFlow) — Score: 92 — $45K — Engaged, ready for proposal\n3. **Alex Thompson** (SolveIt) — Score: 88 — $78K — Qualified, needs demo\n4. **Emily Tanaka** (CloudSync) — Score: 85 — $62K — New but high intent\n5. **Laura Mitchell** (GreenLeaf) — Score: 82 — $41K — Responding to emails\n\nI'd prioritize James (close the deal) and Alex (schedule that demo). Want me to draft follow-ups for either?`;
  }
  if (lower.includes("follow") || lower.includes("today")) {
    return `You have **4 leads** that need follow-up today:\n\n1. **Marcus Rivera** (DataPulse) — Last contact: 4h ago — Waiting for pricing info\n2. **Laura Mitchell** (GreenLeaf) — Last contact: 2d ago — Asked for case study\n3. **David Kim** (BrightPath) — Last contact: 3d ago — No response to initial email\n4. **Tom Baker** (SwiftOps) — Last contact: 7d ago — Going cold, needs re-engagement\n\nWant me to auto-draft follow-up emails for all of them?`;
  }
  return `I can help with that! Here are some things I can do:\n\n- **Research** any company or contact\n- **Draft** personalized outreach emails\n- **Score** and prioritize your leads\n- **Suggest** follow-up actions\n- **Analyze** campaign performance\n\nJust tell me what you need!`;
}
