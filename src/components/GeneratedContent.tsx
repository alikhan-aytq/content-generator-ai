import { Copy, Download, Share2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import jsPDF from "jspdf";

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

  const handleDownloadPDF = () => {
    try {
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 56;
      const maxWidth = pageWidth - margin * 2;
      let y = margin;

      // Strip emojis & symbols Helvetica can't render (keep basic latin + punctuation + cyrillic)
      const stripUnsupported = (s: string) =>
        s
          // remove emoji ranges & pictographs
          .replace(
            /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F000}-\u{1F2FF}\u{2300}-\u{23FF}\u{2B00}-\u{2BFF}\uFE0F\u200D]/gu,
            ""
          )
          .replace(/\s+$/g, "");

      const ensureSpace = (needed: number) => {
        if (y + needed > pageHeight - margin) {
          doc.addPage();
          y = margin;
        }
      };

      const writeWrapped = (
        text: string,
        opts: { size: number; style: "normal" | "bold"; indent?: number; bullet?: string; gapAfter?: number }
      ) => {
        const indent = opts.indent ?? 0;
        const bullet = opts.bullet ?? "";
        doc.setFont("helvetica", opts.style);
        doc.setFontSize(opts.size);
        const lineHeight = opts.size * 1.4;
        const bulletWidth = bullet ? doc.getTextWidth(bullet + " ") : 0;
        const wrapWidth = maxWidth - indent - bulletWidth;
        const lines = doc.splitTextToSize(text, wrapWidth);
        lines.forEach((line: string, i: number) => {
          ensureSpace(lineHeight);
          if (i === 0 && bullet) {
            doc.text(bullet, margin + indent, y);
          }
          doc.text(line, margin + indent + bulletWidth, y);
          y += lineHeight;
        });
        if (opts.gapAfter) y += opts.gapAfter;
      };

      const rawLines = content.split("\n");
      for (let raw of rawLines) {
        let line = stripUnsupported(raw);
        // remove inline markdown emphasis & code ticks
        line = line
          .replace(/\*\*(.+?)\*\*/g, "$1")
          .replace(/__(.+?)__/g, "$1")
          .replace(/`([^`]+)`/g, "$1");

        const trimmed = line.trim();
        if (!trimmed) {
          y += 8;
          continue;
        }

        // Headings
        const h = trimmed.match(/^(#{1,6})\s+(.*)$/);
        if (h) {
          const level = h[1].length;
          const sizes = [18, 16, 14, 13, 12, 12];
          const size = sizes[level - 1];
          y += 6;
          writeWrapped(h[2], { size, style: "bold", gapAfter: 6 });
          continue;
        }

        // Bullets (-, *, •) with possible leading spaces for nesting
        const bullet = line.match(/^(\s*)[-*•]\s+(.*)$/);
        if (bullet) {
          const depth = Math.floor(bullet[1].length / 2);
          const indent = 14 + depth * 14;
          writeWrapped(bullet[2].replace(/^\*+\s*/, ""), {
            size: 11,
            style: "normal",
            indent,
            bullet: "•",
          });
          continue;
        }

        // Numbered list
        const num = line.match(/^(\s*)(\d+)\.\s+(.*)$/);
        if (num) {
          const depth = Math.floor(num[1].length / 2);
          const indent = 14 + depth * 14;
          writeWrapped(num[3], {
            size: 11,
            style: "normal",
            indent,
            bullet: `${num[2]}.`,
          });
          continue;
        }

        // Horizontal rule / separator
        if (/^-{3,}$/.test(trimmed)) {
          y += 4;
          ensureSpace(10);
          doc.setDrawColor(180);
          doc.line(margin, y, pageWidth - margin, y);
          y += 10;
          continue;
        }

        // Paragraph
        writeWrapped(line, { size: 11, style: "normal", gapAfter: 6 });
      }

      doc.save("generated-content.pdf");
      toast.success("PDF downloaded!");
    } catch {
      toast.error("Failed to generate PDF");
    }
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
              <Download size={14} className="mr-1" /> TXT
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
              <FileText size={14} className="mr-1" /> PDF
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
