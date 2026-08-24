// Supabase Edge Function: delete-staff
// Permanently removes an account. Deleting the auth.users row cascades to
// delete their profiles row automatically (profiles.id references
// auth.users(id) on delete cascade); migration 0006 makes sure their past
// activity (homework created, attendance marked, etc.) survives unattributed
// rather than blocking the delete.
//
// Deploy: supabase functions deploy delete-staff

import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
      return json({ error: "Only admins can remove accounts" }, 403);
    }

    const { targetId } = await req.json();
    if (!targetId) return json({ error: "targetId is required" }, 400);

    if (targetId === caller.id) {
      return json({ error: "You can't remove your own account. Have another admin do it." }, 400);
    }

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: target } = await admin.from("profiles").select("role, full_name").eq("id", targetId).single();
    if (!target) return json({ error: "Account not found" }, 404);

    if (target.role === "admin" || target.role === "principal") {
      const { count } = await admin
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .in("role", ["admin", "principal"]);
      if ((count ?? 0) <= 1) {
        return json({ error: "You can't remove the last remaining admin/principal — promote someone else first." }, 400);
      }
    }

    const { error: deleteError } = await admin.auth.admin.deleteUser(targetId);
    if (deleteError) return json({ error: deleteError.message }, 500);

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
