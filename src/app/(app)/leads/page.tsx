"use client";

import { useState, useEffect, useCallback } from "react";
import TopBar from "@/components/TopBar";
import { supabase } from "@/lib/supabase-browser";
import { useAuth } from "@/lib/auth-context";
import {
  Search,
  Mail,
  X,
  Plus,
  MessageSquare,
  Phone,
  Calendar,
  Zap,
  ArrowRight,
  Send,
  FileText,
  Upload,
  Download,
} from "lucide-react";

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  title: string;
  status: string;
  source: string;
  value: number;
  score: number;
  notes: string;
  last_contact_at: string | null;
  created_at: string;
}

interface Activity {
  id: string;
  type: string;
  description: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

const statusColor: Record<string, string> = {
  New: "bg-muted text-muted-foreground",
  Contacted: "bg-primary/10 text-primary",
  Qualified: "bg-accent/10 text-accent",
  Proposal: "bg-warning/10 text-warning",
  "Closed Won": "bg-success/10 text-success",
  "Closed Lost": "bg-destructive/10 text-destructive",
};

const activityIcons: Record<string, typeof Mail> = {
  email: Mail,
  call: Phone,
  meeting: Calendar,
  note: FileText,
  status_change: ArrowRight,
  ai_action: Zap,
};

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 90 ? "text-success" : score >= 70 ? "text-accent" : "text-muted-foreground";
  return <span className={`text-sm font-bold ${color}`}>{score}</span>;
}

function timeAgo(date: string | null) {
  if (!date) return "—";
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function LeadsPage() {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showAdd, setShowAdd] = useState(false);
  const [newLead, setNewLead] = useState({
    name: "",
    email: "",
    company: "",
    title: "",
    source: "",
    value: 0,
    score: 50,
  });

  // Detail panel
  const [detailLead, setDetailLead] = useState<Lead | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [importCount, setImportCount] = useState(0);

  const fetchLeads = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false });
    setLeads(data || []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const openDetail = async (lead: Lead) => {
    setDetailLead(lead);
    setActivityLoading(true);
    setNewNote("");
    const { data } = await supabase
      .from("activity_log")
      .select("*")
      .eq("lead_id", lead.id)
      .order("created_at", { ascending: false })
      .limit(50);
    setActivities(data || []);
    setActivityLoading(false);
  };

  const addNote = async () => {
    if (!newNote.trim() || !detailLead || !user) return;
    await supabase.from("activity_log").insert({
      lead_id: detailLead.id,
      user_id: user.id,
      type: "note",
      description: newNote,
    });
    setNewNote("");
    // Refresh activities
    const { data } = await supabase
      .from("activity_log")
      .select("*")
      .eq("lead_id", detailLead.id)
      .order("created_at", { ascending: false })
      .limit(50);
    setActivities(data || []);
  };

  const addLead = async () => {
    if (!newLead.name || !user) return;
    await supabase.from("leads").insert({
      ...newLead,
      status: "New",
      user_id: user.id,
    });
    setNewLead({ name: "", email: "", company: "", title: "", source: "", value: 0, score: 50 });
    setShowAdd(false);
    fetchLeads();
  };

  const deleteLead = async (id: string) => {
    await supabase.from("leads").delete().eq("id", id);
    if (detailLead?.id === id) setDetailLead(null);
    fetchLeads();
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("leads").update({ status }).eq("id", id);
    if (detailLead?.id === id) {
      setDetailLead({ ...detailLead, status });
    }
    fetchLeads();
  };

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // CSV Export
  const exportCSV = () => {
    const headers = ["Name", "Email", "Phone", "Company", "Title", "Status", "Source", "Value", "Score"];
    const rows = leads.map((l) => [
      l.name, l.email || "", l.phone || "", l.company || "", l.title || "",
      l.status, l.source || "", l.value?.toString() || "0", l.score?.toString() || "0",
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${(c || "").replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `aiden-leads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // CSV Import
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const text = await file.text();
    const lines = text.split("\n").filter((l) => l.trim());
    if (lines.length < 2) return;

    // Parse header row
    const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, "").toLowerCase());
    const nameIdx = headers.findIndex((h) => h.includes("name"));
    const emailIdx = headers.findIndex((h) => h.includes("email"));
    const phoneIdx = headers.findIndex((h) => h.includes("phone"));
    const companyIdx = headers.findIndex((h) => h.includes("company"));
    const titleIdx = headers.findIndex((h) => h.includes("title"));
    const sourceIdx = headers.findIndex((h) => h.includes("source"));
    const valueIdx = headers.findIndex((h) => h.includes("value"));
    const scoreIdx = headers.findIndex((h) => h.includes("score"));

    if (nameIdx === -1) {
      alert("CSV must have a 'Name' column");
      return;
    }

    const newLeads = [];
    for (let i = 1; i < lines.length; i++) {
      // Simple CSV parsing (handles quoted fields)
      const cols: string[] = [];
      let current = "";
      let inQuotes = false;
      for (const char of lines[i]) {
        if (char === '"') { inQuotes = !inQuotes; }
        else if (char === "," && !inQuotes) { cols.push(current.trim()); current = ""; }
        else { current += char; }
      }
      cols.push(current.trim());

      const name = cols[nameIdx];
      if (!name) continue;

      newLeads.push({
        name,
        email: emailIdx >= 0 ? cols[emailIdx] || null : null,
        phone: phoneIdx >= 0 ? cols[phoneIdx] || null : null,
        company: companyIdx >= 0 ? cols[companyIdx] || null : null,
        title: titleIdx >= 0 ? cols[titleIdx] || null : null,
        source: sourceIdx >= 0 ? cols[sourceIdx] || "CSV Import" : "CSV Import",
        value: valueIdx >= 0 ? Number(cols[valueIdx]) || 0 : 0,
        score: scoreIdx >= 0 ? Number(cols[scoreIdx]) || 0 : 0,
        status: "New",
        user_id: user.id,
      });
    }

    if (newLeads.length > 0) {
      await supabase.from("leads").insert(newLeads);
      setImportCount(newLeads.length);
      setTimeout(() => setImportCount(0), 5000);
      fetchLeads();
    }

    // Reset the file input
    e.target.value = "";
  };

  const filtered = leads.filter(
    (l) =>
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.company?.toLowerCase().includes(search.toLowerCase()) ||
      l.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <TopBar title="Leads" />
      <div className="flex-1 flex overflow-hidden">
        {/* Main table */}
        <div className={`flex-1 overflow-auto p-6 space-y-4 transition-all ${detailLead ? "pr-0" : ""}`}>
          {/* Toolbar */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search leads..."
                className="pl-9 pr-4 py-2 text-sm bg-card border border-border rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary-light transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Lead
            </button>
            <label className="flex items-center gap-2 px-3 py-2 border border-border rounded-lg text-sm font-medium text-foreground hover:bg-secondary transition-colors cursor-pointer">
              <Upload className="w-4 h-4" />
              Import CSV
              <input type="file" accept=".csv" onChange={handleImport} className="hidden" />
            </label>
            <button
              onClick={exportCSV}
              className="flex items-center gap-2 px-3 py-2 border border-border rounded-lg text-sm font-medium text-foreground hover:bg-secondary transition-colors"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
            <span className="text-sm text-muted-foreground">{filtered.length} leads</span>
            {importCount > 0 && (
              <span className="text-sm text-success font-medium">Imported {importCount} leads!</span>
            )}
          </div>

          {/* Add Lead Form */}
          {showAdd && (
            <div className="bg-card rounded-xl p-5 border border-border shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-foreground">Add New Lead</h3>
                <button onClick={() => setShowAdd(false)}>
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <input placeholder="Name *" value={newLead.name} onChange={(e) => setNewLead({ ...newLead, name: e.target.value })} className="p-2.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30" />
                <input placeholder="Email" value={newLead.email} onChange={(e) => setNewLead({ ...newLead, email: e.target.value })} className="p-2.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30" />
                <input placeholder="Company" value={newLead.company} onChange={(e) => setNewLead({ ...newLead, company: e.target.value })} className="p-2.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30" />
                <input placeholder="Title" value={newLead.title} onChange={(e) => setNewLead({ ...newLead, title: e.target.value })} className="p-2.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30" />
                <input placeholder="Source" value={newLead.source} onChange={(e) => setNewLead({ ...newLead, source: e.target.value })} className="p-2.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30" />
                <input placeholder="Deal value" type="number" value={newLead.value || ""} onChange={(e) => setNewLead({ ...newLead, value: Number(e.target.value) })} className="p-2.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <button onClick={addLead} className="mt-3 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary-light transition-colors">Save Lead</button>
            </div>
          )}

          {/* Table */}
          <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">Loading leads...</div>
            ) : filtered.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                {leads.length === 0 ? 'No leads yet. Click "Add Lead" to get started.' : "No leads match your search."}
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-secondary/30">
                    <th className="w-10 px-4 py-3"><input type="checkbox" className="rounded" /></th>
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">Contact</th>
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">Company</th>
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">Status</th>
                    <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">Value</th>
                    <th className="text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">Score</th>
                    <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((lead) => (
                    <tr
                      key={lead.id}
                      onClick={() => openDetail(lead)}
                      className={`hover:bg-secondary/20 transition-colors cursor-pointer ${
                        selected.has(lead.id) ? "bg-primary/5" : ""
                      } ${detailLead?.id === lead.id ? "bg-primary/10" : ""}`}
                    >
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <input type="checkbox" checked={selected.has(lead.id)} onChange={() => toggle(lead.id)} className="rounded" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold shrink-0">
                            {lead.name[0]}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-foreground">{lead.name}</p>
                            <p className="text-xs text-muted-foreground">{lead.title || lead.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-foreground">{lead.company}</td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={lead.status}
                          onChange={(e) => updateStatus(lead.id, e.target.value)}
                          className={`text-xs font-medium px-2.5 py-1 rounded-full border-0 cursor-pointer ${statusColor[lead.status] || "bg-muted text-muted-foreground"}`}
                        >
                          {["New", "Contacted", "Qualified", "Proposal", "Closed Won", "Closed Lost"].map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-foreground text-right">${lead.value?.toLocaleString() || "0"}</td>
                      <td className="px-4 py-3 text-center"><ScoreBadge score={lead.score || 0} /></td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          {lead.email && (
                            <button className="p-1.5 rounded-md hover:bg-secondary transition-colors">
                              <Mail className="w-4 h-4 text-muted-foreground" />
                            </button>
                          )}
                          <button onClick={() => deleteLead(lead.id)} className="p-1.5 rounded-md hover:bg-destructive/10 transition-colors">
                            <X className="w-4 h-4 text-destructive" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Detail Panel */}
        {detailLead && (
          <div className="w-96 border-l border-border bg-card overflow-auto shrink-0">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <h3 className="font-bold text-foreground">Lead Details</h3>
              <button onClick={() => setDetailLead(null)} className="p-1 hover:bg-secondary rounded">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {/* Contact info */}
            <div className="p-5 border-b border-border space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center text-lg font-bold">
                  {detailLead.name[0]}
                </div>
                <div>
                  <p className="font-bold text-foreground">{detailLead.name}</p>
                  <p className="text-sm text-muted-foreground">{detailLead.title}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Company</p>
                  <p className="text-foreground font-medium">{detailLead.company}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Value</p>
                  <p className="text-foreground font-bold">${detailLead.value?.toLocaleString() || "0"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Score</p>
                  <p className="text-foreground font-bold">{detailLead.score}/100</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Source</p>
                  <p className="text-foreground">{detailLead.source || "—"}</p>
                </div>
                {detailLead.email && (
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="text-foreground">{detailLead.email}</p>
                  </div>
                )}
                {detailLead.phone && (
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground">Phone</p>
                    <p className="text-foreground">{detailLead.phone}</p>
                  </div>
                )}
              </div>

              <div>
                <p className="text-xs text-muted-foreground">Status</p>
                <select
                  value={detailLead.status}
                  onChange={(e) => updateStatus(detailLead.id, e.target.value)}
                  className={`text-xs font-medium px-2.5 py-1 rounded-full border-0 mt-1 ${statusColor[detailLead.status] || "bg-muted text-muted-foreground"}`}
                >
                  {["New", "Contacted", "Qualified", "Proposal", "Closed Won", "Closed Lost"].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Add note */}
            <div className="p-5 border-b border-border">
              <p className="text-sm font-bold text-foreground mb-2">Add Note</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addNote()}
                  placeholder="Type a note..."
                  className="flex-1 px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <button
                  onClick={addNote}
                  disabled={!newNote.trim()}
                  className="p-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary-light transition-colors disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Activity Timeline */}
            <div className="p-5">
              <p className="text-sm font-bold text-foreground mb-3">Activity Timeline</p>
              {activityLoading ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : activities.length === 0 ? (
                <p className="text-sm text-muted-foreground">No activity yet. Add a note or interact with this lead.</p>
              ) : (
                <div className="space-y-3">
                  {activities.map((act) => {
                    const Icon = activityIcons[act.type] || MessageSquare;
                    return (
                      <div key={act.id} className="flex gap-3">
                        <div className="mt-0.5 w-7 h-7 rounded-full bg-secondary flex items-center justify-center shrink-0">
                          <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground">{act.description}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {timeAgo(act.created_at)} · {act.type}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
