import { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Bold, Italic, Underline, Link as LinkIcon, Image as ImageIcon, Heading2, Heading3,
  Quote, List, ListOrdered, Undo2, Redo2, Pilcrow, Minus, AlignLeft, AlignCenter, AlignRight, MoveVertical,
} from "lucide-react";

interface Props {
  value: string;
  onChange: (html: string) => void;
}

const RichTextEditor = ({ value, onChange }: Props) => {
  const ref = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

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

  const T = ({ onClick, title, children, active }: any) => (
    <Button type="button" size="sm" variant={active ? "secondary" : "ghost"} onClick={onClick} title={title} className="h-8 px-2">
      {children}
    </Button>
  );

  return (
    <div className="border border-input rounded-md overflow-hidden bg-background">
      <div className="flex flex-wrap gap-0.5 p-2 border-b border-border bg-muted/40 sticky top-0 z-10">
        <T onClick={() => exec("bold")} title="Bold"><Bold className="w-4 h-4" /></T>
        <T onClick={() => exec("italic")} title="Italic"><Italic className="w-4 h-4" /></T>
        <T onClick={() => exec("underline")} title="Underline"><Underline className="w-4 h-4" /></T>
        <span className="w-px bg-border mx-1" />
        <T onClick={() => exec("formatBlock", "<p>")} title="Paragraph"><Pilcrow className="w-4 h-4" /></T>
        <T onClick={() => exec("formatBlock", "<h2>")} title="Section heading (H2)"><Heading2 className="w-4 h-4" /></T>
        <T onClick={() => exec("formatBlock", "<h3>")} title="Sub heading (H3)"><Heading3 className="w-4 h-4" /></T>
        <T onClick={() => exec("formatBlock", "<blockquote>")} title="Quote"><Quote className="w-4 h-4" /></T>
        <T onClick={() => exec("insertUnorderedList")} title="Bullet list"><List className="w-4 h-4" /></T>
        <T onClick={() => exec("insertOrderedList")} title="Numbered list"><ListOrdered className="w-4 h-4" /></T>
        <span className="w-px bg-border mx-1" />
        <T onClick={() => exec("justifyLeft")} title="Align left"><AlignLeft className="w-4 h-4" /></T>
        <T onClick={() => exec("justifyCenter")} title="Align center"><AlignCenter className="w-4 h-4" /></T>
        <T onClick={() => exec("justifyRight")} title="Align right"><AlignRight className="w-4 h-4" /></T>
        <span className="w-px bg-border mx-1" />
        <T onClick={() => insertHtml('<p style="margin:2.5rem 0"><br/></p>')} title="Add blank spacing between sections"><MoveVertical className="w-4 h-4" /></T>
        <T onClick={() => insertHtml('<hr style="margin:2.5rem 0;border:none;border-top:1px solid currentColor;opacity:.15" /><p><br/></p>')} title="Section divider"><Minus className="w-4 h-4" /></T>
        <span className="w-px bg-border mx-1" />
        <T onClick={insertLink} title="Insert link"><LinkIcon className="w-4 h-4" /></T>
        <T onClick={insertImageUrl} title="Insert image by URL"><ImageIcon className="w-4 h-4" /></T>
        <Button type="button" size="sm" variant="outline" className="h-8" onClick={() => fileRef.current?.click()} disabled={uploading} title="Upload image from device">
          <ImageIcon className="w-4 h-4 mr-1" />{uploading ? "Uploading…" : "Upload"}
        </Button>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleUpload} />
        <span className="w-px bg-border mx-1" />
        <T onClick={() => exec("undo")} title="Undo"><Undo2 className="w-4 h-4" /></T>
        <T onClick={() => exec("redo")} title="Redo"><Redo2 className="w-4 h-4" /></T>
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={sync}
        onBlur={sync}
        onDrop={onDrop}
        onPaste={onPaste}
        data-placeholder="Start writing your story…"
        className="prose prose-base max-w-none p-6 min-h-[420px] focus:outline-none leading-relaxed
          prose-p:my-5 prose-h2:mt-10 prose-h2:mb-3 prose-h3:mt-8 prose-h3:mb-2
          prose-blockquote:my-8 prose-ul:my-5 prose-ol:my-5 prose-img:rounded-lg prose-a:text-primary"
      />
      <div className="px-4 py-2 border-t border-border bg-muted/30 text-[11px] text-muted-foreground">
        Tip: drag &amp; drop or paste an image straight into the article. Use the spacing and divider buttons to separate sections.
      </div>
    </div>
  );
};

export default RichTextEditor;
