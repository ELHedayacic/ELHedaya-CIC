import { galleryBackendConfigured, supabase } from "./galleryService";

export const newsletterBackendConfigured = galleryBackendConfigured;

function requireBackend() {
  if (!supabase) throw new Error("Newsletter service is not configured yet.");
}

export async function subscribeToNewsletter(email) {
  requireBackend();
  const normalizedEmail = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    throw new Error("Enter a valid email address.");
  }

  const { data, error } = await supabase.rpc("subscribe_newsletter", { p_email: normalizedEmail });
  if (error) throw error;
  return data;
}

export async function unsubscribeFromNewsletter(token) {
  requireBackend();
  const { data, error } = await supabase.rpc("unsubscribe_newsletter", { p_token: token });
  if (error) throw error;
  return data;
}

export async function listNewsletterSubscribers() {
  requireBackend();
  const { data, error } = await supabase
    .from("newsletter_subscribers")
    .select("id,email,is_active,created_at,updated_at,unsubscribed_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function setNewsletterSubscriberActive(id, isActive) {
  requireBackend();
  const { error } = await supabase
    .from("newsletter_subscribers")
    .update({
      is_active: Boolean(isActive),
      unsubscribed_at: isActive ? null : new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw error;
}

export async function listNewsletterCampaigns() {
  requireBackend();
  const { data, error } = await supabase
    .from("newsletter_campaigns")
    .select("id,subject,headline,status,sent_count,failed_count,sent_at,created_at")
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) throw error;
  return data || [];
}

export async function sendNewsletter(payload) {
  requireBackend();

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;
  const accessToken = sessionData?.session?.access_token;
  if (!accessToken) throw new Error("Your administrator session has expired. Please sign in again.");

  const response = await fetch("/api/send-newsletter", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });

  let data = null;
  try {
    data = await response.json();
  } catch {
    // Keep a friendly fallback when an upstream platform returns non-JSON output.
  }

  if (!response.ok || !data?.ok) {
    throw new Error(data?.message || "Newsletter could not be sent.");
  }
  return data;
}
