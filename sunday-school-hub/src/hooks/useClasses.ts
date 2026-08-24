import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { SchoolClass } from "@/types";

export function useClasses() {
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("classes").select("*").order("name");
    setClasses(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { classes, loading, refresh };
}
