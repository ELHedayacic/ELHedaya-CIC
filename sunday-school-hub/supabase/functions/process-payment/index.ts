// Supabase Edge Function: process-payment
// Takes a Square card nonce (sourceId) from the client, charges it via the
// Square Payments API using a server-side access token, then records the
// result in the `payments` table.
//
// Deploy:   supabase functions deploy process-payment
// Secrets:  supabase secrets set SQUARE_ACCESS_TOKEN=... SQUARE_LOCATION_ID=... SQUARE_ENV=sandbox
//
// Client calls this via supabase.functions.invoke("process-payment", { body: {...} })

import { createClient } from "jsr:@supabase/supabase-js@2";

const SQUARE_ACCESS_TOKEN = Deno.env.get("SQUARE_ACCESS_TOKEN")!;
const SQUARE_LOCATION_ID = Deno.env.get("SQUARE_LOCATION_ID")!;
const SQUARE_ENV = Deno.env.get("SQUARE_ENV") ?? "sandbox"; // "sandbox" | "production"
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const SQUARE_API_BASE =
  SQUARE_ENV === "production"
    ? "https://connect.squareup.com"
    : "https://connect.squareupsandbox.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ProcessPaymentBody {
  sourceId: string; // card nonce from Square Web Payments SDK
  amount: number; // dollars, e.g. 45.00
  studentId?: string | null;
  feeStructureId?: string | null;
  note?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json({ error: "Missing authorization header" }, 401);
    }

    // Client bound to the caller's JWT — used to identify who is paying.
    const supabaseUser = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userError,
    } = await supabaseUser.auth.getUser();

    if (userError || !user) {
      return json({ error: "Not authenticated" }, 401);
    }

    const body: ProcessPaymentBody = await req.json();
    if (!body.sourceId || !body.amount || body.amount <= 0) {
      return json({ error: "sourceId and a positive amount are required" }, 400);
    }

    const amountCents = Math.round(body.amount * 100);

    const squareRes = await fetch(`${SQUARE_API_BASE}/v2/payments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SQUARE_ACCESS_TOKEN}`,
        "Square-Version": "2025-01-23",
      },
      body: JSON.stringify({
        source_id: body.sourceId,
        idempotency_key: crypto.randomUUID(),
        amount_money: { amount: amountCents, currency: "USD" },
        location_id: SQUARE_LOCATION_ID,
        note: body.note ?? "Sunday School payment",
      }),
    });

    const squareData = await squareRes.json();

    // Service-role client to write the payment record regardless of RLS.
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    if (!squareRes.ok) {
      await supabaseAdmin.from("payments").insert({
        student_id: body.studentId ?? null,
        parent_id: user.id,
        fee_structure_id: body.feeStructureId ?? null,
        amount: body.amount,
        status: "failed",
      });
      return json({ error: squareData?.errors?.[0]?.detail ?? "Payment failed" }, 402);
    }

    const payment = squareData.payment;

    const { data: record, error: insertError } = await supabaseAdmin
      .from("payments")
      .insert({
        student_id: body.studentId ?? null,
        parent_id: user.id,
        fee_structure_id: body.feeStructureId ?? null,
        amount: body.amount,
        square_payment_id: payment?.id,
        square_receipt_url: payment?.receipt_url,
        status: payment?.status === "COMPLETED" ? "completed" : "pending",
      })
      .select()
      .single();

    if (insertError) {
      return json({ error: insertError.message }, 500);
    }

    return json({ success: true, payment: record });
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
