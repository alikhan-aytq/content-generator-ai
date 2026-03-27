import { BookOpen } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const templates = [
  {
    category: "Social Media",
    items: [
      { title: "Instagram Post", prompt: "Write an engaging Instagram post about [topic]. Include an emotional headline, body text with a call to action, and 10 relevant hashtags." },
      { title: "Twitter/X Thread", prompt: "Create a thread of 5-7 tweets on [topic]. The first tweet should be a hook, the last one a call to action. Each tweet under 280 characters." },
      { title: "LinkedIn Post", prompt: "Write a professional LinkedIn post about [topic]. Start with a provocative question or statistic, develop the idea, and end with a discussion prompt." },
    ],
  },
  {
    category: "Email",
    items: [
      { title: "Welcome Email", prompt: "Write a welcome email for a new subscriber of [product/service]. Tone: friendly and professional. Include: greeting, subscription value, next steps, CTA." },
      { title: "Promo Newsletter", prompt: "Create a promotional email for [product/offer]. Include: catchy subject line, short offer description, 3 key benefits, and a CTA button." },
      { title: "Follow-up Email", prompt: "Write a follow-up email after [event: meeting/webinar/purchase]. Thank them, recap key points, and suggest the next step." },
    ],
  },
  {
    category: "SEO",
    items: [
      { title: "SEO Article", prompt: "Write an SEO-optimized article on [topic]. Include: H1 headline with keyword, 3-5 H2 subheadings, meta description under 160 characters, natural keyword usage." },
      { title: "Meta Descriptions", prompt: "Create 5 meta description variants for the [page/topic] page. Each under 160 characters, with the keyword [keyword] and a call to action." },
    ],
  },
  {
    category: "Product",
    items: [
      { title: "Product Description", prompt: "Write a compelling product description for [product]. Include: headline, 3-5 key benefits, technical specs, target audience, and a purchase CTA." },
      { title: "Landing Page Copy", prompt: "Create copy for a [product/service] landing page. Structure: hero section with USP, problem → solution, 3 benefits, social proof, FAQ (3 questions), final CTA." },
    ],
  },
];

interface Props {
  onSelect: (prompt: string) => void;
}

export default function PromptTemplates({ onSelect }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <BookOpen size={14} />
          Templates
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 max-h-80 overflow-y-auto p-0" align="start">
        {templates.map((group) => (
          <div key={group.category}>
            <div className="sticky top-0 bg-popover px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b">
              {group.category}
            </div>
            {group.items.map((item) => (
              <button
                key={item.title}
                onClick={() => {
                  onSelect(item.prompt);
                  setOpen(false);
                }}
                className="w-full text-left px-3 py-2.5 text-sm hover:bg-accent transition-colors border-b border-border/50 last:border-b-0"
              >
                <span className="font-medium">{item.title}</span>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{item.prompt}</p>
              </button>
            ))}
          </div>
        ))}
      </PopoverContent>
    </Popover>
  );
}
