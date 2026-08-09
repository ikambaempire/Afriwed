/**
 * Applies AI SEO suggestions directly to article HTML (headings, outlines, keyword placement).
 * Runs in the browser using DOMParser so we never mangle markup with regex.
 */

export type ContentAction =
  | "rewrite_heading"
  | "convert_to_heading"
  | "insert_heading"
  | "insert_outline"
  | "rewrite_paragraph";

export interface SeoContentSuggestion {
  action: ContentAction;
  /** Existing text in the article the change anchors to (heading text or paragraph start). */
  target_text?: string | null;
  /** The new heading / paragraph text. */
  suggested_value?: string | null;
  heading_level?: 2 | 3 | null;
  /** For insert_outline: headings to spread through the article. */
  outline?: { level: 2 | 3; text: string; after_text?: string | null }[] | null;
}

const norm = (s: string) => s.replace(/\s+/g, " ").trim().toLowerCase();

const findByText = (root: Document, selector: string, text: string): HTMLElement | null => {
  const target = norm(text);
  if (!target) return null;
  const nodes = Array.from(root.body.querySelectorAll<HTMLElement>(selector));
  return (
    nodes.find(n => norm(n.textContent || "") === target) ||
    nodes.find(n => norm(n.textContent || "").includes(target)) ||
    nodes.find(n => target.includes(norm(n.textContent || "")) && norm(n.textContent || "").length > 12) ||
    null
  );
};

const makeHeading = (doc: Document, level: 2 | 3, text: string) => {
  const h = doc.createElement(`h${level}`);
  h.textContent = text;
  return h;
};

export const applySeoContentAction = (
  html: string,
  s: SeoContentSuggestion,
): { html: string; ok: boolean; message: string } => {
  const doc = new DOMParser().parseFromString(`<body>${html || ""}</body>`, "text/html");
  const level = (s.heading_level === 3 ? 3 : 2) as 2 | 3;
  const value = (s.suggested_value || "").trim();
  let ok = false;
  let message = "Couldn't find that part of the story — edit it manually.";

  if (s.action === "rewrite_heading" && value) {
    const el = findByText(doc, "h1,h2,h3,h4,h5,h6", s.target_text || "");
    if (el) {
      const h = makeHeading(doc, level, value);
      el.replaceWith(h);
      ok = true;
      message = "Heading updated";
    }
  }

  if (s.action === "convert_to_heading" && (value || s.target_text)) {
    const el = findByText(doc, "p", s.target_text || value);
    if (el) {
      el.replaceWith(makeHeading(doc, level, value || (el.textContent || "").trim()));
      ok = true;
      message = `Turned into an H${level}`;
    }
  }

  if (s.action === "insert_heading" && value) {
    const anchor = s.target_text ? findByText(doc, "p,h1,h2,h3,blockquote,ul,ol,figure", s.target_text) : null;
    const h = makeHeading(doc, level, value);
    if (anchor) {
      anchor.before(h);
      ok = true;
    } else {
      const first = doc.body.querySelector("p");
      if (first) {
        first.after(h);
        ok = true;
      } else {
        doc.body.appendChild(h);
        ok = true;
      }
    }
    if (ok) message = `H${level} added`;
  }

  if (s.action === "insert_outline" && s.outline?.length) {
    const paras = Array.from(doc.body.querySelectorAll("p"));
    let inserted = 0;
    s.outline.forEach((item, i) => {
      const lvl = item.level === 3 ? 3 : 2;
      const h = makeHeading(doc, lvl as 2 | 3, item.text);
      const anchor = item.after_text ? findByText(doc, "p", item.after_text) : null;
      if (anchor) {
        anchor.before(h);
        inserted++;
      } else {
        // spread evenly through the article, skipping the intro paragraph
        const step = Math.max(1, Math.floor(paras.length / (s.outline!.length + 1)));
        const at = paras[Math.min(paras.length - 1, (i + 1) * step)];
        if (at) {
          at.before(h);
          inserted++;
        }
      }
    });
    ok = inserted > 0;
    message = ok ? `${inserted} heading${inserted > 1 ? "s" : ""} added` : message;
  }

  if (s.action === "rewrite_paragraph" && value) {
    const el = findByText(doc, "p", s.target_text || "") || doc.body.querySelector("p");
    if (el) {
      const p = doc.createElement("p");
      p.textContent = value;
      el.replaceWith(p);
      ok = true;
      message = "Paragraph updated";
    }
  }

  return { html: ok ? doc.body.innerHTML : html, ok, message };
};

export default applySeoContentAction;
