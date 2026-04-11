"use client";

import { useState } from "react";
import TopBar from "@/components/TopBar";
import {
  Search,
  Filter,
  Download,
  MoreHorizontal,
  Mail,
  Phone,
  Globe,
  ChevronDown,
} from "lucide-react";

interface Lead {
  id: number;
  name: string;
  email: string;
  company: string;
  title: string;
  status: string;
  source: string;
  value: string;
  lastContact: string;
  score: number;
}

const leads: Lead[] = [
  { id: 1, name: "Sarah Chen", email: "sarah@techflow.io", company: "TechFlow Inc", title: "VP Engineering", status: "Qualified", source: "LinkedIn", value: "$45,000", lastContact: "2h ago", score: 92 },
  { id: 2, name: "Marcus Rivera", email: "marcus@datapulse.com", company: "DataPulse", title: "CTO", status: "Contacted", source: "Cold Email", value: "$28,000", lastContact: "4h ago", score: 78 },
  { id: 3, name: "Emily Tanaka", email: "emily@cloudsync.io", company: "CloudSync", title: "Head of Growth", status: "New", source: "Website", value: "$62,000", lastContact: "6h ago", score: 85 },
  { id: 4, name: "James O'Brien", email: "james@scaleuplabs.com", company: "ScaleUp Labs", title: "CEO", status: "Proposal", source: "Referral", value: "$95,000", lastContact: "1d ago", score: 95 },
  { id: 5, name: "Priya Sharma", email: "priya@nexgenai.com", company: "NexGen AI", title: "Director of Ops", status: "Qualified", source: "LinkedIn", value: "$37,000", lastContact: "1d ago", score: 71 },
  { id: 6, name: "David Kim", email: "david@brightpath.co", company: "BrightPath", title: "VP Sales", status: "New", source: "Conference", value: "$54,000", lastContact: "2d ago", score: 68 },
  { id: 7, name: "Laura Mitchell", email: "laura@greenleaf.io", company: "GreenLeaf Tech", title: "CMO", status: "Contacted", source: "Cold Email", value: "$41,000", lastContact: "2d ago", score: 82 },
  { id: 8, name: "Alex Thompson", email: "alex@solveit.com", company: "SolveIt", title: "Founder", status: "Qualified", source: "Website", value: "$78,000", lastContact: "3d ago", score: 88 },
];

const statusColor: Record<string, string> = {
  New: "bg-muted text-muted-foreground",
  Contacted: "bg-primary/10 text-primary",
  Qualified: "bg-accent/10 text-accent",
  Proposal: "bg-warning/10 text-warning",
  Closed: "bg-success/10 text-success",
};

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 90
      ? "text-success"
      : score >= 70
      ? "text-accent"
      : "text-muted-foreground";
  return <span className={`text-sm font-bold ${color}`}>{score}</span>;
}

export default function LeadsPage() {
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const toggle = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <>
      <TopBar title="Leads" />
      <div className="flex-1 overflow-auto p-6 space-y-4">
        {/* Toolbar */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search leads..."
              className="pl-9 pr-4 py-2 text-sm bg-card border border-border rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <button className="flex items-center gap-2 px-3 py-2 text-sm border border-border rounded-lg bg-card hover:bg-secondary transition-colors">
            <Filter className="w-4 h-4" />
            Filters
            <ChevronDown className="w-3 h-3" />
          </button>
          <button className="flex items-center gap-2 px-3 py-2 text-sm border border-border rounded-lg bg-card hover:bg-secondary transition-colors">
            <Download className="w-4 h-4" />
            Export
          </button>
          {selected.size > 0 && (
            <span className="text-sm text-muted-foreground">
              {selected.size} selected
            </span>
          )}
        </div>

        {/* Table */}
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="w-10 px-4 py-3">
                  <input type="checkbox" className="rounded" />
                </th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">
                  Contact
                </th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">
                  Company
                </th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">
                  Status
                </th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">
                  Source
                </th>
                <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">
                  Value
                </th>
                <th className="text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">
                  Score
                </th>
                <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {leads.map((lead) => (
                <tr
                  key={lead.id}
                  className={`hover:bg-secondary/20 transition-colors ${
                    selected.has(lead.id) ? "bg-primary/5" : ""
                  }`}
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.has(lead.id)}
                      onChange={() => toggle(lead.id)}
                      className="rounded"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold shrink-0">
                        {lead.name[0]}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {lead.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {lead.title}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground">
                    {lead.company}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColor[lead.status]}`}
                    >
                      {lead.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {lead.source}
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-foreground text-right">
                    {lead.value}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <ScoreBadge score={lead.score} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button className="p-1.5 rounded-md hover:bg-secondary transition-colors">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                      </button>
                      <button className="p-1.5 rounded-md hover:bg-secondary transition-colors">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                      </button>
                      <button className="p-1.5 rounded-md hover:bg-secondary transition-colors">
                        <Globe className="w-4 h-4 text-muted-foreground" />
                      </button>
                      <button className="p-1.5 rounded-md hover:bg-secondary transition-colors">
                        <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
