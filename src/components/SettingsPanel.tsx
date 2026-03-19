import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const models = [
  { value: "gemini-flash", label: "Gemini Flash (fast)" },
  { value: "gemini-pro", label: "Gemini Pro (precise)" },
];

export type ModelId = (typeof models)[number]["value"];

interface Props {
  model: ModelId;
  onModelChange: (model: ModelId) => void;
}

export default function SettingsPanel({ model, onModelChange }: Props) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-primary">Settings</h3>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">Model</span>
        <Select value={model} onValueChange={onModelChange}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {models.map((m) => (
              <SelectItem key={m.value} value={m.value}>
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
