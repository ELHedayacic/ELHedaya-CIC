// Supabase Edge Function: list-profiles
// Lets an admin see every account's email + role side by side. `email`
// lives in the protected auth.users table, which the browser can never
// query directly — this function checks the caller is an admin, then
// uses the service role to join it with public.profiles.
//
// Deploy: supabase functions deploy list-profiles

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
      data: { user },
    } = await callerClient.auth.getUser();
    if (!user) return json({ error: "Not authenticated" }, 401);

    const { data: callerProfile } = await callerClient.from("profiles").select("role").eq("id", user.id).single();
    if (callerProfile?.role !== "admin" && callerProfile?.role !== "principal") {
      return json({ error: "Only admins can view the staff list" }, 403);
    }

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: profiles, error: profilesError } = await admin
      .from("profiles")
      .select("id, full_name, role, phone, created_at")
      .order("full_name");
    if (profilesError) return json({ error: profilesError.message }, 500);

    // auth.admin.listUsers() is paginated (default 50/page). Loop until
    // we've covered everyone, capped generously for a single congregation.
    const emailById = new Map<string, string>();
    for (let page = 1; page <= 20; page++) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
      if (error) return json({ error: error.message }, 500);
      data.users.forEach((u) => emailById.set(u.id, u.email ?? ""));
      if (data.users.length < 200) break;
    }

    const merged = (profiles ?? []).map((p) => ({ ...p, email: emailById.get(p.id) ?? "" }));

    return json({ profiles: merged });
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
