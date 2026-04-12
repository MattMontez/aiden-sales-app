"use client";

import { useEffect, useState, useCallback } from "react";
import TopBar from "@/components/TopBar";
import { supabase } from "@/lib/supabase-browser";
import { useAuth } from "@/lib/auth-context";
import {
  Users,
  DollarSign,
  Mail,
  TrendingUp,
  ArrowUpRight,
} from "lucide-react";

interface Lead {
  id: string;
  name: string;
  company: string;
  status: string;
  value: number;
  created_at: string;
}

const statusColor: Record<string, string> = {
  New: "bg-muted text-muted-foreground",
  Contacted: "bg-primary/10 text-primary",
  Qualified: "bg-accent/10 text-accent",
  Proposal: "bg-warning/10 text-warning",
  "Closed Won": "bg-success/10 text-success",
};

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false });
    setLeads(data || []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalLeads = leads.length;
  const totalPipeline = leads.reduce((sum, l) => sum + (l.value || 0), 0);
  const qualified = leads.filter((l) => l.status === "Qualified" || l.status === "Proposal").length;
  const conversionRate = totalLeads > 0 ? ((leads.filter((l) => l.status === "Closed Won").length / totalLeads) * 100).toFixed(1) : "0";

  const stages = ["New", "Contacted", "Qualified", "Proposal", "Closed Won"];
  const stageColors: Record<string, string> = {
    New: "bg-muted-foreground",
    Contacted: "bg-primary",
    Qualified: "bg-accent",
    Proposal: "bg-warning",
    "Closed Won": "bg-success",
  };

  const pipelineStages = stages.map((name) => {
    const stageLeads = leads.filter((l) => l.status === name);
    return {
      name,
      count: stageLeads.length,
      value: stageLeads.reduce((s, l) => s + (l.value || 0), 0),
      color: stageColors[name],
    };
  });

  const kpis = [
    { label: "Total Leads", value: totalLeads.toLocaleString(), icon: Users },
    { label: "Revenue Pipeline", value: `$${(totalPipeline / 1000).toFixed(0)}K`, icon: DollarSign },
    { label: "Qualified", value: qualified.toString(), icon: TrendingUp },
    { label: "Conversion Rate", value: `${conversionRate}%`, icon: Mail },
  ];

  return (
    <>
      <TopBar title="Dashboard" />
      <div className="flex-1 overflow-auto p-6 space-y-6">
        {loading ? (
          <div className="text-center text-muted-foreground py-12">Loading dashboard...</div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-4 gap-4">
              {kpis.map((kpi) => (
                <div key={kpi.label} className="bg-card rounded-xl p-5 border border-border shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-muted-foreground font-medium">{kpi.label}</span>
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                      <kpi.icon className="w-4.5 h-4.5 text-primary" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-6">
              {/* Pipeline Overview */}
              <div className="col-span-1 bg-card rounded-xl p-5 border border-border shadow-sm">
                <h3 className="font-bold text-foreground mb-4">Pipeline</h3>
                {totalLeads === 0 ? (
                  <p className="text-sm text-muted-foreground">Add leads to see your pipeline.</p>
                ) : (
                  <div className="space-y-3">
                    {pipelineStages.map((stage) => (
                      <div key={stage.name} className="flex items-center gap-3">
                        <div className={`w-2.5 h-2.5 rounded-full ${stage.color}`} />
                        <span className="text-sm text-foreground flex-1">{stage.name}</span>
                        <span className="text-xs text-muted-foreground">{stage.count}</span>
                        <span className="text-sm font-semibold text-foreground w-16 text-right">
                          ${(stage.value / 1000).toFixed(0)}K
                        </span>
                      </div>
                    ))}
                    <div className="mt-4 pt-4 border-t border-border flex justify-between">
                      <span className="text-sm text-muted-foreground">Total</span>
                      <span className="text-sm font-bold text-foreground">
                        ${(totalPipeline / 1000).toFixed(0)}K
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Recent Leads */}
              <div className="col-span-2 bg-card rounded-xl border border-border shadow-sm">
                <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                  <h3 className="font-bold text-foreground">Recent Leads</h3>
                </div>
                {leads.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground text-sm">
                    No leads yet. Go to the Leads page to add some.
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {leads.slice(0, 5).map((lead) => (
                      <div key={lead.id} className="px-5 py-3.5 flex items-center hover:bg-secondary/30 transition-colors">
                        <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold mr-3">
                          {lead.name[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground">{lead.name}</p>
                          <p className="text-xs text-muted-foreground">{lead.company}</p>
                        </div>
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColor[lead.status] || "bg-muted text-muted-foreground"}`}>
                          {lead.status}
                        </span>
                        <span className="text-sm font-semibold text-foreground w-20 text-right">
                          ${lead.value?.toLocaleString() || "0"}
                        </span>
                        <span className="text-xs text-muted-foreground w-16 text-right">
                          {timeAgo(lead.created_at)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
