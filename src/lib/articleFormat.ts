/**
 * Normalises article HTML so every story reads with real paragraphs and visible headings.
 * - converts double <br> breaks into paragraph splits
 * - wraps loose text blocks in <p>
 * - splits walls of text into ~3-sentence paragraphs
 * - promotes short bold/standalone lines into <h2> headings
 */

const HEADING_MAX_LEN = 90;

const promoteHeadings = (html: string) =>
  html
    // <p><strong>Short line</strong></p> -> <h2>
    .replace(/<p[^>]*>\s*<(strong|b)>\s*([^<]{3,120})\s*<\/(strong|b)>\s*<\/p>/gi, (m, _t, text: string) => {
      const clean = text.trim();
      if (clean.length > HEADING_MAX_LEN || /[.!?]$/.test(clean)) return m;
      return `<h2>${clean}</h2>`;
    })
    // <p>Short line ending with ':'</p> -> <h3>
    .replace(/<p[^>]*>\s*([^<]{3,70}:)\s*<\/p>/gi, (_m, text: string) => `<h3>${text.trim()}</h3>`);

export const formatArticle = (html: string) => {
  if (!html) return "";
  let out = html
    .replace(/<br\s*\/?>\s*(<br\s*\/?>\s*)+/gi, "\n\n")
    .replace(/<p>\s*(&nbsp;|\s)*<\/p>/gi, "");

  const paragraphCount = (out.match(/<p[\s>]/gi) || []).length;

  if (paragraphCount < 2) {
    const stripped = out.replace(/<\/?p[^>]*>/gi, "").trim();
    const blocks = stripped.split(/\n\s*\n/).filter(b => b.trim());
    const chunks: string[] = [];
    blocks.forEach(block => {
      const text = block.trim();
      if (text.length > 600 && !/<(h[1-6]|figure|img|ul|ol|blockquote|table)/i.test(text)) {
        const sentences = text.split(/(?<=[.!?])\s+(?=[A-Z"“‘'])/);
        for (let i = 0; i < sentences.length; i += 3) {
          chunks.push(sentences.slice(i, i + 3).join(" "));
        }
      } else {
        chunks.push(text);
      }
    });
    out = chunks
      .map(c => (/^\s*<(h[1-6]|figure|img|ul|ol|blockquote|table|div|hr)/i.test(c) ? c : `<p>${c}</p>`))
      .join("\n");
  } else {
    out = out
      .split(/\n\s*\n/)
      .map(c => c.trim())
      .filter(Boolean)
      .map(c => (/^\s*<(p|h[1-6]|figure|img|ul|ol|blockquote|table|div|hr)/i.test(c) ? c : `<p>${c}</p>`))
      .join("\n");

    // Split any remaining giant paragraphs into readable chunks
    out = out.replace(/<p([^>]*)>([\s\S]{700,}?)<\/p>/gi, (m, attrs: string, inner: string) => {
      if (/<(h[1-6]|figure|img|ul|ol|blockquote|table)/i.test(inner)) return m;
      const sentences = inner.split(/(?<=[.!?])\s+(?=[A-Z"“‘'])/);
      if (sentences.length < 4) return m;
      const parts: string[] = [];
      for (let i = 0; i < sentences.length; i += 3) parts.push(`<p${attrs}>${sentences.slice(i, i + 3).join(" ")}</p>`);
      return parts.join("\n");
    });
  }

  return promoteHeadings(out);
};

export default formatArticle;
