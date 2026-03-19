import { Textarea } from "@/components/ui/textarea";

interface Props {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export default function PromptInput({ value, onChange, disabled }: Props) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-primary">Prompt</label>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Describe the content you want to generate..."
        className="min-h-[160px] resize-none bg-muted/50 border-border focus:border-primary"
        disabled={disabled}
      />
    </div>
  );
}
