import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Profile } from "@/types";

export function useTeachers() {
  const [teachers, setTeachers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from("profiles").select("*").in("role", ["teacher", "admin", "principal"]).order("full_name");
      setTeachers(data ?? []);
      setLoading(false);
    }
    load();
  }, []);

  return { teachers, loading };
}
