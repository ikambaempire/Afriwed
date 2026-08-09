import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const stripHtml = (html: string) =>
  html.replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const outline = (html: string) => {
  const out: string[] = [];
  const re = /<(h[1-6])[^>]*>([\s\S]*?)<\/\1>/gi;
  let m;
  while ((m = re.exec(html))) out.push(`${m[1].toUpperCase()}: ${stripHtml(m[2]).slice(0, 160)}`);
  return out.slice(0, 60);
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const key = Deno.env.get("LOVABLE_API_KEY");
    if (!key) {
      return new Response(JSON.stringify({ error: "AI is not configured." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const title = String(body.title ?? "").slice(0, 300);
    const contentHtml = String(body.content_html ?? "").slice(0, 60000);
    const metaTitle = String(body.meta_title ?? "").slice(0, 300);
    const metaDescription = String(body.meta_description ?? "").slice(0, 600);
    const focusKeyword = String(body.focus_keyword ?? "").slice(0, 120);
    const slug = String(body.slug ?? "").slice(0, 200);
    const excerpt = String(body.excerpt ?? "").slice(0, 1000);

    const text = stripHtml(contentHtml);
    if (!title.trim() && text.length < 40) {
      return new Response(JSON.stringify({ error: "Write a title and some content first." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const wordCount = text ? text.split(" ").length : 0;
    const paragraphs = (contentHtml.match(/<p[\s>]/gi) || []).length;
    const links = (contentHtml.match(/<a\s/gi) || []).length;
    const images = (contentHtml.match(/<img\s/gi) || []).length;
    const imagesNoAlt = (contentHtml.match(/<img(?![^>]*\balt=)[^>]*>/gi) || []).length;

    const prompt = `You are an SEO editor for a Rwandan/African wedding editorial magazine. Review the draft article below like Grammarly reviews grammar: find concrete SEO problems and give a specific, actionable fix for each.

ARTICLE TITLE: ${title || "(empty)"}
URL SLUG: ${slug || "(empty)"}
FOCUS KEYWORD: ${focusKeyword || "(none set)"}
SEO TITLE: ${metaTitle || "(empty, falls back to article title)"}
META DESCRIPTION: ${metaDescription || "(empty)"}
EXCERPT: ${excerpt || "(empty)"}

STATS: ${wordCount} words, ${paragraphs} paragraphs, ${outline(contentHtml).length} headings, ${links} links, ${images} images (${imagesNoAlt} missing alt text).

HEADING OUTLINE:
${outline(contentHtml).join("\n") || "(no headings)"}

ARTICLE TEXT:
${text.slice(0, 18000)}

Check at least: SEO title length and keyword placement, meta description length (under 160 chars) and appeal, slug quality, keyword usage and natural density, heading structure (single H1, logical H2/H3, headings that are too long — over ~70 characters — or vague), paragraph length and readability (walls of text, sentences that are too long), intro quality, internal/external links, image alt text, and overall content depth.

Return ONLY json in this exact shape, no markdown fences:
{"score": 0-100, "summary": "one short sentence", "issues": [{"severity":"critical"|"warning"|"tip","area":"Title"|"Meta description"|"Slug"|"Keyword"|"Headings"|"Readability"|"Links"|"Images"|"Content","problem":"what is wrong, quote the exact offending text when relevant","fix":"the exact rewrite or step to fix it","field":"meta_title"|"meta_description"|"focus_keyword"|"slug"|null,"suggested_value":"ready-to-use replacement value when field is not null, else null","content_action":null|{"action":"rewrite_heading"|"convert_to_heading"|"insert_heading"|"insert_outline"|"rewrite_paragraph","target_text":"the EXACT existing heading or paragraph text from the article this change applies to (or null)","suggested_value":"the new heading or paragraph text","heading_level":2|3,"outline":null|[{"level":2|3,"text":"section heading","after_text":"exact text of the paragraph this heading should go ABOVE, or null"}]}}]}

CONTENT ACTIONS — these power one-click fixes inside the article body, so use them whenever the fix is structural:
- Heading too long, vague, or missing the keyword -> "rewrite_heading" with target_text = the exact current heading text and suggested_value = the improved heading (under 70 chars).
- A short standalone paragraph that really is a section title -> "convert_to_heading".
- A section of text with no heading above it -> "insert_heading" with target_text = the exact first words of the paragraph the heading should sit above.
- The article has no headings or a weak structure -> ONE "insert_outline" issue with 3-6 outline items, each anchored with after_text quoting exact paragraph text from the article.
- The focus keyword is missing from the opening paragraph -> "rewrite_paragraph" with target_text = exact first paragraph text and suggested_value = the same paragraph rewritten to include the keyword naturally.
Set "field" to null whenever you use content_action, and copy target_text/after_text VERBATIM from the article so it can be matched.
List up to 12 issues, most important first. If something is already good, do not list it.`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": key, "X-Lovable-AIG-SDK": "fetch" },
      body: JSON.stringify({
        model: "google/gemini-3.6-flash",
        messages: [
          { role: "system", content: "You are a meticulous SEO editor. You always reply with valid json only." },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (res.status === 429) {
      return new Response(JSON.stringify({ error: "Too many requests — try again in a moment." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (res.status === 402) {
      return new Response(JSON.stringify({ error: "AI credits exhausted. Please top up to keep using the SEO bot." }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!res.ok) {
      const detail = await res.text();
      console.error("gateway error", res.status, detail);
      return new Response(JSON.stringify({ error: "SEO check failed. Please try again." }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await res.json();
    const raw: string = data?.choices?.[0]?.message?.content ?? "";
    let parsed: any;
    try {
      parsed = JSON.parse(raw);
    } catch {
      const match = raw.match(/\{[\s\S]*\}/);
      parsed = match ? JSON.parse(match[0]) : { score: null, summary: "", issues: [] };
    }

    const issues = Array.isArray(parsed?.issues) ? parsed.issues.slice(0, 12) : [];
    return new Response(JSON.stringify({
      score: typeof parsed?.score === "number" ? Math.max(0, Math.min(100, Math.round(parsed.score))) : null,
      summary: typeof parsed?.summary === "string" ? parsed.summary : "",
      issues,
      stats: { wordCount, paragraphs, links, images, imagesNoAlt },
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("seo-audit error", e);
    return new Response(JSON.stringify({ error: "Unexpected error running the SEO check." }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
