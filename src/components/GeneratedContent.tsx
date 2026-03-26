import { Copy, Download, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

interface Props {
  content: string;
  isLoading: boolean;
}

export default function GeneratedContent({ content, isLoading }: Props) {
  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    toast.success("Copied!");
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "generated-content.txt";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("File downloaded!");
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({ text: content });
    } else {
      await navigator.clipboard.writeText(content);
      toast.success("Link copied!");
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mb-3 flex shrink-0 items-center justify-between">
        <h3 className="text-sm font-medium text-primary">Generated Content</h3>
        {content && (
          <div className="flex gap-1">
            <Button variant="outline" size="sm" onClick={handleCopy}>
              <Copy size={14} className="mr-1" /> Copy
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download size={14} className="mr-1" /> Download
            </Button>
            <Button variant="outline" size="sm" onClick={handleShare}>
              <Share2 size={14} className="mr-1" /> Share
            </Button>
          </div>
        )}
      </div>
      <div className="flex-1 min-h-0 rounded-lg border bg-muted/30 p-5">
        <div className="h-full overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-muted-foreground/30 scrollbar-track-transparent">
          {isLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse [animation-delay:150ms]" />
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse [animation-delay:300ms]" />
              <span className="ml-2 text-xs">Generating...</span>
            </div>
          ) : content ? (
            <div className="prose prose-sm dark:prose-invert max-w-none text-[13px] leading-7 [&_p]:mb-5 [&_h1]:mb-3 [&_h2]:mb-3 [&_h3]:mb-2 [&_ul]:mb-4 [&_ol]:mb-4 [&_li]:mb-1.5">
              <ReactMarkdown>{content}</ReactMarkdown>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">
              Generated content will appear here...
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
