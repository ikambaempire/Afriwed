import { useState } from "react";
import { Check, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type StoryShareButtonProps = {
  slug: string;
  title: string;
  excerpt?: string | null;
  version?: string | null;
  className?: string;
};

const StoryShareButton = ({ slug, title, excerpt, version, className }: StoryShareButtonProps) => {
  const [copied, setCopied] = useState(false);

  const shareStory = async () => {
    // Lovable hosting serves a static SPA shell, so crawlers can't read per-story
    // tags from the React route. This endpoint returns real OG tags and then
    // redirects real visitors to the story page.
    const url = new URL(
      "https://uoxajklqakmjppejqlor.supabase.co/functions/v1/story-share",
    );
    url.searchParams.set("slug", slug);
    if (version) url.searchParams.set("v", new Date(version).getTime().toString(36));


    const shareData = {
      title,
      text: (excerpt || `Read “${title}” on Afriwedd`).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
      url: url.toString(),
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }

      await navigator.clipboard.writeText(shareData.url);
      setCopied(true);
      toast.success("Story link copied");
      window.setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      toast.error("Could not share this story");
    }
  };

  return (
    <Button type="button" variant="outline" onClick={shareStory} className={className}>
      {copied ? <Check aria-hidden="true" /> : <Share2 aria-hidden="true" />}
      {copied ? "Copied" : "Share story"}
    </Button>
  );
};

export default StoryShareButton;