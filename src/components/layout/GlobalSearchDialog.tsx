import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import {
  BriefcaseBusiness,
  Building2,
  CheckSquare,
  FileText,
  Search,
  X,
  type LucideIcon,
} from "lucide-react";

import { useDataStore } from "../../context/DataStoreContext";
import { mockAudioMinutes } from "../../data/mock";

type ResultKind = "customer" | "project" | "minute" | "task";

interface GlobalSearchResult {
  id: string;
  kind: ResultKind;
  title: string;
  subtitle: string;
  searchable: string;
  path: string;
}

interface GlobalSearchDialogProps {
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
}

const groups: { kind: ResultKind; label: string; icon: LucideIcon }[] = [
  { kind: "customer", label: "顧客", icon: Building2 },
  { kind: "project", label: "案件", icon: BriefcaseBusiness },
  { kind: "minute", label: "議事録", icon: FileText },
  { kind: "task", label: "タスク", icon: CheckSquare },
];

function normalizeSearch(value: string) {
  return value.toLowerCase().replace(/\s+/g, "");
}

export default function GlobalSearchDialog({
  open,
  onOpen,
  onClose,
}: GlobalSearchDialogProps) {
  const { customers, profiles, projects, tasks } = useDataStore();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        if (open) onClose();
        else onOpen();
      }

      if (open && event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, onOpen, open]);

  useEffect(() => {
    if (!open) return;

    const frame = window.requestAnimationFrame(() => {
      setQuery("");
      inputRef.current?.focus();
    });
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.cancelAnimationFrame(frame);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  const results = useMemo<GlobalSearchResult[]>(() => {
    const customerById = new Map(customers.map((customer) => [customer.id, customer]));
    const projectById = new Map(projects.map((project) => [project.id, project]));
    const profileById = new Map(profiles.map((profile) => [profile.id, profile]));

    const customerResults = customers.map((customer) => ({
      id: customer.id,
      kind: "customer" as const,
      title: customer.name,
      subtitle: [customer.company_code, customer.industry.join("、")]
        .filter(Boolean)
        .join(" / "),
      searchable: [
        customer.name,
        customer.company_code,
        customer.industry.join(" "),
        customer.labels?.join(" "),
        customer.email,
        customer.phone,
        customer.address,
        customer.note,
      ].join(" "),
      path: `/customers/${customer.id}`,
    }));

    const projectResults = projects.map((project) => {
      const customer = project.customer_id
        ? customerById.get(project.customer_id)
        : undefined;
      const owner = profileById.get(project.user_id);

      return {
        id: project.id,
        kind: "project" as const,
        title: project.name,
        subtitle: [customer?.name ?? "顧客未紐づけ", owner?.name]
          .filter(Boolean)
          .join(" / "),
        searchable: [
          project.name,
          customer?.name,
          customer?.industry.join(" "),
          owner?.name,
          project.labels?.join(" "),
          project.note,
          project.next_action,
        ].join(" "),
        path: `/projects/${project.id}`,
      };
    });

    const minuteResults = mockAudioMinutes.map((minute) => {
      const customer = minute.customer_id
        ? customerById.get(minute.customer_id)
        : undefined;
      const project = minute.project_id
        ? projectById.get(minute.project_id)
        : undefined;
      const owner = profileById.get(minute.user_id);

      return {
        id: minute.id,
        kind: "minute" as const,
        title: minute.title || "無題の議事録",
        subtitle: [customer?.name ?? "顧客未紐づけ", project?.name, owner?.name]
          .filter(Boolean)
          .join(" / "),
        searchable: [
          minute.title,
          customer?.name,
          project?.name,
          owner?.name,
          minute.summary,
          minute.transcript,
          minute.recording_date,
        ].join(" "),
        path: `/minutes/${minute.id}`,
      };
    });

    const taskResults = tasks.map((task) => {
      const customer = customerById.get(task.customer_id);
      const project = task.project_id ? projectById.get(task.project_id) : undefined;
      const owner = profileById.get(task.user_id);

      return {
        id: task.id,
        kind: "task" as const,
        title: task.title,
        subtitle: [customer?.name, project?.name, owner?.name, task.due_date]
          .filter(Boolean)
          .join(" / "),
        searchable: [
          task.title,
          customer?.name,
          project?.name,
          owner?.name,
          task.due_date,
        ].join(" "),
        path: `/tasks/${task.id}`,
      };
    });

    const normalizedQuery = normalizeSearch(query);
    if (!normalizedQuery) return [];

    return [
      ...customerResults,
      ...projectResults,
      ...minuteResults,
      ...taskResults,
    ].filter((result) =>
      normalizeSearch(result.searchable).includes(normalizedQuery),
    );
  }, [customers, profiles, projects, query, tasks]);

  function chooseResult(result: GlobalSearchResult) {
    onClose();
    navigate(result.path);
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16, ease: "easeOut" }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-foreground/20 px-4 backdrop-blur-[2px]"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) onClose();
          }}
        >
          <motion.section
            initial={{ opacity: 0, scale: 0.97, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -8 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            aria-label="すべてを検索"
            aria-modal="true"
            role="dialog"
            className="flex max-h-[70vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl"
          >
            <div className="flex items-center gap-3 border-b border-border px-4 py-3">
              <Search className="h-5 w-5 shrink-0 text-muted-foreground" />
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="顧客・案件・議事録・タスクを検索..."
                className="h-10 min-w-0 flex-1 bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground"
              />
              <button
                type="button"
                aria-label="検索を閉じる"
                onClick={onClose}
                className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="min-h-52 overflow-y-auto p-2">
              {!query.trim() && (
                <p className="px-4 py-12 text-center text-sm text-muted-foreground">
                  キーワードを入力して全データを検索します
                </p>
              )}

              {query.trim() && results.length === 0 && (
                <p className="px-4 py-12 text-center text-sm text-muted-foreground">
                  「{query}」に一致するデータがありません
                </p>
              )}

              {groups.map(({ kind, label, icon: Icon }) => {
                const sectionResults = results.filter((result) => result.kind === kind);
                if (sectionResults.length === 0) return null;

                return (
                  <div key={kind} className="mb-2 last:mb-0">
                    <p className="px-3 pb-1 pt-2 text-xs font-semibold text-muted-foreground">
                      {label} <span className="ml-1">{sectionResults.length}</span>
                    </p>
                    {sectionResults.map((result) => (
                      <button
                        type="button"
                        key={`${result.kind}-${result.id}`}
                        onClick={() => chooseResult(result)}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-muted focus:bg-muted focus:outline-none"
                      >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-secondary text-muted-foreground">
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium text-foreground">
                            {result.title}
                          </span>
                          <span className="block truncate text-xs text-muted-foreground">
                            {result.subtitle || label}
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>

            <div className="border-t border-border px-4 py-2 text-xs text-muted-foreground">
              結果を選択して詳細ページへ移動 ・ Esc で閉じる
            </div>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
