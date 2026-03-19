import { FileText } from "lucide-react";

export interface Project {
  id: string;
  title: string;
  type: string;
  date: string;
  prompt: string;
  generatedContent: string;
}

interface Props {
  projects: Project[];
  onSelect: (project: Project) => void;
}

export default function RecentProjects({ projects, onSelect }: Props) {
  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Recent Projects
      </h3>
      {projects.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">No projects yet</p>
      ) : (
        <div className="space-y-1">
          {projects.map((p) => (
            <button
              key={p.id}
              onClick={() => onSelect(p)}
              className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-accent transition-colors"
            >
              <FileText size={14} className="text-muted-foreground shrink-0" />
              <span className="truncate">{p.title}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
