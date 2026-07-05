import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type Lang = "en" | "rw";

// Translation dictionary. Keys are English source strings; values are Kinyarwanda.
// Add new keys freely — anything missing falls back to the English key itself.
const DICT: Record<string, string> = {
  // Nav
  "Find Vendors": "Shakisha Abakora",
  "Real Weddings": "Ubukwe Nyabwo",
  "Stories": "Inkuru",
  "Plan Wedding": "Tegura Ubukwe",
  "Messages": "Ubutumwa",
  "Author": "Umwanditsi",
  "Vendor Dashboard": "Ikibaho cy'Ukora",
  "Author Dashboard": "Ikibaho cy'Umwanditsi",
  "Admin": "Umuyobozi",
  "Admin Panel": "Ikibaho cy'Umuyobozi",
  "Sign In": "Injira",
  "Sign Out": "Sohoka",
  "List Your Business": "Andikisha Ubucuruzi bwawe",
  "Become an Author": "Ba Umwanditsi",
  "Language": "Ururimi",

  // Hero / Newsletter
  "The Afriwedd Weekly": "Afriwedd ya buri Cyumweru",
  "Issue No. 24 · This week's dispatch": "Igitabo Nº 24 · Icyumweru gishya",
  "African wedding stories,": "Inkuru z'ubukwe bwa Afurika,",
  "delivered weekly.": "zigezwa buri cyumweru.",
  "A curated newsletter of real weddings, essays and craft from across the continent — read online or in your inbox every Sunday.":
    "Ikinyamakuru cyahitiwemo cy'ubukwe nyabwo, ibitekerezo n'ubuhanzi bituruka mu mugabane wose — soma kuri interineti cyangwa mu ibaruwa yawe buri cyumweru.",
  "Newsletter": "Ikinyamakuru",
  "Editors' pick": "Ihitamo ry'Abanditsi",
  "The people behind the": "Abantu bari inyuma y'",
  "aisle.": "urubuga.",
  "Portraits, love letters and long-form profiles of the couples, planners and creatives shaping modern African weddings.":
    "Amafoto, amabaruwa y'urukundo n'inkuru ndende z'abakundana, abategura n'abahanzi bahindura ubukwe bwa Afurika bugezweho.",
  "Feature": "Icyihariye",
  "Ubwoba & Ubwiza": "Ubwoba & Ubwiza",
  "Stories in English": "Inkuru mu Cyongereza",
  "& Kinyarwanda.": "no mu Kinyarwanda.",
  "Switch languages in a tap. Every essay, wedding and vendor guide is published in the voice of its authors.":
    "Hindura ururimi mu kanya. Buri gitekerezo, ubukwe n'ubuyobozi bw'abakora byanditse mu ijwi ry'abanditsi.",
  "Bilingual": "Indimi Ebyiri",
  "Subscribe · Free": "Iyandikishe · Ubuntu",
  "Get the Sunday edition": "Bona igitabo cyo ku Cyumweru",
  "One beautifully-designed email. Real weddings, essays and vendor picks — no spam, unsubscribe any time.":
    "Ibaruwa imwe nziza. Ubukwe nyabwo, ibitekerezo n'abakora bahitiwemo — nta spam, wavamo igihe ushakiye.",
  "Subscribe": "Iyandikishe",
  "Read latest issue": "Soma igitabo giheruka",
  "Write for us": "Twandikire",
  "Previous": "Ibanziriza",
  "Next": "Ikurikira",

  // Home sections
  "The Afriwedd Edit": "Ihitamo rya Afriwedd",
  "From the Editorial Desk": "Ku Meza y'Abanditsi",
  "All articles": "Inkuru zose",
  "Lead Story": "Inkuru y'Ibanze",
  "Afriwedd Editorial": "Ubwanditsi bwa Afriwedd",
  "Stories of African Love": "Inkuru z'Urukundo rwa Afurika",
  "All stories": "Inkuru zose",
  "Load more stories": "Kongera inkuru",
  "Loading…": "Biratangira…",
  "Browse all stories": "Reba inkuru zose",
  "Love, Lived Out Loud": "Urukundo, Rubayeho mu Ruhame",
  "Authentic African wedding stories — the colours, the people, the vendors that made it.":
    "Inkuru nyakuri z'ubukwe bwa Afurika — amabara, abantu, n'abakora babigizemo uruhare.",
  "Browse all real weddings": "Reba ubukwe nyabwo bwose",

  // Marketplace strip
  "Planning a wedding?": "Uritegura ubukwe?",
  "Discover trusted vendors across Africa — venues, photographers, planners & more.":
    "Menya abakora bizewe muri Afurika — ahantu, abafotora, abategura n'ibindi.",
  "Browse Vendors": "Reba Abakora",
  "Plan with Afriwedd": "Tegura na Afriwedd",

  // How it works
  "Simple Process": "Uburyo Bworoshye",
  "How It Works": "Uko Bikora",
  "Discover Vendors": "Menya Abakora",
  "Browse through Rwanda's finest wedding professionals by category, location, and budget.":
    "Reba abahanga b'ubukwe beza cyane mu Rwanda ukurikije icyiciro, aho baherereye, n'ingengo y'imari.",
  "Book & Pay Securely": "Bookinga & Wishyure Umutekano",
  "Send booking requests, negotiate packages, and pay securely through our platform.":
    "Ohereza ibisabwa, umvikane ku ma pake, wishyure ku mutekano ukoresheje urubuga rwacu.",
  "Celebrate Your Day": "Izihiza Umunsi Wawe",
  "Enjoy your dream wedding while we handle vendor coordination and payments.":
    "Ishimire ubukwe wifuzaga mu gihe tureberera guhuza abakora n'ubwishyu.",
  "Step": "Intambwe",

  // Testimonials
  "Love Stories": "Inkuru z'Urukundo",
  "Happy Couples": "Abakundana Bishimye",

  // Footer
  "Browse the archive": "Reba ububiko",
  "in Kinyarwanda": "mu Kinyarwanda",
  "in English": "mu Cyongereza",
  "stories": "inkuru",
  "View all categories →": "Reba ibyiciro byose →",
  "Join the Afriwedd Circle": "Injira mu Ruziga rwa Afriwedd",
  "Weekly stories, real weddings & inspiration in your inbox.":
    "Inkuru za buri cyumweru, ubukwe nyabwo n'ubwitange mu ibaruwa yawe.",
  "A modern publishing home for African weddings — stories, real weddings, expert voices and the vendors who bring it all to life.":
    "Urugo rugezweho rw'ibitangazamakuru by'ubukwe bwa Afurika — inkuru, ubukwe nyabwo, amajwi y'abahanga n'abakora babizanaho ubuzima.",
  "Read": "Soma",
  "All Stories": "Inkuru zose",
  "Culture": "Umuco",
  "Style": "Imyambarire",
  "Planning": "Gutegura",
  "Contribute": "Tanga Umusanzu",
  "Submit Your Wedding": "Ohereza Ubukwe bwawe",
  "Submit a Listing": "Ohereza Ibirango",
  "Company": "Ikigo",
  "About Us": "Ibyerekeye Twe",
  "Contact": "Twandikire",
  "Privacy": "Ibanga",
  "Terms": "Amabwiriza",
  "Crafted in Africa. All rights reserved.": "Byakorewe muri Afurika. Uburenganzira bwose burasigaye.",
  "Download the App": "Manura Porogaramu",
  "your@email.com": "email@yawe.com",

  // Stories page
  "Stories of Love, Culture & Celebration": "Inkuru z'Urukundo, Umuco no Kwizihiza",
  "Real African weddings, vendor spotlights, and planning wisdom — straight from the continent.":
    "Ubukwe nyabwo bwa Afurika, abakora bagaragara, n'ubwenge bwo gutegura — biva mu mugabane.",
  "Search stories...": "Shakisha inkuru...",
  "All": "Byose",
  "Loading stories...": "Inkuru ziratangira...",
  "Featured Story": "Inkuru Yihariye",
  "No stories found.": "Nta nkuru zabonetse.",
};

type Ctx = { lang: Lang; setLang: (l: Lang) => void; toggle: () => void; t: (key: string) => string };

const LanguageContext = createContext<Ctx>({ lang: "en", setLang: () => {}, toggle: () => {}, t: (k) => k });

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLangState] = useState<Lang>(() => {
    if (typeof window === "undefined") return "en";
    const v = localStorage.getItem("afriwedd_lang");
    return v === "rw" ? "rw" : "en";
  });
  const setLang = (l: Lang) => { setLangState(l); localStorage.setItem("afriwedd_lang", l); };
  const toggle = () => setLang(lang === "en" ? "rw" : "en");
  const t = (key: string) => (lang === "rw" ? DICT[key] || key : key);
  useEffect(() => { document.documentElement.lang = lang; }, [lang]);
  return <LanguageContext.Provider value={{ lang, setLang, toggle, t }}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => useContext(LanguageContext);
