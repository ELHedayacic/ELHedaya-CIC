// Supabase Edge Function: invite-staff
// Lets an admin create a brand-new teacher or admin account by email.
// Supabase sends that person an invite email with a link; clicking it logs
// them in and lands them on /set-password to choose their own password —
// nobody ever has to hand a password to anyone.
//
// Deploy: supabase functions deploy invite-staff

import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InviteBody {
  email: string;
  fullName: string;
  role: "teacher" | "admin" | "principal";
  redirectTo: string; // e.g. https://yourapp.com/set-password — built client-side from window.location.origin
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
      return json({ error: "Only admins can invite staff accounts" }, 403);
    }

    const body: InviteBody = await req.json();
    if (!body.email || !body.fullName || !body.role) {
      return json({ error: "email, fullName, and role are required" }, 400);
    }
    if (body.role !== "teacher" && body.role !== "admin" && body.role !== "principal") {
      return json({ error: "role must be 'teacher', 'admin', or 'principal'" }, 400);
    }

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Creates the auth user AND sends Supabase's built-in invite email.
    // full_name goes into user metadata so the profile-creation trigger
    // (0002_profile_trigger.sql) picks it up automatically.
    const { data: inviteData, error: inviteError } = await admin.auth.admin.inviteUserByEmail(body.email, {
      data: { full_name: body.fullName },
      redirectTo: body.redirectTo,
    });

    if (inviteError) {
      const friendly = inviteError.message.toLowerCase().includes("already registered")
        ? "That email already has an account. Use the role dropdown below to change their access instead of inviting them again."
        : inviteError.message;
      return json({ error: friendly }, 400);
    }

    const newUserId = inviteData.user?.id;
    if (!newUserId) {
      return json({ error: "Invite sent, but couldn't confirm the new account — check Supabase Auth users." }, 500);
    }

    // The trigger creates the profile as 'parent' by default; set the real
    // role here with the service role, which bypasses RLS entirely — this
    // never trusts client-supplied role data, only this server-side call.
    const { error: roleError } = await admin.from("profiles").update({ role: body.role }).eq("id", newUserId);
    if (roleError) {
      return json({ error: `Invite sent, but setting the role failed: ${roleError.message}` }, 500);
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
