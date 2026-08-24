// Supabase Edge Function: square-webhook
// Receives Square webhook events (payment.updated, refund.updated) and keeps
// the `payments` table in sync. Verifies the signature using your Square
// webhook signature key so the endpoint can't be spoofed.
//
// Deploy:  supabase functions deploy square-webhook --no-verify-jwt
// Secrets: supabase secrets set SQUARE_WEBHOOK_SIGNATURE_KEY=...
// Then register this function's URL as the webhook endpoint in the
// Square Developer Dashboard > Webhooks.

import { createClient } from "jsr:@supabase/supabase-js@2";

const SIGNATURE_KEY = Deno.env.get("SQUARE_WEBHOOK_SIGNATURE_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const NOTIFICATION_URL = Deno.env.get("SQUARE_WEBHOOK_URL") ?? ""; // full URL registered in Square dashboard

Deno.serve(async (req) => {
  const rawBody = await req.text();
  const signature = req.headers.get("x-square-hmacsha256-signature") ?? "";

  const isValid = await verifySignature(rawBody, signature);
  if (!isValid) {
    return new Response("Invalid signature", { status: 401 });
  }

  const event = JSON.parse(rawBody);
  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  if (event.type === "payment.updated") {
    const payment = event.data?.object?.payment;
    if (payment?.id) {
      await supabaseAdmin
        .from("payments")
        .update({
          status: payment.status === "COMPLETED" ? "completed" : payment.status === "FAILED" ? "failed" : "pending",
          square_receipt_url: payment.receipt_url,
        })
        .eq("square_payment_id", payment.id);
    }
  }

  if (event.type === "refund.updated") {
    const refund = event.data?.object?.refund;
    if (refund?.payment_id) {
      await supabaseAdmin
        .from("payments")
        .update({ status: "refunded" })
        .eq("square_payment_id", refund.payment_id);
    }
  }

  return new Response("ok", { status: 200 });
});

async function verifySignature(body: string, signature: string): Promise<boolean> {
  if (!SIGNATURE_KEY || !NOTIFICATION_URL) return true; // skip in local/dev if unset
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(SIGNATURE_KEY),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(NOTIFICATION_URL + body));
  const expected = btoa(String.fromCharCode(...new Uint8Array(mac)));
  return expected === signature;
}
