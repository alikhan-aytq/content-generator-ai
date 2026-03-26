import { useState, useEffect } from "react";
import AppHeader from "@/components/AppHeader";
import ChatView, { type Conversation } from "@/components/chat/ChatView";
import GeneratorView from "@/components/generator/GeneratorView";
import type { Project } from "@/components/RecentProjects";
import type { ModelId } from "@/components/SettingsPanel";
import { MessageSquare, Wand2, Plus, FileText, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Mode = "chat" | "generator";

export default function Index() {
  const { user } = useAuth();
  const [mode, setMode] = useState<Mode>("chat");
  const [model, setModel] = useState<ModelId>("gemini-flash");

  // Chat state
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [chatResetToken, setChatResetToken] = useState(0);

  // Generator state
  const [genProjects, setGenProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [generatorResetToken, setGeneratorResetToken] = useState(0);

  // Delete dialog
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteType, setDeleteType] = useState<Mode>("chat");

  const userId = user?.id;

  // Load history
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    const load = async () => {
      const { data, error } = await supabase
        .from("generation_history")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(40);

      if (error || !data || cancelled) return;

      const chats: Conversation[] = [];
      const gens: Project[] = [];

      data.forEach((row: any) => {
        if (row.content_type === "chat") {
          let msgs = [];
          try {
            msgs = JSON.parse(row.generated_content);
          } catch {
            msgs = [];
          }
          chats.push({
            id: row.id,
            title: row.prompt.slice(0, 40) + (row.prompt.length > 40 ? "..." : ""),
            date: new Date(row.created_at).toLocaleDateString("en-US"),
            messages: msgs,
          });
        } else {
          gens.push({
            id: row.id,
            title: row.prompt.slice(0, 40) + (row.prompt.length > 40 ? "..." : ""),
            type: row.content_type.replace("generator-", ""),
            date: new Date(row.created_at).toLocaleDateString("en-US"),
            prompt: row.prompt,
            generatedContent: row.generated_content,
          });
        }
      });

      setConversations(chats);
      setGenProjects(gens);
    };

    load();
    return () => { cancelled = true; };
  }, [userId]);

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("generation_history").delete().eq("id", deleteId);
    if (error) {
      toast.error("Failed to delete");
      setDeleteId(null);
      return;
    }
    if (deleteType === "chat") {
      setConversations((prev) => prev.filter((c) => c.id !== deleteId));
      if (activeConvId === deleteId) {
        setActiveConvId(null);
      }
    } else {
      setGenProjects((prev) => prev.filter((p) => p.id !== deleteId));
      if (selectedProjectId === deleteId) {
        setSelectedProjectId(null);
      }
    }
    toast.success("Deleted");
    setDeleteId(null);
  };

  // Reset generator when selectedProjectId becomes null
  const handleSelectedProjectIdChange = (id: string | null) => {
    setSelectedProjectId(id);
  };

  return (
    <div className="flex h-screen flex-col">
      <AppHeader />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="hidden w-60 shrink-0 border-r bg-card md:flex flex-col">
          {/* Mode switcher */}
          <div className="p-3 border-b">
            <div className="flex rounded-lg bg-muted p-1">
              <button
                onClick={() => setMode("chat")}
                className={`flex-1 flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition-all ${
                  mode === "chat"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <MessageSquare size={14} />
                AI Chat
              </button>
              <button
                onClick={() => setMode("generator")}
                className={`flex-1 flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition-all ${
                  mode === "generator"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Wand2 size={14} />
                Generator
              </button>
            </div>
          </div>

          {/* New button — shown for both modes */}
          <div className="p-3 border-b">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => {
                if (mode === "chat") {
                  setActiveConvId(null);
                  setChatResetToken((prev) => prev + 1);
                } else {
                  setSelectedProjectId(null);
                  setGeneratorResetToken((prev) => prev + 1);
                }
              }}
            >
              <Plus size={14} className="mr-1.5" />
              {mode === "chat" ? "New Chat" : "New Generation"}
            </Button>
          </div>

          {/* History list */}
          <div className="flex-1 overflow-y-auto p-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              {mode === "chat" ? "Chat History" : "Generation History"}
            </h3>
            {(mode === "chat" ? conversations : genProjects).length === 0 ? (
              <p className="text-xs text-muted-foreground italic">No history yet</p>
            ) : (
              <div className="space-y-1">
                {mode === "chat"
                  ? conversations.map((conv) => (
                      <div
                        key={conv.id}
                        className={`group flex items-center gap-1 rounded-lg px-3 py-2 text-sm hover:bg-accent transition-colors cursor-pointer ${
                          activeConvId === conv.id ? "bg-accent" : ""
                        }`}
                      >
                        <button
                          onClick={() => setActiveConvId(conv.id)}
                          className="flex items-center gap-2 flex-1 min-w-0 text-left"
                        >
                          <MessageSquare size={13} className="text-muted-foreground shrink-0" />
                          <span className="truncate text-xs">{conv.title}</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteId(conv.id);
                            setDeleteType("chat");
                          }}
                          className="opacity-0 group-hover:opacity-100 shrink-0 p-1 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-all"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))
                  : genProjects.map((proj) => (
                      <div
                        key={proj.id}
                        className={`group flex items-center gap-1 rounded-lg px-3 py-2 text-sm hover:bg-accent transition-colors cursor-pointer ${
                          selectedProjectId === proj.id ? "bg-accent" : ""
                        }`}
                      >
                        <button
                          onClick={() => setSelectedProjectId(proj.id)}
                          className="flex items-center gap-2 flex-1 min-w-0 text-left"
                        >
                          <FileText size={13} className="text-muted-foreground shrink-0" />
                          <span className="truncate text-xs">{proj.title}</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteId(proj.id);
                            setDeleteType("generator");
                          }}
                          className="opacity-0 group-hover:opacity-100 shrink-0 p-1 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-all"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
              </div>
            )}
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Mobile mode switcher */}
          <div className="md:hidden border-b p-2">
            <div className="flex rounded-lg bg-muted p-1">
              <button
                onClick={() => setMode("chat")}
                className={`flex-1 flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition-all ${
                  mode === "chat"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground"
                }`}
              >
                <MessageSquare size={14} />
                AI Chat
              </button>
              <button
                onClick={() => setMode("generator")}
                className={`flex-1 flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition-all ${
                  mode === "generator"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground"
                }`}
              >
                <Wand2 size={14} />
                Generator
              </button>
            </div>
          </div>

          {mode === "chat" ? (
            <ChatView
              model={model}
              conversations={conversations}
              activeConversationId={activeConvId}
              resetToken={chatResetToken}
              onConversationsChange={setConversations}
            />
          ) : (
            <GeneratorView
              model={model}
              onModelChange={setModel}
              projects={genProjects}
              onProjectsChange={setGenProjects}
              selectedProjectId={selectedProjectId}
              onSelectedProjectIdChange={handleSelectedProjectIdChange}
              resetToken={generatorResetToken}
            />
          )}
        </main>
      </div>

      {/* Delete dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this entry?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
