import { createContext, useContext, useEffect, useMemo, useState, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/hooks/useLanguage";

type SiteStringRow = {
  key: string;
  value_en: string;
  value_rw: string;
  description: string | null;
};

type Ctx = {
  strings: Record<string, SiteStringRow>;
  loading: boolean;
  refresh: () => Promise<void>;
  t: (key: string, fallback: string) => string;
};

const SiteStringsContext = createContext<Ctx | null>(null);

export function SiteStringsProvider({ children }: { children: ReactNode }) {
  const [strings, setStrings] = useState<Record<string, SiteStringRow>>({});
  const [loading, setLoading] = useState(true);
  const { lang } = useLanguage();

  const refresh = useCallback(async () => {
    const { data } = await supabase.from("site_strings").select("key,value_en,value_rw,description");
    const map: Record<string, SiteStringRow> = {};
    (data || []).forEach((r: any) => (map[r.key] = r));
    setStrings(map);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const t = useCallback(
    (key: string, fallback: string) => {
      const row = strings[key];
      if (!row) return fallback;
      const val = lang === "rw" ? row.value_rw : row.value_en;
      return (val && val.trim()) || fallback;
    },
    [strings, lang]
  );

  const value = useMemo(() => ({ strings, loading, refresh, t }), [strings, loading, refresh, t]);

  return <SiteStringsContext.Provider value={value}>{children}</SiteStringsContext.Provider>;
}

export function useSiteStrings() {
  const ctx = useContext(SiteStringsContext);
  if (!ctx) throw new Error("useSiteStrings must be used within SiteStringsProvider");
  return ctx;
}

export function useT() {
  return useSiteStrings().t;
}
