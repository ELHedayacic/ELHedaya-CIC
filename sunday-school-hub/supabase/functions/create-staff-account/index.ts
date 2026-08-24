// Supabase Edge Function: create-staff-account
// Lets an admin create a teacher/admin/principal account directly with a
// temporary password they choose — no invite email involved at all. The
// account is created with must_change_password = true, so the app forces
// a password change the moment they first log in. This exists because
// email-based invites proved unreliable in practice (deliverability,
// spam filters, staff unfamiliar with "click the link" flows) — handing
// someone a password in person or by text is simpler and just as secure,
// since they're required to change it before doing anything else.
//
// Deploy: supabase functions deploy create-staff-account

import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateStaffBody {
  email: string;
  fullName: string;
  role: "teacher" | "admin" | "principal";
  password: string;
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
      data: { user: caller },
    } = await callerClient.auth.getUser();
    if (!caller) return json({ error: "Not authenticated" }, 401);

    const { data: callerProfile } = await callerClient.from("profiles").select("role").eq("id", caller.id).single();
    if (callerProfile?.role !== "admin" && callerProfile?.role !== "principal") {
      return json({ error: "Only admins can create staff accounts" }, 403);
    }

    const body: CreateStaffBody = await req.json();
    if (!body.email || !body.fullName || !body.role || !body.password) {
      return json({ error: "email, fullName, role, and password are required" }, 400);
    }
    if (body.role !== "teacher" && body.role !== "admin" && body.role !== "principal") {
      return json({ error: "role must be 'teacher', 'admin', or 'principal'" }, 400);
    }
    if (body.password.length < 6) {
      return json({ error: "Password must be at least 6 characters" }, 400);
    }

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // email_confirm: true — no confirmation email either, since we're not
    // relying on email at all for this flow. full_name goes into user
    // metadata so the profile-creation trigger picks it up automatically.
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email: body.email,
      password: body.password,
      email_confirm: true,
      user_metadata: { full_name: body.fullName },
    });

    if (createError) {
      const friendly = createError.message.toLowerCase().includes("already registered")
        ? "That email already has an account. Use the role dropdown on the Staff or Families page instead of creating a new one."
        : createError.message;
      return json({ error: friendly }, 400);
    }

    const newUserId = created.user?.id;
    if (!newUserId) {
      return json({ error: "Account created, but couldn't confirm it — check Supabase Auth users." }, 500);
    }

    // Set the real role and force a password change on first login. The
    // trigger creates the profile as 'parent' by default; this uses the
    // service role so it bypasses RLS entirely, never trusting anything
    // the client sent for authorization purposes.
    const { error: updateError } = await admin
      .from("profiles")
      .update({ role: body.role, must_change_password: true })
      .eq("id", newUserId);

    if (updateError) {
      return json({ error: `Account created, but setting up access failed: ${updateError.message}` }, 500);
    }

    return json({ success: true });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : "Unknown error" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
