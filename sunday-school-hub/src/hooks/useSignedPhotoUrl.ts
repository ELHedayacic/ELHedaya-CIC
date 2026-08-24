import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

// Student photos live in a private bucket, so there's no permanent public
// URL to just stick in an <img src>. This resolves the stored path to a
// time-limited signed URL on demand — Storage RLS still applies at the
// moment the signed URL is requested, so this only succeeds for the
// child's own parent or staff.
export function useSignedPhotoUrl(path: string | null | undefined, bucket = "student-photos") {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!path) {
      setUrl(null);
      return;
    }
    let cancelled = false;
    supabase.storage
      .from(bucket)
      .createSignedUrl(path, 3600)
      .then(({ data }) => {
        if (!cancelled) setUrl(data?.signedUrl ?? null);
      });
    return () => {
      cancelled = true;
    };
  }, [path, bucket]);

  return url;
}
