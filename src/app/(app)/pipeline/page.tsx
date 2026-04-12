"use client";

import { useEffect, useState, useCallback } from "react";
import TopBar from "@/components/TopBar";
import { supabase } from "@/lib/supabase-browser";
import { useAuth } from "@/lib/auth-context";
import { MoreHorizontal, Plus } from "lucide-react";

interface Lead {
  id: string;
  name: string;
  company: string;
  value: number;
  status: string;
  score: number;
  created_at: string;
}

const stages = [
  { name: "New", color: "bg-muted-foreground" },
  { name: "Contacted", color: "bg-primary" },
  { name: "Qualified", color: "bg-accent" },
  { name: "Proposal", color: "bg-warning" },
  { name: "Closed Won", color: "bg-success" },
];

function daysInStage(created: string) {
  return Math.floor((Date.now() - new Date(created).getTime()) / 86400000);
}

export default function PipelinePage() {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

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

  const moveToStage = async (id: string, newStatus: string) => {
    await supabase.from("leads").update({ status: newStatus }).eq("id", id);
    fetchLeads();
  };

  if (loading) {
    return (
      <>
        <TopBar title="Pipeline" />
        <div className="flex-1 flex items-center justify-center text-muted-foreground">Loading...</div>
      </>
    );
  }

  return (
    <>
      <TopBar title="Pipeline" />
      <div className="flex-1 overflow-auto p-6">
        <div className="flex gap-4 min-w-max">
          {stages.map((stage) => {
            const stageLeads = leads.filter((l) => l.status === stage.name);
            const total = stageLeads.reduce((s, l) => s + (l.value || 0), 0);

            return (
              <div key={stage.name} className="w-72 shrink-0">
                {/* Column header */}
                <div className="flex items-center gap-2 mb-3 px-1">
                  <div className={`w-2.5 h-2.5 rounded-full ${stage.color}`} />
                  <h3 className="text-sm font-bold text-foreground">{stage.name}</h3>
                  <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                    {stageLeads.length}
                  </span>
                  <span className="text-xs font-semibold text-muted-foreground ml-auto">
                    ${(total / 1000).toFixed(0)}K
                  </span>
                </div>

                {/* Cards */}
                <div className="space-y-3">
                  {stageLeads.map((lead) => (
                    <div
                      key={lead.id}
                      className="bg-card rounded-lg p-4 border border-border shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                            {lead.name[0]}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-foreground">{lead.name}</p>
                            <p className="text-xs text-muted-foreground">{lead.company}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-sm font-bold text-foreground">
                          ${lead.value?.toLocaleString() || "0"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {daysInStage(lead.created_at)}d
                        </span>
                      </div>
                      {lead.score > 0 && (
                        <>
                          <div className="mt-2 h-1.5 bg-secondary rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full"
                              style={{ width: `${lead.score}%` }}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {lead.score} score
                          </p>
                        </>
                      )}
                      {/* Quick move buttons */}
                      <div className="mt-3 flex gap-1 flex-wrap">
                        {stages
                          .filter((s) => s.name !== stage.name)
                          .slice(0, 3)
                          .map((s) => (
                            <button
                              key={s.name}
                              onClick={() => moveToStage(lead.id, s.name)}
                              className="text-[10px] px-2 py-0.5 rounded border border-border hover:bg-secondary transition-colors text-muted-foreground"
                            >
                              → {s.name}
                            </button>
                          ))}
                      </div>
                    </div>
                  ))}

                  {stageLeads.length === 0 && (
                    <div className="py-8 text-center text-xs text-muted-foreground border-2 border-dashed border-border rounded-lg">
                      No leads
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
