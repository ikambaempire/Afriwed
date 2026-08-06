import { ReactNode, useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import RichTextEditor from "./RichTextEditor";
import { X, Settings2, Search, Eye, Save } from "lucide-react";

interface Props {
  open: boolean;
  isNew: boolean;
  title: string;
  onTitleChange: (v: string) => void;
  contentHtml: string;
  onContentChange: (html: string) => void;
  editorKey: string;
  postPanel: ReactNode;
  seoPanel: ReactNode;
  onClose: () => void;
  onSaveDraft: () => void;
  onPublish: () => void;
  publishLabel: string;
  previewUrl?: string;
}

const GutenbergEditor = ({
  open, isNew, title, onTitleChange, contentHtml, onContentChange, editorKey,
  postPanel, seoPanel, onClose, onSaveDraft, onPublish, publishLabel, previewUrl,
}: Props) => {
  const [sidebar, setSidebar] = useState(true);
  const [tab, setTab] = useState<"post" | "seo">("post");

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-muted/40">
      {/* Top bar */}
      <header className="flex items-center gap-2 h-14 px-2 sm:px-4 border-b border-border bg-background shrink-0">
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close editor">
          <X className="w-5 h-5" />
        </Button>
        <span className="text-sm font-medium hidden sm:block">
          {isNew ? "New article" : "Edit article"}
        </span>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onSaveDraft}>
            <Save className="w-4 h-4 mr-1" />Save draft
          </Button>
          {previewUrl && (
            <Button variant="outline" size="sm" asChild>
              <a href={previewUrl} target="_blank" rel="noreferrer"><Eye className="w-4 h-4 mr-1" />Preview</a>
            </Button>
          )}
          <Button size="sm" onClick={onPublish}>{publishLabel}</Button>
          <Button
            variant={sidebar ? "secondary" : "ghost"} size="icon"
            onClick={() => setSidebar(s => !s)} aria-label="Toggle settings"
          >
            <Settings2 className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <div className="flex-1 flex min-h-0">
        {/* Canvas */}
        <ScrollArea className="flex-1">
          <div className="mx-auto max-w-3xl my-6 sm:my-10 bg-background rounded-md border border-border shadow-sm">
            <div className="px-6 sm:px-14 pt-10">
              <input
                value={title}
                onChange={e => onTitleChange(e.target.value)}
                placeholder="Add title"
                className="gutenberg-title w-full bg-transparent border-0 outline-none font-display text-3xl sm:text-5xl font-bold leading-tight placeholder:text-muted-foreground/60"
              />
            </div>
            <RichTextEditor
              key={editorKey}
              variant="canvas"
              value={contentHtml}
              onChange={onContentChange}
            />
          </div>
        </ScrollArea>

        {/* Sidebar */}
        {sidebar && (
          <aside className="hidden lg:flex w-[340px] shrink-0 flex-col border-l border-border bg-background">
            <div className="flex border-b border-border">
              {([["post", "Post", Settings2], ["seo", "SEO", Search]] as const).map(([k, label, Icon]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setTab(k as any)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium border-b-2 transition-colors ${
                    tab === k ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="w-4 h-4" />{label}
                </button>
              ))}
            </div>
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-5">{tab === "post" ? postPanel : seoPanel}</div>
            </ScrollArea>
          </aside>
        )}
      </div>

      {/* Mobile settings drawer */}
      {sidebar && (
        <div className="lg:hidden border-t border-border bg-background max-h-[45vh] overflow-y-auto">
          <div className="flex border-b border-border sticky top-0 bg-background">
            {([["post", "Post"], ["seo", "SEO"]] as const).map(([k, label]) => (
              <button
                key={k}
                type="button"
                onClick={() => setTab(k as any)}
                className={`flex-1 py-3 text-sm font-medium border-b-2 ${tab === k ? "border-primary" : "border-transparent text-muted-foreground"}`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="p-4 space-y-5">{tab === "post" ? postPanel : seoPanel}</div>
        </div>
      )}
    </div>
  );
};

export default GutenbergEditor;
