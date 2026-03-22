import { useState } from "react";
import { FileText, Trash2 } from "lucide-react";
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
  onDelete?: (projectId: string) => void;
}

export default function RecentProjects({ projects, onSelect, onDelete }: Props) {
  const [deleteId, setDeleteId] = useState<string | null>(null);

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
            <div
              key={p.id}
              className="group flex items-center gap-1 rounded-lg px-3 py-2 text-sm hover:bg-accent transition-colors"
            >
              <button
                onClick={() => onSelect(p)}
                className="flex items-center gap-2 flex-1 min-w-0 text-left"
              >
                <FileText size={14} className="text-muted-foreground shrink-0" />
                <span className="truncate">{p.title}</span>
              </button>
              {onDelete && (
                <button
                  onClick={(e) => { e.stopPropagation(); setDeleteId(p.id); }}
                  className="opacity-0 group-hover:opacity-100 shrink-0 p-1 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-all"
                  title="Delete"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this entry?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The generation history entry will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { if (deleteId && onDelete) { onDelete(deleteId); setDeleteId(null); } }}
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
