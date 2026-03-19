import { Copy, Download, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

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
    <div className="flex flex-col h-full gap-4">
      <div className="flex items-center justify-between">
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
      <div className="flex-1 rounded-lg border bg-muted/30 p-4 min-h-[300px] overflow-auto">
        {isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse [animation-delay:150ms]" />
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse [animation-delay:300ms]" />
            <span className="ml-2 text-sm">Generating...</span>
          </div>
        ) : content ? (
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
        ) : (
          <p className="text-sm text-muted-foreground italic">
            Generated content will appear here...
          </p>
        )}
      </div>
    </div>
  );
}
