import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type Lang = "en" | "rw";
type Ctx = { lang: Lang; setLang: (l: Lang) => void; toggle: () => void };

const LanguageContext = createContext<Ctx>({ lang: "en", setLang: () => {}, toggle: () => {} });

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLangState] = useState<Lang>(() => {
    if (typeof window === "undefined") return "en";
    const v = localStorage.getItem("afriwedd_lang");
    return v === "rw" ? "rw" : "en";
  });
  const setLang = (l: Lang) => { setLangState(l); localStorage.setItem("afriwedd_lang", l); };
  const toggle = () => setLang(lang === "en" ? "rw" : "en");
  useEffect(() => { document.documentElement.lang = lang; }, [lang]);
  return <LanguageContext.Provider value={{ lang, setLang, toggle }}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => useContext(LanguageContext);
