"use client";

import TopBar from "@/components/TopBar";
import { MoreHorizontal, Plus } from "lucide-react";

interface Deal {
  id: number;
  name: string;
  company: string;
  value: string;
  probability: number;
  daysInStage: number;
  avatar: string;
}

interface Stage {
  name: string;
  color: string;
  deals: Deal[];
  total: string;
}

const stages: Stage[] = [
  {
    name: "New Leads",
    color: "bg-muted-foreground",
    total: "$186K",
    deals: [
      { id: 1, name: "Emily Tanaka", company: "CloudSync", value: "$62,000", probability: 20, daysInStage: 1, avatar: "E" },
      { id: 2, name: "David Kim", company: "BrightPath", value: "$54,000", probability: 15, daysInStage: 3, avatar: "D" },
      { id: 3, name: "Lisa Wong", company: "Aperture AI", value: "$70,000", probability: 10, daysInStage: 0, avatar: "L" },
    ],
  },
  {
    name: "Contacted",
    color: "bg-primary",
    total: "$124K",
    deals: [
      { id: 4, name: "Marcus Rivera", company: "DataPulse", value: "$28,000", probability: 35, daysInStage: 5, avatar: "M" },
      { id: 5, name: "Laura Mitchell", company: "GreenLeaf", value: "$41,000", probability: 40, daysInStage: 3, avatar: "L" },
      { id: 6, name: "Tom Baker", company: "SwiftOps", value: "$55,000", probability: 30, daysInStage: 7, avatar: "T" },
    ],
  },
  {
    name: "Qualified",
    color: "bg-accent",
    total: "$160K",
    deals: [
      { id: 7, name: "Sarah Chen", company: "TechFlow", value: "$45,000", probability: 60, daysInStage: 8, avatar: "S" },
      { id: 8, name: "Priya Sharma", company: "NexGen AI", value: "$37,000", probability: 55, daysInStage: 4, avatar: "P" },
      { id: 9, name: "Alex Thompson", company: "SolveIt", value: "$78,000", probability: 65, daysInStage: 6, avatar: "A" },
    ],
  },
  {
    name: "Proposal",
    color: "bg-warning",
    total: "$95K",
    deals: [
      { id: 10, name: "James O'Brien", company: "ScaleUp Labs", value: "$95,000", probability: 80, daysInStage: 12, avatar: "J" },
    ],
  },
  {
    name: "Closed Won",
    color: "bg-success",
    total: "$22K",
    deals: [
      { id: 11, name: "Nina Patel", company: "ArcVentures", value: "$22,000", probability: 100, daysInStage: 0, avatar: "N" },
    ],
  },
];

function DealCard({ deal }: { deal: Deal }) {
  return (
    <div className="bg-card rounded-lg p-4 border border-border shadow-sm hover:shadow-md transition-shadow cursor-grab">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
            {deal.avatar}
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{deal.name}</p>
            <p className="text-xs text-muted-foreground">{deal.company}</p>
          </div>
        </div>
        <button className="p-1 rounded hover:bg-secondary">
          <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>
      <div className="flex items-center justify-between mt-3">
        <span className="text-sm font-bold text-foreground">{deal.value}</span>
        <span className="text-xs text-muted-foreground">
          {deal.daysInStage}d in stage
        </span>
      </div>
      <div className="mt-2 h-1.5 bg-secondary rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all"
          style={{ width: `${deal.probability}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground mt-1">
        {deal.probability}% probability
      </p>
    </div>
  );
}

export default function PipelinePage() {
  return (
    <>
      <TopBar title="Pipeline" />
      <div className="flex-1 overflow-auto p-6">
        <div className="flex gap-4 min-w-max">
          {stages.map((stage) => (
            <div key={stage.name} className="w-72 shrink-0">
              {/* Column header */}
              <div className="flex items-center gap-2 mb-3 px-1">
                <div className={`w-2.5 h-2.5 rounded-full ${stage.color}`} />
                <h3 className="text-sm font-bold text-foreground">
                  {stage.name}
                </h3>
                <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                  {stage.deals.length}
                </span>
                <span className="text-xs font-semibold text-muted-foreground ml-auto">
                  {stage.total}
                </span>
              </div>

              {/* Cards */}
              <div className="space-y-3">
                {stage.deals.map((deal) => (
                  <DealCard key={deal.id} deal={deal} />
                ))}

                {/* Add deal button */}
                <button className="w-full py-2 border-2 border-dashed border-border rounded-lg text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-1">
                  <Plus className="w-4 h-4" />
                  Add deal
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
