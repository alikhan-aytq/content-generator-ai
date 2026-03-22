import { useState, useCallback, useEffect } from "react";
import AppHeader from "@/components/AppHeader";
import ContentTypeSelector, { type ContentType } from "@/components/ContentTypeSelector";
import PromptInput from "@/components/PromptInput";
import SettingsPanel, { type ModelId } from "@/components/SettingsPanel";
import GeneratedContent from "@/components/GeneratedContent";
import RecentProjects, { type Project } from "@/components/RecentProjects";
import { Button } from "@/components/ui/button";
import { Wand2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export default function Index() {
  const { user } = useAuth();
  const [contentType, setContentType] = useState<ContentType>("social");
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState<ModelId>("gemini-flash");
  const [generatedContent, setGeneratedContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  // Load history from DB on mount
  const userId = user?.id;
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    const loadHistory = async () => {
      const { data, error } = await supabase
        .from("generation_history")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10);

      if (!error && data && !cancelled) {
        setProjects(
          data.map((row) => ({
            id: row.id,
            title: row.prompt.slice(0, 40) + (row.prompt.length > 40 ? "..." : ""),
            type: row.content_type,
            date: new Date(row.created_at).toLocaleDateString("en-US"),
            prompt: row.prompt,
            generatedContent: row.generated_content,
          }))
        );
      }
    };
    loadHistory();
    return () => { cancelled = true; };
  }, [userId]);

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a prompt");
      return;
    }
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("generate-content", {
        body: { prompt, contentType, model },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const content = data.content ?? "";
      setGeneratedContent(content);

      // Save to DB
      if (user) {
        const { data: inserted, error: insertErr } = await supabase
          .from("generation_history")
          .insert({
            user_id: user.id,
            prompt,
            content_type: contentType,
            model,
            generated_content: content,
          })
          .select()
          .single();

        if (!insertErr && inserted) {
          const newProject: Project = {
            id: inserted.id,
            title: prompt.slice(0, 40) + (prompt.length > 40 ? "..." : ""),
            type: contentType,
            date: new Date(inserted.created_at).toLocaleDateString("en-US"),
            prompt,
            generatedContent: content,
          };
          setSelectedProjectId(inserted.id);
          setProjects((prev) => [newProject, ...prev].slice(0, 10));
        }
      }
    } catch (err: any) {
      const msg = err?.message || "Generation error";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, [prompt, contentType, model, user]);

  const handleProjectSelect = (project: Project) => {
    setPrompt(project.prompt);
    setContentType(project.type as ContentType);
    setGeneratedContent(project.generatedContent);
    setSelectedProjectId(project.id);
  };

  const handleProjectDelete = useCallback(async (projectId: string) => {
    const { error } = await supabase
      .from("generation_history")
      .delete()
      .eq("id", projectId);

    if (error) {
      toast.error("Failed to delete");
      return;
    }
    setProjects((prev) => prev.filter((p) => p.id !== projectId));
    setSelectedProjectId((prev) => {
      if (prev === projectId) {
        setPrompt("");
        setGeneratedContent("");
      }
      return prev === projectId ? null : prev;
    });
    toast.success("Deleted");
  }, []);

  return (
    <div className="flex h-screen flex-col">
      <AppHeader />
      <div className="flex flex-1 overflow-hidden">
        <aside className="hidden w-56 shrink-0 border-r bg-card p-4 md:block overflow-y-auto">
          <RecentProjects projects={projects} onSelect={handleProjectSelect} onDelete={handleProjectDelete} />
        </aside>

        <main className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1fr_1fr]">
            <div className="space-y-5">
              <div className="rounded-xl border bg-card p-5 space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-primary">Content Type</label>
                  <ContentTypeSelector selected={contentType} onSelect={setContentType} />
                </div>
                <PromptInput value={prompt} onChange={setPrompt} disabled={isLoading} />
              </div>

              <div className="rounded-xl border bg-card p-5">
                <SettingsPanel model={model} onModelChange={setModel} />
              </div>

              <Button
                className="w-full h-12 text-base font-semibold"
                onClick={handleGenerate}
                disabled={isLoading || !prompt.trim()}
              >
                <Wand2 size={18} className="mr-2" />
                {isLoading ? "Generating..." : "Generate Content"}
              </Button>
            </div>

            <div className="rounded-xl border bg-card p-5">
              <GeneratedContent content={generatedContent} isLoading={isLoading} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
