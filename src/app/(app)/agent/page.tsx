"use client";

import { useState, useRef, useEffect } from "react";
import TopBar from "@/components/TopBar";
import { Bot, Send, User, Sparkles, Zap, Target, Mail } from "lucide-react";

interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
}

const quickActions = [
  { icon: Target, label: "Research a lead", prompt: "Research the company CloudSync and find their decision makers" },
  { icon: Mail, label: "Draft cold email", prompt: "Write a cold email to a VP of Engineering about our AI-powered sales platform" },
  { icon: Sparkles, label: "Score my leads", prompt: "How should I score and prioritize my leads by likelihood to close?" },
  { icon: Zap, label: "Suggest follow-ups", prompt: "What are the best follow-up strategies for leads that haven't responded?" },
];

export default function AgentPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: "assistant",
      content: "Hey! I'm Aiden, your AI sales agent. I can help you research leads, write outreach emails, qualify prospects, and manage your pipeline. What would you like to do?",
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
      const apiMessages = updated
        .filter((m) => m.id !== 1)
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages }),
      });

      const data = await res.json();

      if (data.error) {
        setMessages((prev) => [
          ...prev,
          { id: Date.now(), role: "assistant", content: `Sorry, something went wrong: ${data.error}` },
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
        { id: Date.now(), role: "assistant", content: "Sorry, I couldn't connect to the AI service. Please try again." },
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
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
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
                <p className="text-sm text-muted-foreground animate-pulse">Thinking...</p>
              </div>
            </div>
          )}

          {/* Quick actions */}
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
                  <span className="text-sm font-medium text-foreground">{action.label}</span>
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
                placeholder="Ask Aiden anything about your sales..."
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
