import { createServerSupabase } from "@/lib/supabase-server";

// ---- Tool Definitions (sent to Claude) ----

export const toolDefinitions = [
  {
    name: "search_leads",
    description:
      "Search the user's leads database. Can filter by name, company, status, or return all leads. Returns up to 20 results.",
    input_schema: {
      type: "object" as const,
      properties: {
        query: {
          type: "string",
          description:
            "Optional search text to match against lead name or company",
        },
        status: {
          type: "string",
          enum: [
            "New",
            "Contacted",
            "Qualified",
            "Proposal",
            "Closed Won",
            "Closed Lost",
          ],
          description: "Optional filter by pipeline stage",
        },
      },
      required: [],
    },
  },
  {
    name: "get_lead_details",
    description:
      "Get full details for a specific lead by their ID, including activity history.",
    input_schema: {
      type: "object" as const,
      properties: {
        lead_id: { type: "string", description: "The UUID of the lead" },
      },
      required: ["lead_id"],
    },
  },
  {
    name: "create_lead",
    description:
      "Add a new lead to the database. Returns the created lead. Always confirm what you created.",
    input_schema: {
      type: "object" as const,
      properties: {
        name: { type: "string", description: "Contact name" },
        email: { type: "string", description: "Email address" },
        phone: { type: "string", description: "Phone number" },
        company: { type: "string", description: "Company name" },
        title: { type: "string", description: "Job title" },
        value: { type: "number", description: "Estimated deal value in dollars" },
        score: {
          type: "number",
          description: "Lead score 0-100 (higher = more likely to close)",
        },
        source: {
          type: "string",
          description: "How they found us (e.g. referral, website, cold outreach)",
        },
        notes: { type: "string", description: "Any notes about this lead" },
      },
      required: ["name", "company"],
    },
  },
  {
    name: "update_lead",
    description:
      "Update fields on an existing lead. Only include fields you want to change.",
    input_schema: {
      type: "object" as const,
      properties: {
        lead_id: { type: "string", description: "The UUID of the lead to update" },
        name: { type: "string" },
        email: { type: "string" },
        phone: { type: "string" },
        company: { type: "string" },
        title: { type: "string" },
        status: {
          type: "string",
          enum: [
            "New",
            "Contacted",
            "Qualified",
            "Proposal",
            "Closed Won",
            "Closed Lost",
          ],
        },
        value: { type: "number" },
        score: { type: "number" },
        notes: { type: "string" },
      },
      required: ["lead_id"],
    },
  },
  {
    name: "get_pipeline_summary",
    description:
      "Get a summary of the sales pipeline: count and total value per stage, overall stats.",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  {
    name: "send_email",
    description:
      "Send an email through the Aiden Sales platform. Use this when the user asks you to email someone. Always confirm before sending.",
    input_schema: {
      type: "object" as const,
      properties: {
        to: { type: "string", description: "Recipient email address" },
        subject: { type: "string", description: "Email subject line" },
        body: {
          type: "string",
          description: "Email body in HTML format. Keep it clean and professional.",
        },
        lead_id: {
          type: "string",
          description: "Optional lead UUID to log this email against",
        },
      },
      required: ["to", "subject", "body"],
    },
  },
  {
    name: "add_note",
    description: "Add a note or log an activity on a lead's timeline.",
    input_schema: {
      type: "object" as const,
      properties: {
        lead_id: { type: "string", description: "The UUID of the lead" },
        note: { type: "string", description: "The note or activity description" },
        type: {
          type: "string",
          enum: ["note", "call", "meeting", "email"],
          description: "Type of activity (default: note)",
        },
      },
      required: ["lead_id", "note"],
    },
  },
];

// ---- Tool Executors ----

export async function executeTool(
  toolName: string,
  input: Record<string, unknown>,
  userId: string
): Promise<string> {
  const db = createServerSupabase();

  switch (toolName) {
    case "search_leads": {
      let query = db
        .from("leads")
        .select("id, name, email, company, title, status, value, score, source, notes, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20);

      if (input.status) {
        query = query.eq("status", input.status as string);
      }
      if (input.query) {
        const search = input.query as string;
        query = query.or(`name.ilike.%${search}%,company.ilike.%${search}%`);
      }

      const { data, error } = await query;
      if (error) return JSON.stringify({ error: error.message });
      if (!data || data.length === 0) return JSON.stringify({ message: "No leads found.", leads: [] });
      return JSON.stringify({ count: data.length, leads: data });
    }

    case "get_lead_details": {
      const { data: lead, error } = await db
        .from("leads")
        .select("*")
        .eq("id", input.lead_id as string)
        .eq("user_id", userId)
        .single();

      if (error || !lead) return JSON.stringify({ error: "Lead not found" });

      const { data: activities } = await db
        .from("activity_log")
        .select("*")
        .eq("lead_id", input.lead_id as string)
        .order("created_at", { ascending: false })
        .limit(10);

      return JSON.stringify({ lead, recent_activities: activities || [] });
    }

    case "create_lead": {
      const leadData: Record<string, unknown> = {
        user_id: userId,
        name: input.name,
        company: input.company,
      };
      if (input.email) leadData.email = input.email;
      if (input.phone) leadData.phone = input.phone;
      if (input.title) leadData.title = input.title;
      if (input.value !== undefined) leadData.value = input.value;
      if (input.score !== undefined) leadData.score = input.score;
      if (input.source) leadData.source = input.source;
      if (input.notes) leadData.notes = input.notes;

      const { data, error } = await db.from("leads").insert(leadData).select().single();
      if (error) return JSON.stringify({ error: error.message });

      // Log the creation
      await db.from("activity_log").insert({
        lead_id: data.id,
        user_id: userId,
        type: "ai_action",
        description: `Lead created by Aiden AI`,
      });

      return JSON.stringify({ success: true, lead: data });
    }

    case "update_lead": {
      const updates: Record<string, unknown> = {};
      const fields = ["name", "email", "phone", "company", "title", "status", "value", "score", "notes"];
      for (const f of fields) {
        if (input[f] !== undefined) updates[f] = input[f];
      }

      if (Object.keys(updates).length === 0) {
        return JSON.stringify({ error: "No fields to update" });
      }

      const { data, error } = await db
        .from("leads")
        .update(updates)
        .eq("id", input.lead_id as string)
        .eq("user_id", userId)
        .select()
        .single();

      if (error) return JSON.stringify({ error: error.message });

      // Log the update
      await db.from("activity_log").insert({
        lead_id: input.lead_id as string,
        user_id: userId,
        type: input.status ? "status_change" : "ai_action",
        description: `Updated by Aiden AI: ${Object.keys(updates).join(", ")}`,
        metadata: updates,
      });

      return JSON.stringify({ success: true, lead: data });
    }

    case "get_pipeline_summary": {
      const { data: leads, error } = await db
        .from("leads")
        .select("status, value, score")
        .eq("user_id", userId);

      if (error) return JSON.stringify({ error: error.message });
      if (!leads || leads.length === 0) {
        return JSON.stringify({ message: "No leads in pipeline yet.", stages: [] });
      }

      const stages = ["New", "Contacted", "Qualified", "Proposal", "Closed Won", "Closed Lost"];
      const summary = stages.map((stage) => {
        const stageLeads = leads.filter((l) => l.status === stage);
        return {
          stage,
          count: stageLeads.length,
          total_value: stageLeads.reduce((s, l) => s + (l.value || 0), 0),
          avg_score: stageLeads.length > 0
            ? Math.round(stageLeads.reduce((s, l) => s + (l.score || 0), 0) / stageLeads.length)
            : 0,
        };
      });

      const totalLeads = leads.length;
      const totalValue = leads.reduce((s, l) => s + (l.value || 0), 0);
      const wonLeads = leads.filter((l) => l.status === "Closed Won");
      const conversionRate = totalLeads > 0 ? ((wonLeads.length / totalLeads) * 100).toFixed(1) : "0";

      return JSON.stringify({
        total_leads: totalLeads,
        total_pipeline_value: totalValue,
        conversion_rate: `${conversionRate}%`,
        stages: summary,
      });
    }

    case "send_email": {
      try {
        const { Resend } = await import("resend");
        const resend = new Resend(process.env.RESEND_API_KEY);
        const { data, error } = await resend.emails.send({
          from: "Aiden Sales <sales@aidenos.com>",
          to: [input.to as string],
          subject: input.subject as string,
          html: input.body as string,
        });

        if (error) return JSON.stringify({ error: (error as { message: string }).message });

        // Log the email activity
        if (input.lead_id) {
          await db.from("activity_log").insert({
            lead_id: input.lead_id as string,
            user_id: userId,
            type: "email",
            description: `Email sent: "${input.subject}"`,
            metadata: { to: input.to, subject: input.subject, resend_id: data?.id },
          });

          // Update last_contact_at
          await db
            .from("leads")
            .update({ last_contact_at: new Date().toISOString() })
            .eq("id", input.lead_id as string);
        }

        return JSON.stringify({ success: true, email_id: data?.id });
      } catch (err) {
        return JSON.stringify({ error: err instanceof Error ? err.message : "Failed to send email" });
      }
    }

    case "add_note": {
      const { error } = await db.from("activity_log").insert({
        lead_id: input.lead_id as string,
        user_id: userId,
        type: (input.type as string) || "note",
        description: input.note as string,
      });

      if (error) return JSON.stringify({ error: error.message });
      return JSON.stringify({ success: true });
    }

    default:
      return JSON.stringify({ error: `Unknown tool: ${toolName}` });
  }
}
