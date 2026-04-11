"use client";

import TopBar from "@/components/TopBar";
import { User, Key, Bell, Globe, Zap, Shield } from "lucide-react";

const sections = [
  {
    icon: User,
    title: "Profile",
    description: "Manage your account details",
    fields: [
      { label: "Full Name", value: "Matt Montez", type: "text" },
      { label: "Email", value: "matt@mbcgroup.ai", type: "email" },
      { label: "Company", value: "MBC Group", type: "text" },
    ],
  },
  {
    icon: Key,
    title: "API Keys",
    description: "Connect external services",
    fields: [
      { label: "OpenAI API Key", value: "sk-...7x9f", type: "password" },
      { label: "SendGrid API Key", value: "SG-...m2k1", type: "password" },
    ],
  },
  {
    icon: Globe,
    title: "Integrations",
    description: "Connected platforms",
    integrations: [
      { name: "Gmail", status: "Connected", connected: true },
      { name: "LinkedIn", status: "Connected", connected: true },
      { name: "HubSpot", status: "Not connected", connected: false },
      { name: "Salesforce", status: "Not connected", connected: false },
    ],
  },
];

export default function SettingsPage() {
  return (
    <>
      <TopBar title="Settings" />
      <div className="flex-1 overflow-auto p-6 max-w-3xl space-y-6">
        {/* Profile */}
        <div className="bg-card rounded-xl p-6 border border-border shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-foreground">Profile</h3>
              <p className="text-xs text-muted-foreground">Manage your account details</p>
            </div>
          </div>
          <div className="space-y-4">
            {sections[0].fields!.map((f) => (
              <div key={f.label}>
                <label className="text-sm font-medium text-foreground block mb-1">{f.label}</label>
                <input
                  type={f.type}
                  defaultValue={f.value}
                  className="w-full p-2.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            ))}
            <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary-light transition-colors">
              Save Changes
            </button>
          </div>
        </div>

        {/* API Keys */}
        <div className="bg-card rounded-xl p-6 border border-border shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Key className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-foreground">API Keys</h3>
              <p className="text-xs text-muted-foreground">Connect AI and email services</p>
            </div>
          </div>
          <div className="space-y-4">
            {sections[1].fields!.map((f) => (
              <div key={f.label}>
                <label className="text-sm font-medium text-foreground block mb-1">{f.label}</label>
                <input
                  type={f.type}
                  defaultValue={f.value}
                  className="w-full p-2.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Integrations */}
        <div className="bg-card rounded-xl p-6 border border-border shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Globe className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-foreground">Integrations</h3>
              <p className="text-xs text-muted-foreground">Connected platforms</p>
            </div>
          </div>
          <div className="space-y-3">
            {sections[2].integrations!.map((i) => (
              <div key={i.name} className="flex items-center justify-between p-3 rounded-lg border border-border">
                <div>
                  <p className="text-sm font-semibold text-foreground">{i.name}</p>
                  <p className={`text-xs ${i.connected ? "text-success" : "text-muted-foreground"}`}>{i.status}</p>
                </div>
                <button
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    i.connected
                      ? "border border-border hover:bg-secondary"
                      : "bg-primary text-primary-foreground hover:bg-primary-light"
                  }`}
                >
                  {i.connected ? "Disconnect" : "Connect"}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-card rounded-xl p-6 border border-border shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Bell className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-foreground">Notifications</h3>
              <p className="text-xs text-muted-foreground">Control what alerts you get</p>
            </div>
          </div>
          <div className="space-y-3">
            {[
              { label: "New lead replies", on: true },
              { label: "Campaign milestones", on: true },
              { label: "AI agent summaries", on: false },
              { label: "Weekly pipeline report", on: true },
            ].map((n) => (
              <div key={n.label} className="flex items-center justify-between py-2">
                <span className="text-sm text-foreground">{n.label}</span>
                <div
                  className={`w-10 h-5.5 rounded-full p-0.5 cursor-pointer transition-colors ${
                    n.on ? "bg-primary" : "bg-muted"
                  }`}
                >
                  <div
                    className={`w-4.5 h-4.5 rounded-full bg-white shadow transition-transform ${
                      n.on ? "translate-x-4.5" : ""
                    }`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
