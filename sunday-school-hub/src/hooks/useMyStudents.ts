import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import type { Student } from "@/types";

export function useMyStudents() {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("students")
      .select("*, student_classes(classes(id, name, color))")
      .eq("parent_id", user.id)
      .order("first_name");

    const mapped = (data ?? []).map((s: any) => ({
      ...s,
      classes: (s.student_classes ?? []).map((sc: any) => sc.classes).filter(Boolean),
    }));
    setStudents(mapped);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { students, loading, refresh };
}
