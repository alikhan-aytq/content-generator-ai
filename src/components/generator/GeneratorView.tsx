import { useState, useCallback, useEffect } from "react";
import ContentTypeSelector, { type ContentType } from "@/components/ContentTypeSelector";
import PromptInput from "@/components/PromptInput";
import PromptTemplates from "@/components/generator/PromptTemplates";
import SettingsPanel, { type ModelId } from "@/components/SettingsPanel";
import GeneratedContent from "@/components/GeneratedContent";
import { Button } from "@/components/ui/button";
import { Wand2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Project } from "@/components/RecentProjects";

const audiences = [
  { id: "general", label: "General" },
  { id: "professional", label: "Professional" },
  { id: "young", label: "Gen Z / Youth" },
  { id: "business", label: "B2B / Business" },
  { id: "creative", label: "Creative / Artists" },
] as const;

const styles = [
  { id: "formal", label: "Formal" },
  { id: "casual", label: "Casual" },
  { id: "humorous", label: "Humorous" },
  { id: "persuasive", label: "Persuasive" },
  { id: "storytelling", label: "Storytelling" },
] as const;

export type AudienceId = (typeof audiences)[number]["id"];
export type StyleId = (typeof styles)[number]["id"];

interface Props {
  model: ModelId;
  onModelChange: (m: ModelId) => void;
  projects: Project[];
  onProjectsChange: (p: Project[]) => void;
  selectedProjectId: string | null;
  onSelectedProjectIdChange: (id: string | null) => void;
  resetToken: number;
}

export default function GeneratorView({
  model,
  onModelChange,
  projects,
  onProjectsChange,
  selectedProjectId,
  onSelectedProjectIdChange,
  resetToken,
}: Props) {
  const { user } = useAuth();
  const [contentType, setContentType] = useState<ContentType>("social");
  const [prompt, setPrompt] = useState("");
  const [audience, setAudience] = useState<AudienceId>("general");
  const [style, setStyle] = useState<StyleId>("casual");
  const [generatedContent, setGeneratedContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const clearGeneratorState = useCallback(() => {
    setPrompt("");
    setGeneratedContent("");
    setContentType("social");
    setAudience("general");
    setStyle("casual");
  }, []);

  useEffect(() => {
    if (selectedProjectId === null) {
      clearGeneratorState();
    }
  }, [selectedProjectId, resetToken, clearGeneratorState]);

  useEffect(() => {
    if (!selectedProjectId) return;

    const project = projects.find((p) => p.id === selectedProjectId);
    if (project) {
      setPrompt(project.prompt);
      setContentType(project.type as ContentType);
      setGeneratedContent(project.generatedContent);
    }
  }, [selectedProjectId, projects]);

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a prompt");
      return;
    }
    setIsLoading(true);

    const enrichedPrompt = `Content Type: ${contentType}\nTarget Audience: ${audience}\nWriting Style: ${style}\n\nUser Request:\n${prompt}\n\nPlease generate the content AND provide a brief instruction guide on how to best use this content, including:\n- Best posting times/channels\n- Key points to emphasize\n- Suggested hashtags or CTAs\n- Tips for maximum engagement`;

    try {
      const { data, error } = await supabase.functions.invoke("generate-content", {
        body: { prompt: enrichedPrompt, contentType, model },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const content = data.content ?? "";
      setGeneratedContent(content);

      if (user) {
        const { data: inserted, error: insertErr } = await supabase
          .from("generation_history")
          .insert({
            user_id: user.id,
            prompt,
            content_type: `generator-${contentType}`,
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
          onSelectedProjectIdChange(inserted.id);
          onProjectsChange([newProject, ...projects].slice(0, 20));
        }
      }
    } catch (err: any) {
      toast.error(err?.message || "Generation error");
    } finally {
      setIsLoading(false);
    }
  }, [prompt, contentType, model, audience, style, user, projects]);

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:overflow-hidden">
      <div className="mx-auto grid max-w-7xl gap-6 lg:h-full lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-stretch">
        {/* Left column: settings + generate button */}
        <div className="flex min-h-0 flex-col">
          <div className="flex flex-1 flex-col rounded-xl border bg-card p-3 lg:min-h-0 lg:h-full">
            <div className="flex-1 space-y-3 lg:min-h-0">
              <div className="space-y-2">
                <label className="text-sm font-medium text-primary">Content Type</label>
                <ContentTypeSelector selected={contentType} onSelect={setContentType} />
              </div>

              {/* Audience */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-primary">Target Audience</label>
                <div className="flex flex-wrap gap-2">
                  {audiences.map(({ id, label }) => (
                    <button
                      key={id}
                      onClick={() => setAudience(id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        audience === id
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "bg-secondary text-secondary-foreground hover:bg-accent"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Style */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-primary">Writing Style</label>
                <div className="flex flex-wrap gap-2">
                  {styles.map(({ id, label }) => (
                    <button
                      key={id}
                      onClick={() => setStyle(id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        style === id
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "bg-secondary text-secondary-foreground hover:bg-accent"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-primary">Prompt</label>
                  <PromptTemplates onSelect={setPrompt} />
                </div>
                <PromptInput value={prompt} onChange={setPrompt} disabled={isLoading} />
              </div>

              <SettingsPanel model={model} onModelChange={onModelChange} />
            </div>

            <div className="shrink-0 pt-3">
              <Button
                className="w-full h-11 text-sm font-semibold"
                onClick={handleGenerate}
                disabled={isLoading || !prompt.trim()}
              >
                <Wand2 size={16} className="mr-2" />
                {isLoading ? "Generating..." : "Generate Content"}
              </Button>
            </div>
          </div>
        </div>

        {/* Right column: generated content — stretches to match left */}
        <div className="flex min-h-0 flex-col">
          <div className="flex flex-1 flex-col rounded-xl border bg-card p-4 lg:min-h-0 lg:h-full">
            <GeneratedContent content={generatedContent} isLoading={isLoading} />
          </div>
        </div>
      </div>
    </div>
  );
}
