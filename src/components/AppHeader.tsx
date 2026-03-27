import { Sparkles, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/ThemeToggle";

export default function AppHeader() {
  const { user, signOut } = useAuth();

  return (
    <header className="flex items-center justify-between border-b bg-card px-6 py-3">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
          <Sparkles size={18} className="text-primary-foreground" />
        </div>
        <h1 className="text-lg font-semibold">AI Content Generator</h1>
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        {user && (
          <>
            <span className="text-xs text-muted-foreground hidden sm:inline">{user.email}</span>
            <Button variant="ghost" size="icon" onClick={signOut} title="Sign out">
              <LogOut size={16} />
            </Button>
          </>
        )}
      </div>
    </header>
  );
}
