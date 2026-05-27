import { useState, useMemo, type FormEvent } from "react";
import {
  Building2,
  Star,
  Tag,
  Check,
  X,
  Plus,
  FileText,
  Activity,
  Coins,
  User,
  Calendar,
} from "lucide-react";
import {
  LinearDialogHeader,
  LinearDialogMetadataBar,
  LinearDialogPill,
  LinearDialogTextarea,
} from "@/components/ui/linear-dialog";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { DatePicker } from "@/components/ui/date-picker";
import { useDataStore } from "../../context/DataStoreContext";
import { useGlobalDialog } from "../../context/GlobalDialogContext";
import CustomerDialogForm from "../customers/CustomerDialogForm";
import MemberDialogForm from "../members/MemberDialogForm";
import { cn } from "@/lib/utils";
import type { ProjectStatus, Project } from "@/types";

export interface ProjectDialogValues {
  name: string;
  customer_id: string | null;
  status: ProjectStatus;
  priority: 1 | 2 | 3;
  amount: number;
  close_date?: string;
  note?: string;
  labels?: string[];
  user_id: string;
  source: "recording" | "manual";
  next_action_date?: string;
}

export interface ProjectDialogFormProps {
  formId: string;
  submitLabel: string;
  initialValues?: Partial<ProjectDialogValues>;
  onSubmit: (values: ProjectDialogValues) => void;
}

const statusLabel: Record<ProjectStatus, string> = {
  lead: "リード",
  proposing: "提案中",
  negotiating: "交渉中",
  closed: "成約",
};

const priorityLabel: Record<Project["priority"], string> = {
  1: "高",
  2: "中",
  3: "低",
};

export default function ProjectDialogForm({
  formId,
  submitLabel,
  initialValues,
  onSubmit,
}: ProjectDialogFormProps) {
  const { customers, projects, profiles, addCustomer, addProfile } = useDataStore();
  const { openDialog, closeDialog } = useGlobalDialog();

  const [values, setValues] = useState({
    name: initialValues?.name ?? "",
    customer_id: initialValues?.customer_id ?? null,
    status: initialValues?.status ?? ("lead" as ProjectStatus),
    priority: initialValues?.priority ?? (2 as Project["priority"]),
    amount: initialValues?.amount?.toString() ?? "",
    close_date: initialValues?.close_date ?? "",
    note: initialValues?.note ?? "",
    labels: initialValues?.labels?.join("、") ?? "",
    user_id: initialValues?.user_id ?? "user-001",
    source: initialValues?.source ?? "manual",
    next_action_date: initialValues?.next_action_date ?? "",
  });

  // ポップオーバーの開閉管理
  const [openPopover, setOpenPopover] = useState<string | null>(null);

  // ポップオーバー内の入力用一時ステート
  const [tempLabels, setTempLabels] = useState(values.labels);
  const [tagInput, setTagInput] = useState("");
  const [isLabelsExpanded, setIsLabelsExpanded] = useState(false);

  const updateValue = <K extends keyof typeof values>(key: K, value: typeof values[K]) => {
    setValues((current) => ({ ...current, [key]: value }));
  };

  const handleCreateCustomerQuick = (name: string) => {
    const newCustomer = addCustomer({
      name,
      industry: ["未設定"],
      rank: "B",
      status: "lead",
      is_pinned: false,
      created_by: values.user_id || "user-001",
    });
    updateValue("customer_id", newCustomer.id);
    setOpenPopover(null);
  };

  const handleCreateCustomerDetail = (name: string) => {
    const formId = "add-customer-from-project-form";
    openDialog({
      mode: "add",
      eyebrow: "顧客",
      breadcrumbs: ["新規作成"],
      title: "顧客を追加",
      hideHeaderTitle: true,
      size: "xl",
      content: (
        <CustomerDialogForm
          formId={formId}
          submitLabel="顧客を追加"
          initialValues={{
            name,
          }}
          onSubmit={(customerValues) => {
            const newCustomer = addCustomer({
              ...customerValues,
              created_by: values.user_id || "user-001",
            });
            updateValue("customer_id", newCustomer.id);
            closeDialog();
          }}
        />
      ),
      footer: (
        <>
          <Button type="button" variant="secondary" onClick={closeDialog}>
            キャンセル
          </Button>
          <Button type="submit" form={formId} variant="primary">
            顧客を追加
          </Button>
        </>
      ),
    });
    setOpenPopover(null);
  };

  const handleCreateOwnerQuick = (name: string) => {
    const initials = name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
    const newProfile = addProfile({
      name,
      email: `${crypto.randomUUID().slice(0, 8)}@example.com`,
      avatar: initials || name.slice(0, 2),
      role: "player",
      manager_id: null,
    });
    updateValue("user_id", newProfile.id);
    setOpenPopover(null);
  };

  const handleCreateOwnerDetail = (name: string) => {
    const formId = "add-member-from-project-form";
    openDialog({
      mode: "add",
      eyebrow: "メンバー",
      breadcrumbs: ["新規作成"],
      title: "メンバーを追加",
      hideHeaderTitle: true,
      size: "xl",
      content: (
        <MemberDialogForm
          formId={formId}
          initialValues={{
            name,
          }}
          onSubmit={(memberValues) => {
            const newProfile = addProfile(memberValues);
            updateValue("user_id", newProfile.id);
            closeDialog();
          }}
        />
      ),
      footer: (
        <>
          <Button type="button" variant="secondary" onClick={closeDialog}>
            キャンセル
          </Button>
          <Button type="submit" form={formId} variant="primary">
            メンバーを追加
          </Button>
        </>
      ),
    });
    setOpenPopover(null);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const name = values.name.trim();
    if (!name) return;

    const amount = Number(values.amount) || 0;
    const labels = values.labels
      .split(/[、,]/)
      .map((label) => label.trim())
      .filter(Boolean);

    onSubmit({
      name,
      customer_id: values.customer_id,
      status: values.status,
      priority: values.priority,
      amount,
      close_date: values.close_date.trim() || undefined,
      note: values.note.trim() || undefined,
      labels: labels.length > 0 ? labels : undefined,
      user_id: values.user_id,
      source: values.source,
      next_action_date: values.next_action_date.trim() || undefined,
    });
  };

  // 既存データからユニークなラベルリストを取得
  const existingLabels = useMemo(() => {
    return Array.from(
      new Set(
        projects
          .flatMap((p) => p.labels || [])
          .map((l) => l.trim())
          .filter(Boolean),
      ),
    );
  }, [projects]);

  // 現在のラベル一覧 (配列化)
  const currentLabelsList = useMemo(() => {
    return tempLabels
      .split(/[、,]/)
      .map((l) => l.trim())
      .filter(Boolean);
  }, [tempLabels]);

  // tagInput の入力値に応じて既存ラベル候補をフィルタリング
  const filteredLabels = useMemo(() => {
    const trimmed = tagInput.trim().toLowerCase();
    if (!trimmed) {
      return isLabelsExpanded ? existingLabels : existingLabels.slice(0, 5);
    }
    return existingLabels.filter((lbl) => lbl.toLowerCase().includes(trimmed));
  }, [existingLabels, tagInput, isLabelsExpanded]);

  // 顧客の選択肢一覧
  const customerOptions = useMemo(() => {
    const options = customers
      .map((c) => ({ label: c.name, value: c.id }))
      .sort((a, b) => a.label.localeCompare(b.label, "ja"));
    return [{ label: "企業未紐付け", value: "" }, ...options];
  }, [customers]);

  const selectedCustomerName = useMemo(() => {
    if (!values.customer_id) return "未設定";
    const found = customers.find((c) => c.id === values.customer_id);
    return found ? found.name : "未設定";
  }, [values.customer_id, customers]);

  const selectedOwnerName = useMemo(() => {
    const found = profiles.find((p) => p.id === values.user_id);
    return found ? found.name : "未担当";
  }, [values.user_id, profiles]);

  const ownerOptions = useMemo(() => {
    return profiles
      .map((p) => ({ label: p.name, value: p.id }))
      .sort((a, b) => a.label.localeCompare(b.label, "ja"));
  }, [profiles]);

  return (
    <form id={formId} onSubmit={handleSubmit} className="flex flex-col">
      {/* 1. Header (Name Only) */}
      <LinearDialogHeader
        titlePlaceholder="案件名 (例: 業務基幹システム開発)"
        titleValue={values.name}
        onTitleChange={(val) => updateValue("name", val)}
        titleRequired
      />

      {/* 2. Metadata Pills Bar (クイック設定項目) */}
      <LinearDialogMetadataBar>
        {/* 顧客 */}
        <LinearDialogPill
          icon={<Building2 className="size-3.5" />}
          label="顧客"
          value={selectedCustomerName}
          active={Boolean(values.customer_id)}
          open={openPopover === "customer"}
          onOpenChange={(open) => setOpenPopover(open ? "customer" : null)}
          popoverClassName="w-72 sm:w-80"
          popoverContent={
            <div className="flex flex-col gap-2">
              <p className="text-xs font-bold text-muted-foreground px-1 py-0.5">
                顧客を紐付ける
              </p>
              <Combobox
                options={customerOptions}
                value={values.customer_id || ""}
                onValueChange={(val) => {
                  updateValue("customer_id", val || null);
                  setOpenPopover(null);
                }}
                onCreateOptionQuick={handleCreateCustomerQuick}
                onCreateOptionDetail={handleCreateCustomerDetail}
                placeholder="企業名で検索..."
                className="w-full h-8 text-xs font-semibold"
              />
            </div>
          }
        />

        {/* ステータス */}
        <LinearDialogPill
          icon={<Activity className="size-3.5" />}
          label="ステータス"
          value={statusLabel[values.status]}
          active={true}
          open={openPopover === "status"}
          onOpenChange={(open) => setOpenPopover(open ? "status" : null)}
          popoverContent={
            <div className="flex flex-col gap-1">
              <p className="text-xs font-bold text-muted-foreground px-2 py-1">
                ステータスを選択
              </p>
              {(["lead", "proposing", "negotiating", "closed"] as ProjectStatus[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    updateValue("status", s);
                    setOpenPopover(null);
                  }}
                  className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold hover:bg-muted text-foreground transition-colors cursor-pointer w-full text-left"
                >
                  <span>{statusLabel[s]}</span>
                  {values.status === s && (
                    <Check className="size-3.5 text-primary" />
                  )}
                </button>
              ))}
            </div>
          }
        />

        {/* 確度 */}
        <LinearDialogPill
          icon={<Star className="size-3.5" />}
          label="確度"
          value={priorityLabel[values.priority]}
          active={true}
          open={openPopover === "priority"}
          onOpenChange={(open) => setOpenPopover(open ? "priority" : null)}
          popoverContent={
            <div className="flex flex-col gap-1">
              <p className="text-xs font-bold text-muted-foreground px-2 py-1">
                確度を選択
              </p>
              {([1, 2, 3] as (1 | 2 | 3)[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => {
                    updateValue("priority", p);
                    setOpenPopover(null);
                  }}
                  className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold hover:bg-muted text-foreground transition-colors cursor-pointer w-full text-left"
                >
                  <span>確度 {priorityLabel[p]}</span>
                  {values.priority === p && (
                    <Check className="size-3.5 text-primary" />
                  )}
                </button>
              ))}
            </div>
          }
        />

        {/* ラベル */}
        <LinearDialogPill
          icon={<Tag className="size-3.5" />}
          label="ラベル"
          value={values.labels ? values.labels : "未設定"}
          active={Boolean(values.labels)}
          open={openPopover === "labels"}
          onOpenChange={(open) => {
            if (open) {
              setTempLabels(values.labels);
              setTagInput("");
            }
            setOpenPopover(open ? "labels" : null);
          }}
          popoverClassName="w-72 sm:w-80"
          popoverContent={
            <div className="flex flex-col gap-3">
              <p className="text-xs font-bold text-muted-foreground">
                ラベル設定
              </p>

              {/* ピル型のタグ入力コンポーネント */}
              <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-lg border border-input bg-background min-h-10 shadow-2xs focus-within:ring-2 focus-within:ring-ring/20 focus-within:border-ring transition-all relative">
                {currentLabelsList.map((lbl, i) => (
                  <span
                    key={`${lbl}-${i}`}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary font-bold text-xs border border-primary/20 shadow-2xs animate-in zoom-in-95 duration-100"
                  >
                    <span>{lbl}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = currentLabelsList.filter(
                          (_, idx) => idx !== i,
                        );
                        setTempLabels(updated.join("、"));
                      }}
                      className="hover:bg-primary/20 rounded-full p-0.5 transition-colors text-primary cursor-pointer"
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                ))}
                <div className="flex-1 flex items-center flex-wrap gap-1.5 min-w-[200px] max-w-full">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (
                        e.key === "Enter" ||
                        e.key === "、" ||
                        e.key === ","
                      ) {
                        e.preventDefault();
                        if (tagInput.trim()) {
                          const nextList = [
                            ...currentLabelsList,
                            tagInput.trim(),
                          ];
                          setTempLabels(nextList.join("、"));
                          setTagInput("");
                        }
                      } else if (
                        e.key === "Backspace" &&
                        !tagInput &&
                        currentLabelsList.length > 0
                      ) {
                        const nextList = currentLabelsList.slice(0, -1);
                        setTempLabels(nextList.join("、"));
                      }
                    }}
                    placeholder={
                      currentLabelsList.length === 0
                        ? "ラベルを入力..."
                        : "追加..."
                    }
                    style={{
                      width: tagInput
                        ? `${Math.max(10, tagInput.length * 1.8 + 3)}ch`
                        : "100%",
                    }}
                    className="border-none bg-transparent px-1 text-xs outline-none focus:ring-0 font-semibold text-foreground placeholder:text-muted-foreground/50 max-w-full truncate"
                  />
                  {tagInput.trim() && (
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1 pointer-events-none select-none animate-in fade-in zoom-in-95 duration-100 bg-muted/50 border border-border/60 px-1.5 py-0.5 rounded-md shadow-2xs shrink-0">
                      確定:{" "}
                      <kbd className="pointer-events-none inline-flex h-4 select-none items-center gap-1 rounded border border-border bg-muted px-1 font-mono text-[9px] font-bold text-muted-foreground shadow-2xs">
                        Enter
                      </kbd>
                    </span>
                  )}
                </div>
              </div>

              {/* フィルタリングされたラベル候補 */}
              <div className="animate-in fade-in-50 duration-150 flex flex-col gap-1.5">
                <p className="text-[11px] text-muted-foreground font-semibold">
                  関連ラベル候補 (クリックで追加/解除):
                </p>

                <div
                  className={cn(
                    "flex flex-wrap items-center gap-1.5 transition-all duration-200",
                    isLabelsExpanded && "max-h-36 overflow-y-auto pr-1 pb-1",
                  )}
                >
                  {filteredLabels.length > 0 ? (
                    <>
                      {filteredLabels.map((lbl) => {
                        const isSelected = currentLabelsList.includes(lbl);
                        return (
                          <button
                            key={lbl}
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                const updated = currentLabelsList.filter(
                                  (l) => l !== lbl,
                                );
                                setTempLabels(updated.join("、"));
                              } else {
                                const updated = [...currentLabelsList, lbl];
                                setTempLabels(updated.join("、"));
                              }
                              setTagInput("");
                            }}
                            className={cn(
                              "group rounded-full px-2.5 py-1 text-xs font-semibold border transition-colors cursor-pointer shadow-2xs flex items-center gap-1",
                              isSelected
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-muted/50 hover:bg-muted text-foreground border-border/60",
                            )}
                          >
                            {!isSelected && (
                              <Plus className="size-3 text-muted-foreground/60 group-hover:text-foreground transition-colors" />
                            )}
                            <span>{lbl}</span>
                            {isSelected && (
                              <span className="text-[10px] opacity-70">✓</span>
                            )}
                          </button>
                        );
                      })}
                      {!tagInput.trim() && existingLabels.length > 5 && (
                        <button
                          type="button"
                          onClick={() => setIsLabelsExpanded((v) => !v)}
                          className="group inline-flex items-center gap-1 rounded-full bg-primary/10 hover:bg-primary/20 px-2.5 py-1 text-xs font-bold text-primary transition-colors border border-primary/25 shadow-2xs cursor-pointer animate-in fade-in zoom-in-95 duration-100"
                        >
                          <span>
                            {isLabelsExpanded
                              ? "一部を表示"
                              : `+ 他 ${existingLabels.length - 5} 件を表示`}
                          </span>
                        </button>
                      )}
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        const nextList = [
                          ...currentLabelsList,
                          tagInput.trim(),
                        ];
                        setTempLabels(nextList.join("、"));
                        setTagInput("");
                      }}
                      className="group inline-flex items-center gap-1 rounded-full bg-primary/10 hover:bg-primary/20 px-3 py-1 text-xs font-bold text-primary transition-colors border border-primary/20 shadow-2xs cursor-pointer animate-in fade-in zoom-in-95 duration-100"
                    >
                      <Plus className="size-3.5" />
                      <span>「{tagInput.trim()}」を新しく追加</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1 border-t border-border/60 mt-1">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setOpenPopover(null)}
                  className="h-7 text-xs px-2.5 font-bold"
                >
                  キャンセル
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => {
                    if (tagInput.trim()) {
                      const finalLabels = [
                        ...currentLabelsList,
                        tagInput.trim(),
                      ].join("、");
                      updateValue("labels", finalLabels);
                    } else {
                      updateValue("labels", tempLabels);
                    }
                    setOpenPopover(null);
                  }}
                  className="h-7 text-xs px-2.5 font-bold"
                >
                  決定
                </Button>
              </div>
            </div>
          }
        />

        {/* 担当者 */}
        <LinearDialogPill
          icon={<User className="size-3.5" />}
          label="担当者"
          value={selectedOwnerName}
          active={true}
          open={openPopover === "owner"}
          onOpenChange={(open) => setOpenPopover(open ? "owner" : null)}
          popoverClassName="w-72 sm:w-80"
          popoverContent={
            <div className="flex flex-col gap-2">
              <p className="text-xs font-bold text-muted-foreground px-1 py-0.5">
                担当者を選択
              </p>
              <Combobox
                options={ownerOptions}
                value={values.user_id}
                onValueChange={(val) => {
                  updateValue("user_id", val);
                  setOpenPopover(null);
                }}
                onCreateOptionQuick={handleCreateOwnerQuick}
                onCreateOptionDetail={handleCreateOwnerDetail}
                placeholder="名前で検索..."
                className="w-full h-8 text-xs font-semibold"
              />
            </div>
          }
        />

      </LinearDialogMetadataBar>

      {/* 3. Main Form Section (2カラム・カードグリッド) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-6 border-b border-border/60 w-full">
        {/* 基本情報グループカード */}
        <div className="flex flex-col gap-5 bg-muted/20 dark:bg-muted/10 p-6 rounded-2xl border border-border/60 shadow-2xs h-fit">
          <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2 pb-3 border-b border-border/60">
            <Coins className="size-4 text-primary" /> 基本情報
          </h4>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="amount" className="text-xs font-bold text-foreground/90">
                案件金額 (円)
              </label>
              <input
                id="amount"
                type="number"
                min="0"
                value={values.amount}
                onChange={(e) => updateValue("amount", e.target.value)}
                placeholder="例: 1500000"
                className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm font-medium text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 transition-all shadow-2xs"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="close_date" className="text-xs font-bold text-foreground/90">
                完了予定日
              </label>
              <DatePicker
                id="close_date"
                value={values.close_date}
                onChange={(value) => updateValue("close_date", value)}
              />
            </div>
          </div>
        </div>

        {/* アクション・日程グループカード */}
        <div className="flex flex-col gap-5 bg-muted/20 dark:bg-muted/10 p-6 rounded-2xl border border-border/60 shadow-2xs h-fit">
          <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2 pb-3 border-b border-border/60">
            <Calendar className="size-4 text-primary" /> アクション・日程
          </h4>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="next_action_date" className="text-xs font-bold text-foreground/90">
                次回アクション日
              </label>
              <DatePicker
                id="next_action_date"
                value={values.next_action_date}
                onChange={(value) => updateValue("next_action_date", value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 4. Textarea (ネクストアクション・特記事項) */}
      <div className="py-4 flex flex-col gap-2">
        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
          <FileText className="size-3.5 text-primary" /> ネクストアクション・特記事項
        </h4>
        <LinearDialogTextarea
          value={values.note}
          onChange={(event) => updateValue("note", event.target.value)}
          placeholder="案件の詳細、要件、顧客の反応など..."
          className="min-h-40 text-sm leading-relaxed"
        />
      </div>

      <button type="submit" className="sr-only">
        {submitLabel}
      </button>
    </form>
  );
}
