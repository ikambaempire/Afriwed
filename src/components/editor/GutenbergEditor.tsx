import { ReactNode, useState } from "react";
import { Button } from "@/components/ui/button";

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

  const tabs = (
    <div className="flex border-b border-border sticky top-0 bg-background z-10">
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
  );

  const panel = <div className="p-4 space-y-5 pb-24">{tab === "post" ? postPanel : seoPanel}</div>;

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
        {/* Canvas — full page scroll */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          <div className="mx-auto max-w-3xl my-6 sm:my-10 bg-background rounded-md border border-border shadow-sm">
            <RichTextEditor
              key={editorKey}
              variant="canvas"
              value={contentHtml}
              onChange={onContentChange}
              header={
                <div className="px-6 sm:px-14 pt-8">
                  <input
                    value={title}
                    onChange={e => onTitleChange(e.target.value)}
                    placeholder="Add title"
                    className="gutenberg-title w-full bg-transparent border-0 outline-none font-display text-3xl sm:text-5xl font-bold leading-tight placeholder:text-muted-foreground/60"
                  />
                </div>
              }
            />
          </div>

          {/* Settings below the article on small screens — full height, nothing cut off */}
          {sidebar && (
            <div className="lg:hidden mx-auto max-w-3xl mb-10 bg-background rounded-md border border-border">
              {tabs}
              {panel}
            </div>
          )}
        </div>

        {/* Sidebar */}
        {sidebar && (
          <aside className="hidden lg:flex w-[360px] shrink-0 flex-col border-l border-border bg-background">
            {tabs}
            <div className="flex-1 overflow-y-auto overscroll-contain">{panel}</div>
          </aside>
        )}
      </div>
    </div>
  );
};


export default GutenbergEditor;
