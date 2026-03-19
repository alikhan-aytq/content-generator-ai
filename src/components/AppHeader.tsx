import { Sparkles } from "lucide-react";

export default function AppHeader() {
  return (
    <header className="flex items-center justify-between border-b bg-card px-6 py-3">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
          <Sparkles size={18} className="text-primary-foreground" />
        </div>
        <h1 className="text-lg font-semibold">AI Content Generator</h1>
      </div>
    </header>
  );
}
