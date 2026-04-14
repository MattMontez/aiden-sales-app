"use client";

import { useState, useEffect, useCallback } from "react";
import TopBar from "@/components/TopBar";
import { supabase } from "@/lib/supabase-browser";
import { useAuth } from "@/lib/auth-context";
import {
  Play,
  Pause,
  Mail,
  Clock,
  CheckCircle,
  Eye,
  MousePointerClick,
  Plus,
  Bot,
  Sparkles,
  X,
  Trash2,
  Send,
  Loader2,
} from "lucide-react";

interface Campaign {
  id: string;
  name: string;
  status: "active" | "paused" | "draft" | "completed";
  steps: number;
  created_at: string;
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
}

interface CampaignEmail {
  status: string;
}

const statusConfig: Record<string, { color: string; icon: typeof Play }> = {
  active: { color: "text-success bg-success/10", icon: Play },
  paused: { color: "text-warning bg-warning/10", icon: Pause },
  draft: { color: "text-muted-foreground bg-muted", icon: Clock },
  completed: { color: "text-primary bg-primary/10", icon: CheckCircle },
};

export default function OutreachPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"campaigns" | "templates" | "compose">("campaigns");
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [emails, setEmails] = useState<CampaignEmail[]>([]);
  const [loading, setLoading] = useState(true);

  // New campaign form
  const [showNewCampaign, setShowNewCampaign] = useState(false);
  const [newCampaignName, setNewCampaignName] = useState("");

  // New template form
  const [showNewTemplate, setShowNewTemplate] = useState(false);
  const [tplName, setTplName] = useState("");
  const [tplSubject, setTplSubject] = useState("");
  const [tplBody, setTplBody] = useState("");

  // AI Composer
  const [composePrompt, setComposePrompt] = useState("");
  const [composeTone, setComposeTone] = useState("Professional");
  const [composeLength, setComposeLength] = useState("Short (2-3 sentences)");
  const [composeTo, setComposeTo] = useState("");
  const [composeResult, setComposeResult] = useState({ subject: "", body: "" });
  const [composeLoading, setComposeLoading] = useState(false);
  const [sendLoading, setSendLoading] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user) return;

    const [campaignRes, templateRes, emailRes] = await Promise.all([
      supabase.from("campaigns").select("*").order("created_at", { ascending: false }),
      supabase.from("email_templates").select("*").order("created_at", { ascending: false }),
      supabase.from("campaign_emails").select("status"),
    ]);

    setCampaigns(campaignRes.data || []);
    setTemplates(templateRes.data || []);
    setEmails(emailRes.data || []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Stats from real emails
  const totalSent = emails.filter((e) => e.status !== "pending").length;
  const totalOpened = emails.filter((e) => e.status === "opened" || e.status === "clicked" || e.status === "replied").length;
  const totalClicked = emails.filter((e) => e.status === "clicked" || e.status === "replied").length;
  const totalReplied = emails.filter((e) => e.status === "replied").length;
  const openRate = totalSent > 0 ? ((totalOpened / totalSent) * 100).toFixed(1) : "0";
  const clickRate = totalSent > 0 ? ((totalClicked / totalSent) * 100).toFixed(1) : "0";

  const createCampaign = async () => {
    if (!newCampaignName.trim()) return;
    await supabase.from("campaigns").insert({
      name: newCampaignName,
      status: "draft",
      steps: 1,
      user_id: user?.id,
    });
    setNewCampaignName("");
    setShowNewCampaign(false);
    fetchData();
  };

  const toggleCampaignStatus = async (campaign: Campaign) => {
    const newStatus = campaign.status === "active" ? "paused" : campaign.status === "paused" ? "active" : "active";
    await supabase.from("campaigns").update({ status: newStatus }).eq("id", campaign.id);
    fetchData();
  };

  const deleteCampaign = async (id: string) => {
    await supabase.from("campaigns").delete().eq("id", id);
    fetchData();
  };

  const createTemplate = async () => {
    if (!tplName.trim() || !tplSubject.trim() || !tplBody.trim()) return;
    await supabase.from("email_templates").insert({
      name: tplName,
      subject: tplSubject,
      body: tplBody,
      user_id: user?.id,
    });
    setTplName("");
    setTplSubject("");
    setTplBody("");
    setShowNewTemplate(false);
    fetchData();
  };

  const deleteTemplate = async (id: string) => {
    await supabase.from("email_templates").delete().eq("id", id);
    fetchData();
  };

  const generateEmail = async () => {
    if (!composePrompt.trim()) return;
    setComposeLoading(true);
    setSendSuccess(false);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: `Write a sales email with these specs:
- Description: ${composePrompt}
- Tone: ${composeTone}
- Length: ${composeLength}

Return ONLY the email in this exact format:
SUBJECT: [subject line]
BODY: [email body in HTML with <p> tags]

Do not include any other text or explanation.`,
            },
          ],
          accessToken: session?.access_token,
        }),
      });

      const data = await res.json();
      if (data.content) {
        const subjectMatch = data.content.match(/SUBJECT:\s*(.+?)(?:\n|BODY:)/);
        const bodyMatch = data.content.match(/BODY:\s*([\s\S]+)/);
        setComposeResult({
          subject: subjectMatch?.[1]?.trim() || "Follow up",
          body: bodyMatch?.[1]?.trim() || data.content,
        });
      }
    } catch {
      setComposeResult({ subject: "Error", body: "Failed to generate email. Try again." });
    }

    setComposeLoading(false);
  };

  const sendComposedEmail = async () => {
    if (!composeTo.trim() || !composeResult.subject) return;
    setSendLoading(true);

    try {
      const res = await fetch("/api/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: composeTo,
          subject: composeResult.subject,
          body: composeResult.body,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSendSuccess(true);
      }
    } catch {
      // silent fail
    }

    setSendLoading(false);
  };

  if (loading) {
    return (
      <>
        <TopBar title="Outreach" />
        <div className="flex-1 flex items-center justify-center text-muted-foreground">Loading...</div>
      </>
    );
  }

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

        {/* ====== CAMPAIGNS TAB ====== */}
        {tab === "campaigns" && (
          <div className="space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-4 gap-4">
              {[
                { icon: Mail, label: "Total Sent", value: totalSent.toLocaleString() },
                { icon: Eye, label: "Open Rate", value: `${openRate}%` },
                { icon: MousePointerClick, label: "Click Rate", value: `${clickRate}%` },
                { icon: CheckCircle, label: "Replies", value: totalReplied.toLocaleString() },
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
                <button
                  onClick={() => setShowNewCampaign(true)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary-light transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  New Campaign
                </button>
              </div>

              {/* New campaign inline form */}
              {showNewCampaign && (
                <div className="px-5 py-3 border-b border-border bg-secondary/20 flex items-center gap-3">
                  <input
                    type="text"
                    value={newCampaignName}
                    onChange={(e) => setNewCampaignName(e.target.value)}
                    placeholder="Campaign name..."
                    autoFocus
                    className="flex-1 px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                    onKeyDown={(e) => e.key === "Enter" && createCampaign()}
                  />
                  <button
                    onClick={createCampaign}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary-light"
                  >
                    Create
                  </button>
                  <button
                    onClick={() => setShowNewCampaign(false)}
                    className="p-2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {campaigns.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-sm">
                  No campaigns yet. Create one to start reaching out.
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-secondary/30">
                      <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">
                        Campaign
                      </th>
                      <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">
                        Status
                      </th>
                      <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">
                        Steps
                      </th>
                      <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {campaigns.map((c) => {
                      const cfg = statusConfig[c.status] || statusConfig.draft;
                      return (
                        <tr key={c.id} className="hover:bg-secondary/20 transition-colors">
                          <td className="px-5 py-3.5">
                            <p className="text-sm font-semibold text-foreground">{c.name}</p>
                            <p className="text-xs text-muted-foreground">
                              Created {new Date(c.created_at).toLocaleDateString()}
                            </p>
                          </td>
                          <td className="px-5 py-3.5">
                            <span
                              className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${cfg.color}`}
                            >
                              <cfg.icon className="w-3 h-3" />
                              {c.status}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-sm text-foreground text-right">{c.steps}</td>
                          <td className="px-5 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => toggleCampaignStatus(c)}
                                className="text-xs px-2.5 py-1 rounded border border-border hover:bg-secondary transition-colors text-muted-foreground"
                              >
                                {c.status === "active" ? "Pause" : "Activate"}
                              </button>
                              <button
                                onClick={() => deleteCampaign(c.id)}
                                className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ====== TEMPLATES TAB ====== */}
        {tab === "templates" && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button
                onClick={() => setShowNewTemplate(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary-light transition-colors"
              >
                <Plus className="w-4 h-4" />
                New Template
              </button>
            </div>

            {/* New template form */}
            {showNewTemplate && (
              <div className="bg-card rounded-xl p-5 border border-border shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-foreground">New Template</h4>
                  <button onClick={() => setShowNewTemplate(false)} className="text-muted-foreground hover:text-foreground">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <input
                  type="text"
                  value={tplName}
                  onChange={(e) => setTplName(e.target.value)}
                  placeholder="Template name (e.g. Cold intro)"
                  className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <input
                  type="text"
                  value={tplSubject}
                  onChange={(e) => setTplSubject(e.target.value)}
                  placeholder="Subject line (use {{company}} for merge tags)"
                  className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <textarea
                  value={tplBody}
                  onChange={(e) => setTplBody(e.target.value)}
                  rows={6}
                  placeholder="Email body (use {{name}}, {{company}} for merge tags)"
                  className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                />
                <button
                  onClick={createTemplate}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary-light"
                >
                  Save Template
                </button>
              </div>
            )}

            {templates.length === 0 && !showNewTemplate ? (
              <div className="bg-card rounded-xl p-8 border border-border text-center text-muted-foreground text-sm">
                No templates yet. Create one to speed up your outreach.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {templates.map((tpl) => (
                  <div
                    key={tpl.id}
                    className="bg-card rounded-xl p-5 border border-border shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold text-foreground">{tpl.name}</h4>
                      <button
                        onClick={() => deleteTemplate(tpl.id)}
                        className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{tpl.subject}</p>
                    <p className="text-xs text-muted-foreground line-clamp-3">{tpl.body}</p>
                    <div className="mt-3">
                      <button
                        onClick={() => {
                          setComposeResult({ subject: tpl.subject, body: tpl.body });
                          setTab("compose");
                        }}
                        className="px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary-light transition-colors"
                      >
                        Use Template
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ====== COMPOSE TAB ====== */}
        {tab === "compose" && (
          <div className="max-w-3xl space-y-4">
            {/* AI Generator */}
            <div className="bg-card rounded-xl p-6 border border-border shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-accent" />
                <h3 className="font-bold text-foreground">AI Email Composer</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1">
                    Describe what you want to say
                  </label>
                  <textarea
                    rows={3}
                    value={composePrompt}
                    onChange={(e) => setComposePrompt(e.target.value)}
                    placeholder="e.g. Follow up with Sarah about the demo we showed last week. Mention the 30% efficiency gains..."
                    className="w-full p-3 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-1">Tone</label>
                    <select
                      value={composeTone}
                      onChange={(e) => setComposeTone(e.target.value)}
                      className="w-full p-2.5 text-sm bg-background border border-border rounded-lg"
                    >
                      <option>Professional</option>
                      <option>Friendly</option>
                      <option>Urgent</option>
                      <option>Casual</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-1">Length</label>
                    <select
                      value={composeLength}
                      onChange={(e) => setComposeLength(e.target.value)}
                      className="w-full p-2.5 text-sm bg-background border border-border rounded-lg"
                    >
                      <option>Short (2-3 sentences)</option>
                      <option>Medium (1 paragraph)</option>
                      <option>Long (2-3 paragraphs)</option>
                    </select>
                  </div>
                </div>
                <button
                  onClick={generateEmail}
                  disabled={composeLoading || !composePrompt.trim()}
                  className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary-light transition-colors disabled:opacity-50"
                >
                  {composeLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Bot className="w-4 h-4" />
                      Generate Email
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Generated email preview + send */}
            {composeResult.subject && (
              <div className="bg-card rounded-xl p-6 border border-border shadow-sm">
                <h4 className="font-bold text-foreground mb-3">Generated Email</h4>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-muted-foreground">To</label>
                    <input
                      type="email"
                      value={composeTo}
                      onChange={(e) => setComposeTo(e.target.value)}
                      placeholder="recipient@company.com"
                      className="w-full px-3 py-2 mt-1 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Subject</label>
                    <input
                      type="text"
                      value={composeResult.subject}
                      onChange={(e) => setComposeResult((prev) => ({ ...prev, subject: e.target.value }))}
                      className="w-full px-3 py-2 mt-1 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Body</label>
                    <textarea
                      rows={8}
                      value={composeResult.body}
                      onChange={(e) => setComposeResult((prev) => ({ ...prev, body: e.target.value }))}
                      className="w-full px-3 py-2 mt-1 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={sendComposedEmail}
                      disabled={sendLoading || !composeTo.trim() || sendSuccess}
                      className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary-light transition-colors disabled:opacity-50"
                    >
                      {sendLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Sending...
                        </>
                      ) : sendSuccess ? (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          Sent!
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Send Email
                        </>
                      )}
                    </button>
                    <button
                      onClick={generateEmail}
                      disabled={composeLoading}
                      className="px-4 py-2.5 text-sm border border-border rounded-lg font-medium hover:bg-secondary transition-colors"
                    >
                      Regenerate
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
