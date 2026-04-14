"use client";

import { useState, useEffect } from "react";
import TopBar from "@/components/TopBar";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase-browser";
import { User, Key, Bell, Globe, Shield, CheckCircle, Loader2 } from "lucide-react";

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const [fullName, setFullName] = useState("");
  const [company, setCompany] = useState("MBC Group");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Password change
  const [newPassword, setNewPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);

  // Notification toggles
  const [notifications, setNotifications] = useState({
    leadReplies: true,
    campaignMilestones: true,
    aiSummaries: false,
    weeklyReport: true,
  });

  useEffect(() => {
    if (user) {
      setFullName(user.user_metadata?.full_name || user.email?.split("@")[0] || "");
      setCompany(user.user_metadata?.company || "MBC Group");
    }
  }, [user]);

  const saveProfile = async () => {
    setSaving(true);
    setSaved(false);
    await supabase.auth.updateUser({
      data: { full_name: fullName, company },
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const changePassword = async () => {
    if (!newPassword || newPassword.length < 6) return;
    setPasswordSaving(true);
    setPasswordSaved(false);
    await supabase.auth.updateUser({ password: newPassword });
    setNewPassword("");
    setPasswordSaving(false);
    setPasswordSaved(true);
    setTimeout(() => setPasswordSaved(false), 3000);
  };

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  };

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
              <p className="text-xs text-muted-foreground">Your account details</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full p-2.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">Email</label>
              <input
                type="email"
                value={user?.email || ""}
                disabled
                className="w-full p-2.5 text-sm bg-secondary border border-border rounded-lg text-muted-foreground"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">Company</label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full p-2.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <button
              onClick={saveProfile}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary-light transition-colors disabled:opacity-50"
            >
              {saving ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
              ) : saved ? (
                <><CheckCircle className="w-4 h-4" /> Saved!</>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </div>

        {/* Security */}
        <div className="bg-card rounded-xl p-6 border border-border shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-foreground">Security</h3>
              <p className="text-xs text-muted-foreground">Password and account security</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 6 characters"
                className="w-full p-2.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <button
              onClick={changePassword}
              disabled={passwordSaving || newPassword.length < 6}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary-light transition-colors disabled:opacity-50"
            >
              {passwordSaving ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Updating...</>
              ) : passwordSaved ? (
                <><CheckCircle className="w-4 h-4" /> Updated!</>
              ) : (
                "Update Password"
              )}
            </button>
          </div>
        </div>

        {/* App Info */}
        <div className="bg-card rounded-xl p-6 border border-border shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Key className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-foreground">Connected Services</h3>
              <p className="text-xs text-muted-foreground">Active integrations powering your app</p>
            </div>
          </div>
          <div className="space-y-3">
            {[
              { name: "Supabase", desc: "Database & Authentication", connected: true },
              { name: "Claude AI", desc: "AI Sales Agent", connected: true },
              { name: "Resend", desc: "Email sending", connected: true },
            ].map((svc) => (
              <div key={svc.name} className="flex items-center justify-between p-3 rounded-lg border border-border">
                <div>
                  <p className="text-sm font-semibold text-foreground">{svc.name}</p>
                  <p className="text-xs text-muted-foreground">{svc.desc}</p>
                </div>
                <span className="text-xs font-medium text-success bg-success/10 px-2.5 py-1 rounded-full">Connected</span>
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
            {([
              { key: "leadReplies" as const, label: "New lead replies" },
              { key: "campaignMilestones" as const, label: "Campaign milestones" },
              { key: "aiSummaries" as const, label: "AI agent summaries" },
              { key: "weeklyReport" as const, label: "Weekly pipeline report" },
            ]).map((n) => (
              <div key={n.key} className="flex items-center justify-between py-2">
                <span className="text-sm text-foreground">{n.label}</span>
                <button
                  onClick={() => toggleNotification(n.key)}
                  className={`w-10 h-6 rounded-full p-0.5 transition-colors ${
                    notifications[n.key] ? "bg-primary" : "bg-muted"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${
                      notifications[n.key] ? "translate-x-4" : ""
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Sign Out */}
        <div className="pb-8">
          <button
            onClick={signOut}
            className="px-4 py-2 text-sm font-medium text-destructive border border-destructive/30 rounded-lg hover:bg-destructive/10 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    </>
  );
}
