import { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Bold, Italic, Underline, Link as LinkIcon, Image as ImageIcon, Heading2, Heading3,
  Quote, List, ListOrdered, Undo2, Redo2, Pilcrow, Minus, AlignLeft, AlignCenter, AlignRight,
  MoveVertical, Plus, Code,
} from "lucide-react";

interface Props {
  value: string;
  onChange: (html: string) => void;
  /** Gutenberg-style canvas: borderless sheet, big type, slash commands */
  variant?: "boxed" | "canvas";
  placeholder?: string;
  /** Rendered between the toolbar and the writing area (canvas variant) */
  header?: React.ReactNode;
}

type BlockDef = { key: string; label: string; hint: string; icon: any; run: () => void };

const RichTextEditor = ({ value, onChange, variant = "boxed", placeholder = "Type / to choose a block", header }: Props) => {
  const ref = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [inserterOpen, setInserterOpen] = useState(false);
  const [slashOpen, setSlashOpen] = useState(false);
  const [query, setQuery] = useState("");
  const canvas = variant === "canvas";

  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value) {
      ref.current.innerHTML = value || "";
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sync = () => { if (ref.current) onChange(ref.current.innerHTML); };

  const exec = (cmd: string, arg?: string) => {
    ref.current?.focus();
    document.execCommand(cmd, false, arg);
    sync();
  };

  const insertHtml = (html: string) => {
    ref.current?.focus();
    document.execCommand("insertHTML", false, html);
    sync();
  };

  const insertLink = () => {
    const url = window.prompt("Enter URL (https://...)");
    if (!url) return;
    exec("createLink", url);
    if (ref.current) {
      ref.current.querySelectorAll("a").forEach(a => {
        a.setAttribute("target", "_blank");
        a.setAttribute("rel", "noopener noreferrer");
      });
      sync();
    }
  };

  const insertImageUrl = () => {
    const url = window.prompt("Image URL");
    if (!url) return;
    insertImage(url);
  };

  const insertImage = (url: string, caption = "") => {
    insertHtml(
      `<figure style="margin:1.75rem 0;text-align:center"><img src="${url}" alt="${caption}" style="border-radius:0.75rem;max-width:100%" />` +
      (caption ? `<figcaption style="font-size:0.8rem;opacity:.7;margin-top:.5rem">${caption}</figcaption>` : "") +
      `</figure><p><br/></p>`
    );
  };

  const uploadFile = async (file: File) => {
    const { data: sess } = await supabase.auth.getSession();
    if (!sess.session) { toast.error("Your session expired — please sign in again."); return; }
    if (!file.type.startsWith("image/")) { toast.error("Only image files can be uploaded."); return; }
    if (file.size > 15 * 1024 * 1024) { toast.error("Image must be under 15MB."); return; }
    setUploading(true);
    try {
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
      const path = `blog/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage
        .from("vendor-media")
        .upload(path, file, { cacheControl: "3600", upsert: true, contentType: file.type });
      if (error) throw error;
      const { data } = supabase.storage.from("vendor-media").getPublicUrl(path);
      insertImage(data.publicUrl);
      toast.success("Image inserted");
    } catch (err: any) {
      toast.error(err?.message?.includes("row-level security")
        ? "Upload blocked — your account needs author access."
        : err?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) await uploadFile(file);
  };

  const onDrop = async (e: React.DragEvent) => {
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      e.preventDefault();
      await uploadFile(file);
    }
  };

  const onPaste = async (e: React.ClipboardEvent) => {
    const file = Array.from(e.clipboardData.files || [])[0];
    if (file && file.type.startsWith("image/")) {
      e.preventDefault();
      await uploadFile(file);
    }
  };

  const blocks: BlockDef[] = [
    { key: "paragraph", label: "Paragraph", hint: "Body text", icon: Pilcrow, run: () => exec("formatBlock", "<p>") },
    { key: "heading2", label: "Heading", hint: "Section title (H2)", icon: Heading2, run: () => exec("formatBlock", "<h2>") },
    { key: "heading3", label: "Sub heading", hint: "Smaller title (H3)", icon: Heading3, run: () => exec("formatBlock", "<h3>") },
    { key: "image", label: "Image", hint: "Upload from device", icon: ImageIcon, run: () => fileRef.current?.click() },
    { key: "imageurl", label: "Image from URL", hint: "Paste an image link", icon: ImageIcon, run: insertImageUrl },
    { key: "quote", label: "Quote", hint: "Highlight a statement", icon: Quote, run: () => exec("formatBlock", "<blockquote>") },
    { key: "list", label: "Bulleted list", hint: "Unordered items", icon: List, run: () => exec("insertUnorderedList") },
    { key: "numbered", label: "Numbered list", hint: "Ordered items", icon: ListOrdered, run: () => exec("insertOrderedList") },
    { key: "separator", label: "Separator", hint: "Divider line", icon: Minus, run: () => insertHtml('<hr style="margin:2.5rem 0;border:none;border-top:1px solid currentColor;opacity:.15" /><p><br/></p>') },
    { key: "spacer", label: "Spacer", hint: "Blank space between sections", icon: MoveVertical, run: () => insertHtml('<p style="margin:2.5rem 0"><br/></p>') },
    { key: "link", label: "Link", hint: "Link the selected text", icon: LinkIcon, run: insertLink },
    { key: "html", label: "Custom HTML", hint: "Embed raw markup", icon: Code, run: () => { const h = window.prompt("Paste HTML/embed code"); if (h) insertHtml(h); } },
  ];

  const filtered = blocks.filter(b => b.label.toLowerCase().includes(query.toLowerCase()));

  const removeSlash = () => {
    // delete the typed "/" + query characters
    for (let i = 0; i < query.length + 1; i++) document.execCommand("delete");
  };

  const runBlock = (b: BlockDef, fromSlash: boolean) => {
    if (fromSlash) removeSlash();
    b.run();
    setSlashOpen(false); setInserterOpen(false); setQuery("");
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "/" && !slashOpen) { setQuery(""); setSlashOpen(true); return; }
    if (!slashOpen) return;
    if (e.key === "Escape") { setSlashOpen(false); setQuery(""); return; }
    if (e.key === "Backspace") { if (!query) setSlashOpen(false); else setQuery(q => q.slice(0, -1)); return; }
    if (e.key === "Enter") { if (filtered[0]) { e.preventDefault(); runBlock(filtered[0], true); } return; }
    if (e.key.length === 1) setQuery(q => q + e.key);
  };

  const T = ({ onClick, title, children, active }: any) => (
    <Button type="button" size="sm" variant={active ? "secondary" : "ghost"} onClick={onClick} title={title} className="h-8 px-2">
      {children}
    </Button>
  );

  const BlockList = ({ fromSlash }: { fromSlash: boolean }) => (
    <div className="max-h-72 w-72 overflow-y-auto p-1">
      {fromSlash && (
        <p className="px-3 py-2 text-[11px] uppercase tracking-wide text-muted-foreground">
          Blocks {query && <span className="normal-case">matching “{query}”</span>}
        </p>
      )}
      {filtered.map(b => (
        <button
          key={b.key}
          type="button"
          onMouseDown={e => { e.preventDefault(); runBlock(b, fromSlash); }}
          className="w-full flex items-start gap-3 px-3 py-2 rounded-md text-left hover:bg-muted transition-colors"
        >
          <b.icon className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
          <span>
            <span className="block text-sm font-medium">{b.label}</span>
            <span className="block text-[11px] text-muted-foreground">{b.hint}</span>
          </span>
        </button>
      ))}
      {filtered.length === 0 && <p className="px-3 py-4 text-xs text-muted-foreground">No blocks found.</p>}
    </div>
  );

  const toolbar = (
    <div className={`flex flex-wrap items-center gap-0.5 ${canvas ? "px-3 py-2 border-b border-border bg-background sticky top-0 z-20" : "p-2 border-b border-border bg-muted/40 sticky top-0 z-10"}`}>
      <div className="relative">
        <Button
          type="button" size="sm"
          className="h-8 w-8 p-0 rounded-md"
          onClick={() => { setInserterOpen(o => !o); setQuery(""); }}
          title="Add block"
        >
          <Plus className={`w-4 h-4 transition-transform ${inserterOpen ? "rotate-45" : ""}`} />
        </Button>
        {inserterOpen && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setInserterOpen(false)} />
            <div className="absolute left-0 top-10 z-40 rounded-lg border border-border bg-popover shadow-lg">
              <BlockList fromSlash={false} />
            </div>
          </>
        )}
      </div>
      <span className="w-px h-6 bg-border mx-1" />
      <T onClick={() => exec("bold")} title="Bold"><Bold className="w-4 h-4" /></T>
      <T onClick={() => exec("italic")} title="Italic"><Italic className="w-4 h-4" /></T>
      <T onClick={() => exec("underline")} title="Underline"><Underline className="w-4 h-4" /></T>
      <span className="w-px h-6 bg-border mx-1" />
      <T onClick={() => exec("formatBlock", "<p>")} title="Paragraph"><Pilcrow className="w-4 h-4" /></T>
      <T onClick={() => exec("formatBlock", "<h2>")} title="Section heading (H2)"><Heading2 className="w-4 h-4" /></T>
      <T onClick={() => exec("formatBlock", "<h3>")} title="Sub heading (H3)"><Heading3 className="w-4 h-4" /></T>
      <T onClick={() => exec("formatBlock", "<blockquote>")} title="Quote"><Quote className="w-4 h-4" /></T>
      <T onClick={() => exec("insertUnorderedList")} title="Bullet list"><List className="w-4 h-4" /></T>
      <T onClick={() => exec("insertOrderedList")} title="Numbered list"><ListOrdered className="w-4 h-4" /></T>
      <span className="w-px h-6 bg-border mx-1" />
      <T onClick={() => exec("justifyLeft")} title="Align left"><AlignLeft className="w-4 h-4" /></T>
      <T onClick={() => exec("justifyCenter")} title="Align center"><AlignCenter className="w-4 h-4" /></T>
      <T onClick={() => exec("justifyRight")} title="Align right"><AlignRight className="w-4 h-4" /></T>
      <span className="w-px h-6 bg-border mx-1" />
      <T onClick={() => insertHtml('<p style="margin:2.5rem 0"><br/></p>')} title="Add blank spacing between sections"><MoveVertical className="w-4 h-4" /></T>
      <T onClick={() => insertHtml('<hr style="margin:2.5rem 0;border:none;border-top:1px solid currentColor;opacity:.15" /><p><br/></p>')} title="Section divider"><Minus className="w-4 h-4" /></T>
      <span className="w-px h-6 bg-border mx-1" />
      <T onClick={insertLink} title="Insert link"><LinkIcon className="w-4 h-4" /></T>
      <T onClick={insertImageUrl} title="Insert image by URL"><ImageIcon className="w-4 h-4" /></T>
      <Button type="button" size="sm" variant="outline" className="h-8" onClick={() => fileRef.current?.click()} disabled={uploading} title="Upload image from device">
        <ImageIcon className="w-4 h-4 mr-1" />{uploading ? "Uploading…" : "Upload"}
      </Button>
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleUpload} />
      <span className="w-px h-6 bg-border mx-1" />
      <T onClick={() => exec("undo")} title="Undo"><Undo2 className="w-4 h-4" /></T>
      <T onClick={() => exec("redo")} title="Redo"><Redo2 className="w-4 h-4" /></T>
    </div>
  );

  const editable = (
    <div className="relative">
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={sync}
        onBlur={sync}
        onDrop={onDrop}
        onPaste={onPaste}
        onKeyDown={onKeyDown}
        data-placeholder={placeholder}
        className={`rte-editable prose max-w-none focus:outline-none leading-relaxed
          prose-p:my-5 prose-h2:mt-10 prose-h2:mb-3 prose-h3:mt-8 prose-h3:mb-2
          prose-blockquote:my-8 prose-ul:my-5 prose-ol:my-5 prose-img:rounded-lg prose-a:text-primary
          ${canvas
            ? "prose-lg px-6 sm:px-14 py-10 min-h-[60vh] font-serif"
            : "prose-base p-6 min-h-[420px]"}`}
      />
      {slashOpen && (
        <div className="absolute left-6 sm:left-14 top-16 z-40 rounded-lg border border-border bg-popover shadow-xl">
          <BlockList fromSlash />
        </div>
      )}
    </div>
  );

  if (canvas) {
    return (
      <div className="bg-background">
        {toolbar}
        {header}
        {editable}
      </div>
    );
  }


  return (
    <div className="border border-input rounded-md overflow-hidden bg-background">
      {toolbar}
      {editable}
      <div className="px-4 py-2 border-t border-border bg-muted/30 text-[11px] text-muted-foreground">
        Tip: type <strong>/</strong> to choose a block, or drag &amp; drop an image straight into the article.
      </div>
    </div>
  );
};

export default RichTextEditor;
