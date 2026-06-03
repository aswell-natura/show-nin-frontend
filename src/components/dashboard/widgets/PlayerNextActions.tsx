import { useAuth } from "../../../context/AuthContext";
import { useDataStore } from "../../../context/DataStoreContext";
import { StandardWidget } from "../shared/StandardWidget";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { CalendarDays, ChevronRight } from "lucide-react";

function formatDeadline(date?: string) {
  if (!date) return "期限未設定";
  return new Date(`${date}T00:00:00`).toLocaleDateString("ja-JP", {
    month: "numeric",
    day: "numeric",
  });
}

export default function PlayerNextActions() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { projects } = useDataStore();

  const nextActionProjects = projects
    .filter(
      (project) =>
        project.user_id === currentUser!.id && project.next_action?.trim(),
    )
    .sort((a, b) => {
      if (!a.next_action_date) return 1;
      if (!b.next_action_date) return -1;
      return a.next_action_date.localeCompare(b.next_action_date);
    });

  return (
    <StandardWidget
      title="ネクストアクション"
      description="案件ごとのネクストアクションと期限"
      action={
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/projects")}
          className="font-bold text-muted-foreground hover:text-primary transition-colors"
        >
          詳細
          <ChevronRight className="ml-1 h-3.5 w-3.5" />
        </Button>
      }
      items={nextActionProjects}
      keyExtractor={(project) => project.id}
      maxItems={10}
      onSeeMore={() => navigate("/projects")}
      emptyMessage="ネクストアクションが登録されていません"
      renderItem={(project) => (
        <button
          onClick={() => navigate(`/projects/${project.id}`)}
          className="w-full px-4 py-3 text-left hover:bg-muted/50 transition-colors group"
        >
          <p className="text-sm font-bold text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">
            {project.next_action}
          </p>
          <div className="mt-2 flex items-center justify-between gap-3 text-[10px] font-bold text-muted-foreground">
            <span className="truncate uppercase tracking-tight">
              {project.name}
            </span>
            <span className="flex shrink-0 items-center gap-1">
              <CalendarDays className="h-3 w-3" />
              期限: {formatDeadline(project.next_action_date)}
            </span>
          </div>
        </button>
      )}
    />
  );
}
