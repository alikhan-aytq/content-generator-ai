import { useState, useCallback } from "react";
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

export default function Index() {
  const [contentType, setContentType] = useState<ContentType>("social");
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState<ModelId>("gemini-flash");
  const [contentHistory, setContentHistory] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a prompt");
      return;
    }
    setIsLoading(true);
    setCurrentPage(contentHistory.length);

    try {
      const { data, error } = await supabase.functions.invoke("generate-content", {
        body: { prompt, contentType, model },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const content = data.content ?? "";
      setContentHistory((prev) => [...prev, content]);
      setCurrentPage(contentHistory.length);
      const newProject: Project = {
        id: Date.now().toString(),
        title: prompt.slice(0, 40) + (prompt.length > 40 ? "..." : ""),
        type: contentType,
        date: new Date().toLocaleDateString("en-US"),
      };
      setProjects((prev) => [newProject, ...prev].slice(0, 10));
    } catch (err: any) {
      const msg = err?.message || "Generation error";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, [prompt, contentType]);

  const handleProjectSelect = (project: Project) => {
    toast.info(`Project: ${project.title}`);
  };

  return (
    <div className="flex h-screen flex-col">
      <AppHeader />
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="hidden w-56 shrink-0 border-r bg-card p-4 lg:block overflow-y-auto">
          <RecentProjects projects={projects} onSelect={handleProjectSelect} />
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1fr_1fr]">
            {/* Left column — input */}
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

            {/* Right column — output */}
            <div className="rounded-xl border bg-card p-5">
              <GeneratedContent
                contents={contentHistory}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
                isLoading={isLoading}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
