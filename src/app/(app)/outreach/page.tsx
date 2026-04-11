"use client";

import { useState } from "react";
import TopBar from "@/components/TopBar";
import {
  Play,
  Pause,
  Mail,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  MousePointerClick,
  Plus,
  Bot,
  Sparkles,
} from "lucide-react";

interface Campaign {
  id: number;
  name: string;
  status: "active" | "paused" | "draft" | "completed";
  sent: number;
  opened: number;
  clicked: number;
  replied: number;
  leads: number;
  steps: number;
}

const campaigns: Campaign[] = [
  { id: 1, name: "Q2 Enterprise Outreach", status: "active", sent: 342, opened: 187, clicked: 56, replied: 23, leads: 120, steps: 4 },
  { id: 2, name: "SaaS Founders Sequence", status: "active", sent: 189, opened: 98, clicked: 34, replied: 12, leads: 85, steps: 3 },
  { id: 3, name: "Re-engagement Series", status: "paused", sent: 456, opened: 201, clicked: 67, replied: 31, leads: 200, steps: 5 },
  { id: 4, name: "Product Launch Follow-up", status: "draft", sent: 0, opened: 0, clicked: 0, replied: 0, leads: 50, steps: 3 },
  { id: 5, name: "Winter Campaign 2025", status: "completed", sent: 1200, opened: 624, clicked: 198, replied: 87, leads: 500, steps: 6 },
];

const statusConfig: Record<string, { color: string; icon: typeof Play }> = {
  active: { color: "text-success bg-success/10", icon: Play },
  paused: { color: "text-warning bg-warning/10", icon: Pause },
  draft: { color: "text-muted-foreground bg-muted", icon: Clock },
  completed: { color: "text-primary bg-primary/10", icon: CheckCircle },
};

const emailTemplates = [
  { name: "Cold intro", subject: "Quick question about {{company}}", openRate: "42%" },
  { name: "Follow-up #1", subject: "Re: Quick question about {{company}}", openRate: "38%" },
  { name: "Value prop", subject: "How {{company}} can save 10hrs/week", openRate: "51%" },
  { name: "Break-up", subject: "Should I close your file?", openRate: "47%" },
];

export default function OutreachPage() {
  const [tab, setTab] = useState<"campaigns" | "templates" | "compose">("campaigns");

  return (
    <>
      <TopBar title="Outreach" />
      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* Tabs */}
        <div className="flex items-center gap-1 bg-secondary rounded-lg p-1 w-fit">
          {(["campaigns", "templates", "compose"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors capitalize ${
                tab === t
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === "campaigns" && (
          <div className="space-y-4">
            {/* Stats row */}
            <div className="grid grid-cols-4 gap-4">
              {[
                { icon: Mail, label: "Total Sent", value: "2,187" },
                { icon: Eye, label: "Avg Open Rate", value: "54.7%" },
                { icon: MousePointerClick, label: "Avg Click Rate", value: "16.3%" },
                { icon: CheckCircle, label: "Total Replies", value: "153" },
              ].map((stat) => (
                <div key={stat.label} className="bg-card rounded-xl p-4 border border-border shadow-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <stat.icon className="w-4 h-4 text-primary" />
                    <span className="text-xs text-muted-foreground">{stat.label}</span>
                  </div>
                  <p className="text-xl font-bold text-foreground">{stat.value}</p>
                </div>
              ))}
            </div>

            {/* Campaign list */}
            <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                <h3 className="font-bold text-foreground">Campaigns</h3>
                <button className="flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary-light transition-colors">
                  <Plus className="w-4 h-4" />
                  New Campaign
                </button>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-secondary/30">
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Campaign</th>
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Status</th>
                    <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Sent</th>
                    <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Opened</th>
                    <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Clicked</th>
                    <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Replied</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {campaigns.map((c) => {
                    const cfg = statusConfig[c.status];
                    return (
                      <tr key={c.id} className="hover:bg-secondary/20 transition-colors">
                        <td className="px-5 py-3.5">
                          <p className="text-sm font-semibold text-foreground">{c.name}</p>
                          <p className="text-xs text-muted-foreground">{c.leads} leads &middot; {c.steps} steps</p>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${cfg.color}`}>
                            <cfg.icon className="w-3 h-3" />
                            {c.status}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-sm text-foreground text-right">{c.sent.toLocaleString()}</td>
                        <td className="px-5 py-3.5 text-sm text-foreground text-right">{c.opened.toLocaleString()}</td>
                        <td className="px-5 py-3.5 text-sm text-foreground text-right">{c.clicked}</td>
                        <td className="px-5 py-3.5 text-sm text-foreground text-right">{c.replied}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === "templates" && (
          <div className="grid grid-cols-2 gap-4">
            {emailTemplates.map((tpl) => (
              <div key={tpl.name} className="bg-card rounded-xl p-5 border border-border shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-foreground">{tpl.name}</h4>
                  <span className="text-xs text-success font-medium">{tpl.openRate} open rate</span>
                </div>
                <p className="text-sm text-muted-foreground">{tpl.subject}</p>
                <div className="mt-4 flex gap-2">
                  <button className="px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary-light transition-colors">Edit</button>
                  <button className="px-3 py-1.5 text-xs border border-border rounded-md font-medium hover:bg-secondary transition-colors">Preview</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "compose" && (
          <div className="bg-card rounded-xl p-6 border border-border shadow-sm max-w-3xl">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-accent" />
              <h3 className="font-bold text-foreground">AI Email Composer</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground block mb-1">Describe what you want to say</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Follow up with Sarah about the demo we showed last week. Mention the 30% efficiency gains..."
                  className="w-full p-3 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1">Tone</label>
                  <select className="w-full p-2.5 text-sm bg-background border border-border rounded-lg">
                    <option>Professional</option>
                    <option>Friendly</option>
                    <option>Urgent</option>
                    <option>Casual</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1">Length</label>
                  <select className="w-full p-2.5 text-sm bg-background border border-border rounded-lg">
                    <option>Short (2-3 sentences)</option>
                    <option>Medium (1 paragraph)</option>
                    <option>Long (2-3 paragraphs)</option>
                  </select>
                </div>
              </div>
              <button className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary-light transition-colors">
                <Bot className="w-4 h-4" />
                Generate Email
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
