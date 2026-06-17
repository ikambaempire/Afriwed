import { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Bold, Italic, Underline, Link as LinkIcon, Image as ImageIcon, Heading2, Quote, List, Undo2, Redo2 } from "lucide-react";

interface Props {
  value: string;
  onChange: (html: string) => void;
}

const RichTextEditor = ({ value, onChange }: Props) => {
  const ref = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  // Only set innerHTML on mount or when external value changes drastically (e.g. switching article)
  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value) {
      ref.current.innerHTML = value || "";
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const exec = (cmd: string, arg?: string) => {
    document.execCommand(cmd, false, arg);
    if (ref.current) onChange(ref.current.innerHTML);
    ref.current?.focus();
  };

  const insertLink = () => {
    const url = window.prompt("Enter URL (https://...)");
    if (!url) return;
    exec("createLink", url);
    // Make links open in new tab
    if (ref.current) {
      ref.current.querySelectorAll("a").forEach(a => {
        a.setAttribute("target", "_blank");
        a.setAttribute("rel", "noopener noreferrer");
      });
      onChange(ref.current.innerHTML);
    }
  };

  const insertImageUrl = () => {
    const url = window.prompt("Image URL");
    if (!url) return;
    exec("insertImage", url);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error("Image must be under 10MB"); return; }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `blog/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from("vendor-media").upload(path, file, { cacheControl: "3600" });
      if (error) throw error;
      const { data } = supabase.storage.from("vendor-media").getPublicUrl(path);
      exec("insertImage", data.publicUrl);
      toast.success("Image inserted");
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const onInput = () => {
    if (ref.current) onChange(ref.current.innerHTML);
  };

  return (
    <div className="border border-input rounded-md overflow-hidden bg-background">
      <div className="flex flex-wrap gap-1 p-2 border-b border-border bg-muted/40">
        <Button type="button" size="sm" variant="ghost" onClick={() => exec("bold")} title="Bold"><Bold className="w-4 h-4" /></Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => exec("italic")} title="Italic"><Italic className="w-4 h-4" /></Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => exec("underline")} title="Underline"><Underline className="w-4 h-4" /></Button>
        <span className="w-px bg-border mx-1" />
        <Button type="button" size="sm" variant="ghost" onClick={() => exec("formatBlock", "<h2>")} title="Heading"><Heading2 className="w-4 h-4" /></Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => exec("formatBlock", "<blockquote>")} title="Quote"><Quote className="w-4 h-4" /></Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => exec("insertUnorderedList")} title="List"><List className="w-4 h-4" /></Button>
        <span className="w-px bg-border mx-1" />
        <Button type="button" size="sm" variant="ghost" onClick={insertLink} title="Insert link"><LinkIcon className="w-4 h-4" /></Button>
        <Button type="button" size="sm" variant="ghost" onClick={insertImageUrl} title="Insert image by URL"><ImageIcon className="w-4 h-4" /></Button>
        <Button type="button" size="sm" variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading} title="Upload image from device">
          <ImageIcon className="w-4 h-4 mr-1" />{uploading ? "Uploading…" : "Upload"}
        </Button>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleUpload} />
        <span className="w-px bg-border mx-1" />
        <Button type="button" size="sm" variant="ghost" onClick={() => exec("undo")} title="Undo"><Undo2 className="w-4 h-4" /></Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => exec("redo")} title="Redo"><Redo2 className="w-4 h-4" /></Button>
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={onInput}
        onBlur={onInput}
        className="prose prose-sm max-w-none p-4 min-h-[320px] focus:outline-none prose-img:rounded-lg prose-a:text-primary"
      />
    </div>
  );
};

export default RichTextEditor;
