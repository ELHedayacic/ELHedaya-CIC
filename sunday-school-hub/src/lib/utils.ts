import { type ClassValue, clsx } from "clsx";
import { supabase } from "@/lib/supabase";
import type { AnnouncementAudience } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

export function formatDate(dateStr: string | null | undefined, opts?: Intl.DateTimeFormatOptions) {
  if (!dateStr) return "—";
  const d = new Date(dateStr.includes("T") ? dateStr : `${dateStr}T00:00:00`);
  return d.toLocaleDateString("en-US", opts ?? { month: "short", day: "numeric", year: "numeric" });
}

export function formatTime(timeStr: string | null | undefined) {
  if (!timeStr) return "—";
  const [h, m] = timeStr.split(":");
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:${m} ${ampm}`;
}

export function initials(first: string, last: string) {
  return `${first?.[0] ?? ""}${last?.[0] ?? ""}`.toUpperCase();
}

export function age(dob: string) {
  const birth = new Date(dob);
  const diff = Date.now() - birth.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
}

// supabase.functions.invoke()'s error object only contains a generic
// "Edge Function returned a non-2xx status code" message by default — the
// actual reason the function sent back (bad token, duplicate email, not
// authorized, etc.) lives in the raw HTTP response body, which this pulls
// out instead. Shared by every Edge-Function-calling feature in the app.
export async function extractFunctionErrorMessage(fnError: unknown): Promise<string> {
  const fallback = fnError instanceof Error ? fnError.message : "Something went wrong";
  try {
    const context = (fnError as { context?: Response })?.context;
    if (context && typeof context.json === "function") {
      const body = await context.clone().json();
      if (body?.error) return body.error as string;
    }
  } catch {
    // fall through to the generic message below
  }
  return fallback;
}

// Uploads a file to a Supabase Storage bucket with basic client-side
// validation, returning its public URL. Used for homework attachments
// today; only works for buckets actually marked public in Supabase — a
// private bucket's getPublicUrl() output looks valid but 403s, since that
// endpoint only serves public buckets. For private buckets, use
// uploadToPrivateBucket below instead.
export async function uploadToBucket(
  bucket: string,
  file: File,
  opts?: { maxSizeMB?: number; allowedTypePrefixes?: string[]; pathPrefix?: string }
): Promise<{ url: string; path: string }> {
  const maxSizeMB = opts?.maxSizeMB ?? 10;
  if (file.size > maxSizeMB * 1024 * 1024) {
    throw new Error(`"${file.name}" is too large — the limit is ${maxSizeMB}MB.`);
  }
  if (opts?.allowedTypePrefixes && !opts.allowedTypePrefixes.some((t) => file.type.startsWith(t))) {
    throw new Error(`"${file.name}" isn't a supported file type.`);
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = opts?.pathPrefix ? `${opts.pathPrefix}/${Date.now()}-${safeName}` : `${Date.now()}-${safeName}`;

  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return { url: data.publicUrl, path };
}

// Same validation and upload as above, but for a private bucket: returns
// only the storage path, since there's no working public URL to hand
// back. Resolve the path to something viewable with a signed URL at
// display time (see useSignedPhotoUrl). `pathPrefix` scopes the file
// under a folder — e.g. a student's id — so Storage RLS policies can
// check ownership from the path itself.
export async function uploadToPrivateBucket(
  bucket: string,
  file: File,
  pathPrefix: string,
  opts?: { maxSizeMB?: number; allowedTypePrefixes?: string[] }
): Promise<{ path: string }> {
  const maxSizeMB = opts?.maxSizeMB ?? 5;
  if (file.size > maxSizeMB * 1024 * 1024) {
    throw new Error(`"${file.name}" is too large — the limit is ${maxSizeMB}MB.`);
  }
  if (opts?.allowedTypePrefixes && !opts.allowedTypePrefixes.some((t) => file.type.startsWith(t))) {
    throw new Error(`"${file.name}" isn't a supported file type.`);
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${pathPrefix}/${Date.now()}-${safeName}`;

  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw new Error(error.message);

  return { path };
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Sends a real email to families via the send-family-email Edge Function.
// Shared by the Messages compose flow and anywhere else that needs to
// reach a family directly (e.g. a fee-status follow-up).
export async function sendFamilyEmailRequest(params: {
  subject: string;
  message: string;
  audience: AnnouncementAudience;
  classId?: string;
  studentId?: string;
  attachmentFile?: File | null;
}): Promise<{ success: boolean; recipientCount?: number; error?: string }> {
  try {
    let attachmentPayload: { filename: string; contentType: string; base64Data: string } | undefined;
    if (params.attachmentFile) {
      attachmentPayload = {
        filename: params.attachmentFile.name,
        contentType: params.attachmentFile.type,
        base64Data: await fileToBase64(params.attachmentFile),
      };
    }
    const { data, error: fnError } = await supabase.functions.invoke("send-family-email", {
      body: {
        subject: params.subject,
        message: params.message,
        audience: params.audience,
        classId: params.classId,
        studentId: params.studentId,
        attachment: attachmentPayload,
      },
    });
    if (fnError || data?.error) {
      return { success: false, error: data?.error ?? (await extractFunctionErrorMessage(fnError)) };
    }
    return { success: true, recipientCount: data.recipientCount ?? 0 };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Couldn't send the email." };
  }
}
