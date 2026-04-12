import { Resend } from "resend";
import { NextRequest, NextResponse } from "next/server";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const { to, subject, body, from } = await req.json();

    const { data, error } = await resend.emails.send({
      from: from || "Aiden Sales <sales@aidenos.com>",
      to: [to],
      subject,
      html: body,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ id: data?.id, success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Email send failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
