// Supabase Edge Function: send-family-email
// Lets any staff member (teacher/admin/principal) send a real email to
// families — all of them, one class, or one student — with an optional
// PDF/image attachment. Uses Resend's HTTP API directly (separate from the
// SMTP integration Supabase Auth uses for its own emails).
//
// Deploy: supabase functions deploy send-family-email
// Secrets: RESEND_API_KEY, RESEND_FROM_EMAIL (e.g. updates@mail.yourdomain.org)

import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const RESEND_FROM_EMAIL = Deno.env.get("RESEND_FROM_EMAIL")!;
const SCHOOL_NAME = "El Hedaya Islamic School";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MAX_ATTACHMENT_MB = 8;
const BCC_CHUNK_SIZE = 50; // recipients per Resend API call

interface EmailBody {
  subject: string;
  message: string;
  audience: "all" | "class" | "student";
  classId?: string;
  studentId?: string;
  attachment?: {
    filename: string;
    contentType: string;
    base64Data: string; // raw base64, no "data:...;base64," prefix
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Missing authorization header" }, 401);

    const callerClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user: sender },
    } = await callerClient.auth.getUser();
    if (!sender) return json({ error: "Not authenticated" }, 401);

    const { data: senderProfile } = await callerClient
      .from("profiles")
      .select("full_name, role")
      .eq("id", sender.id)
      .single();

    if (!senderProfile || senderProfile.role === "parent") {
      return json({ error: "Only staff can send email to families" }, 403);
    }

    const body: EmailBody = await req.json();
    if (!body.subject?.trim() || !body.message?.trim()) {
      return json({ error: "Subject and message are required" }, 400);
    }
    if (body.attachment) {
      const sizeBytes = (body.attachment.base64Data.length * 3) / 4;
      if (sizeBytes > MAX_ATTACHMENT_MB * 1024 * 1024) {
        return json({ error: `Attachment is too large — the limit is ${MAX_ATTACHMENT_MB}MB.` }, 400);
      }
    }

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Work out which parent ids we're emailing based on audience.
    let parentIds: string[] = [];
    if (body.audience === "all") {
      const { data } = await admin.from("profiles").select("id").eq("role", "parent");
      parentIds = (data ?? []).map((p) => p.id);
    } else if (body.audience === "class") {
      if (!body.classId) return json({ error: "classId is required for a class audience" }, 400);
      const { data } = await admin
        .from("student_classes")
        .select("students(parent_id)")
        .eq("class_id", body.classId);
      parentIds = [...new Set((data ?? []).map((sc: any) => sc.students?.parent_id).filter(Boolean))];
    } else if (body.audience === "student") {
      if (!body.studentId) return json({ error: "studentId is required for a student audience" }, 400);
      const { data } = await admin.from("students").select("parent_id").eq("id", body.studentId).single();
      if (data) parentIds = [data.parent_id];
    } else {
      return json({ error: "audience must be 'all', 'class', or 'student'" }, 400);
    }

    if (parentIds.length === 0) {
      return json({ error: "No families match that audience — nothing was sent." }, 400);
    }

    // Resolve parent ids to actual email addresses via the Auth admin API
    // (emails live in auth.users, not exposed elsewhere).
    const emailById = new Map<string, string>();
    for (let page = 1; page <= 20; page++) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
      if (error) return json({ error: error.message }, 500);
      data.users.forEach((u) => emailById.set(u.id, u.email ?? ""));
      if (data.users.length < 200) break;
    }
    const recipients = parentIds.map((id) => emailById.get(id)).filter((e): e is string => Boolean(e));

    if (recipients.length === 0) {
      return json({ error: "Couldn't find email addresses for that audience." }, 400);
    }

    const senderName = senderProfile.full_name || "A staff member";
    const html = renderEmailHtml(senderName, body.message);

    // BCC everyone so families never see each other's email addresses.
    // Chunked in case the audience is large.
    const chunks: string[][] = [];
    for (let i = 0; i < recipients.length; i += BCC_CHUNK_SIZE) {
      chunks.push(recipients.slice(i, i + BCC_CHUNK_SIZE));
    }

    let sentCount = 0;
    for (const chunk of chunks) {
      const payload: Record<string, unknown> = {
        from: `${senderName} via ${SCHOOL_NAME} <${RESEND_FROM_EMAIL}>`,
        reply_to: sender.email,
        to: RESEND_FROM_EMAIL, // visible "to" is the school address; real recipients are BCC'd
        bcc: chunk,
        subject: body.subject,
        html,
      };
      if (body.attachment) {
        payload.attachments = [
          {
            filename: body.attachment.filename,
            content: body.attachment.base64Data,
          },
        ];
      }

      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        return json(
          { error: errBody?.message ?? `Resend rejected the email (sent to ${sentCount} of ${recipients.length} so far)` },
          502
        );
      }
      sentCount += chunk.length;
    }

    return json({ success: true, recipientCount: sentCount });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : "Unknown error" }, 500);
  }
});

function renderEmailHtml(senderName: string, message: string): string {
  const safeMessage = message
    .split("\n")
    .map((line) => escapeHtml(line))
    .join("<br/>");

  return `
  <div style="font-family: -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 24px; background-color: #ffffff;">
    <p style="font-size: 13px; text-align:center; color:#8a9a90; margin: 0 0 24px; letter-spacing: 0.5px; text-transform: uppercase;">
      ${escapeHtml(SCHOOL_NAME)}
    </p>
    <p style="font-size: 15px; line-height: 1.7; color: #3A4A42; margin: 0 0 24px;">
      ${safeMessage}
    </p>
    <hr style="border: none; border-top: 1px solid #e6ece8; margin: 28px 0 16px;" />
    <p style="font-size: 13px; color: #8a9a90; margin: 0;">
      Sent by ${escapeHtml(senderName)} &middot; reply directly to this email to reach them.
    </p>
  </div>`;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
