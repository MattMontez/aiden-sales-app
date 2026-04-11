"use client";

import TopBar from "@/components/TopBar";
import {
  Users,
  DollarSign,
  Mail,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

const kpis = [
  {
    label: "Total Leads",
    value: "2,847",
    change: "+12.5%",
    up: true,
    icon: Users,
  },
  {
    label: "Revenue Pipeline",
    value: "$482K",
    change: "+8.2%",
    up: true,
    icon: DollarSign,
  },
  {
    label: "Emails Sent",
    value: "1,234",
    change: "+24.1%",
    up: true,
    icon: Mail,
  },
  {
    label: "Conversion Rate",
    value: "3.2%",
    change: "-0.4%",
    up: false,
    icon: TrendingUp,
  },
];

const recentLeads = [
  { name: "Sarah Chen", company: "TechFlow Inc", status: "Qualified", value: "$45,000", date: "2h ago" },
  { name: "Marcus Rivera", company: "DataPulse", status: "Contacted", value: "$28,000", date: "4h ago" },
  { name: "Emily Tanaka", company: "CloudSync", status: "New", value: "$62,000", date: "6h ago" },
  { name: "James O'Brien", company: "ScaleUp Labs", status: "Proposal", value: "$95,000", date: "1d ago" },
  { name: "Priya Sharma", company: "NexGen AI", status: "Qualified", value: "$37,000", date: "1d ago" },
];

const pipelineStages = [
  { name: "New", count: 42, value: "$186K", color: "bg-muted-foreground" },
  { name: "Contacted", count: 28, value: "$124K", color: "bg-primary" },
  { name: "Qualified", count: 19, value: "$98K", color: "bg-accent" },
  { name: "Proposal", count: 8, value: "$52K", color: "bg-warning" },
  { name: "Closed", count: 5, value: "$22K", color: "bg-success" },
];

const statusColor: Record<string, string> = {
  New: "bg-muted text-muted-foreground",
  Contacted: "bg-primary/10 text-primary",
  Qualified: "bg-accent/10 text-accent",
  Proposal: "bg-warning/10 text-warning",
};

export default function DashboardPage() {
  return (
    <>
      <TopBar title="Dashboard" />
      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-4 gap-4">
          {kpis.map((kpi) => (
            <div
              key={kpi.label}
              className="bg-card rounded-xl p-5 border border-border shadow-sm"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-muted-foreground font-medium">
                  {kpi.label}
                </span>
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <kpi.icon className="w-4.5 h-4.5 text-primary" />
                </div>
              </div>
              <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
              <div className="flex items-center gap-1 mt-1">
                {kpi.up ? (
                  <ArrowUpRight className="w-4 h-4 text-success" />
                ) : (
                  <ArrowDownRight className="w-4 h-4 text-destructive" />
                )}
                <span
                  className={`text-sm font-medium ${
                    kpi.up ? "text-success" : "text-destructive"
                  }`}
                >
                  {kpi.change}
                </span>
                <span className="text-xs text-muted-foreground ml-1">
                  vs last month
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Pipeline Overview */}
          <div className="col-span-1 bg-card rounded-xl p-5 border border-border shadow-sm">
            <h3 className="font-bold text-foreground mb-4">Pipeline</h3>
            <div className="space-y-3">
              {pipelineStages.map((stage) => (
                <div key={stage.name} className="flex items-center gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full ${stage.color}`} />
                  <span className="text-sm text-foreground flex-1">
                    {stage.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {stage.count}
                  </span>
                  <span className="text-sm font-semibold text-foreground w-16 text-right">
                    {stage.value}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-border flex justify-between">
              <span className="text-sm text-muted-foreground">Total</span>
              <span className="text-sm font-bold text-foreground">$482K</span>
            </div>
          </div>

          {/* Recent Leads */}
          <div className="col-span-2 bg-card rounded-xl border border-border shadow-sm">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <h3 className="font-bold text-foreground">Recent Leads</h3>
              <button className="text-sm text-primary font-medium hover:underline">
                View all
              </button>
            </div>
            <div className="divide-y divide-border">
              {recentLeads.map((lead) => (
                <div
                  key={lead.name}
                  className="px-5 py-3.5 flex items-center hover:bg-secondary/30 transition-colors"
                >
                  <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold mr-3">
                    {lead.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">
                      {lead.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {lead.company}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColor[lead.status]}`}
                  >
                    {lead.status}
                  </span>
                  <span className="text-sm font-semibold text-foreground w-20 text-right">
                    {lead.value}
                  </span>
                  <span className="text-xs text-muted-foreground w-16 text-right">
                    {lead.date}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* AI Activity */}
        <div className="bg-card rounded-xl p-5 border border-border shadow-sm">
          <h3 className="font-bold text-foreground mb-4">AI Agent Activity</h3>
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: "Emails drafted", value: "47", sub: "today" },
              { label: "Leads researched", value: "23", sub: "today" },
              { label: "Follow-ups sent", value: "18", sub: "today" },
              { label: "Meetings booked", value: "6", sub: "this week" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="text-center p-4 rounded-lg bg-primary/5"
              >
                <p className="text-3xl font-bold text-primary">{stat.value}</p>
                <p className="text-sm text-foreground font-medium mt-1">
                  {stat.label}
                </p>
                <p className="text-xs text-muted-foreground">{stat.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
