import { useState, useMemo, type FormEvent } from "react";
import {
  Building2,
  Star,
  Pin,
  Tag,
  Check,
  X,
  Plus,
  Phone,
  FileText,
  Activity,
} from "lucide-react";
import {
  LinearDialogHeader,
  LinearDialogMetadataBar,
  LinearDialogPill,
  LinearDialogTextarea,
} from "@/components/ui/linear-dialog";
import { Button } from "@/components/ui/button";
import { useDataStore } from "../../context/DataStoreContext";
import { cn } from "@/lib/utils";
import type { CustomerRank, CustomerStatus } from "@/types";

export interface CustomerDialogValues {
  name: string;
  industry: string;
  rank: CustomerRank;
  status?: CustomerStatus;
  is_pinned: boolean;
  company_code?: string;
  email?: string;
  address?: string;
  phone?: string;
  website?: string;
  employee_count?: number;
  labels?: string[];
  acquisition_source?: string;
  note?: string;
  milestones?: string[];
}

export interface CustomerDialogFormProps {
  formId: string;
  submitLabel: string;
  initialValues?: Partial<CustomerDialogValues>;
  onSubmit: (values: CustomerDialogValues) => void;
}

export default function CustomerDialogForm({
  formId,
  submitLabel,
  initialValues,
  onSubmit,
}: CustomerDialogFormProps) {
  const { customers } = useDataStore();

  const [values, setValues] = useState({
    name: initialValues?.name ?? "",
    industry: initialValues?.industry ?? "",
    rank: (initialValues?.rank ?? "B") as CustomerRank,
    status: initialValues?.status ?? ("lead" as CustomerStatus),
    is_pinned: initialValues?.is_pinned ?? false,
    company_code: initialValues?.company_code ?? "",
    email: initialValues?.email ?? "",
    address: initialValues?.address ?? "",
    phone: initialValues?.phone ?? "",
    website: initialValues?.website ?? "",
    employee_count: initialValues?.employee_count?.toString() ?? "",
    labels: initialValues?.labels?.join("、") ?? "",
    acquisition_source: initialValues?.acquisition_source ?? "",
    note: initialValues?.note ?? "",
    milestones: initialValues?.milestones ?? [],
  });

  // ポップオーバーの開閉管理
  const [openPopover, setOpenPopover] = useState<string | null>(null);

  // ポップオーバー内の入力用一時ステート
  const [tempLabels, setTempLabels] = useState(values.labels);
  const [tagInput, setTagInput] = useState("");
  const [tempIndustry, setTempIndustry] = useState(values.industry);
  const [isIndustryExpanded, setIsIndustryExpanded] = useState(false);
  const [isLabelsExpanded, setIsLabelsExpanded] = useState(false);

  const updateValue = (key: keyof typeof values, value: any) => {
    setValues((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const name = values.name.trim();
    const industry = values.industry.trim();
    if (!name) return;

    const employeeCount = Number(values.employee_count);
    const labels = values.labels
      .split(/[、,]/)
      .map((label) => label.trim())
      .filter(Boolean);

    onSubmit({
      name,
      industry,
      rank: values.rank,
      status: values.status,
      is_pinned: values.is_pinned,
      company_code: values.company_code.trim() || undefined,
      email: values.email.trim() || undefined,
      address: values.address.trim() || undefined,
      phone: values.phone.trim() || undefined,
      website: values.website.trim() || undefined,
      employee_count:
        values.employee_count.trim() && Number.isFinite(employeeCount)
          ? employeeCount
          : undefined,
      labels: labels.length > 0 ? labels : undefined,
      acquisition_source: values.acquisition_source.trim() || undefined,
      note: values.note.trim() || undefined,
      milestones: [],
    });
  };

  // 既存データからユニークな業種リストを取得
  const existingIndustries = useMemo(() => {
    const baseList = Array.from(
      new Set(customers.map((c) => c.industry?.trim()).filter(Boolean)),
    );
    if (values.industry && baseList.includes(values.industry)) {
      return [
        values.industry,
        ...baseList.filter((ind) => ind !== values.industry),
      ];
    }
    return baseList;
  }, [customers, values.industry]);

  // 既存データからユニークなラベルリストを取得
  const existingLabels = useMemo(() => {
    return Array.from(
      new Set(
        customers
          .flatMap((c) => c.labels || [])
          .map((l) => l.trim())
          .filter(Boolean),
      ),
    );
  }, [customers]);

  // 現在のラベル一覧 (配列化)
  const currentLabelsList = useMemo(() => {
    return tempLabels
      .split(/[、,]/)
      .map((l) => l.trim())
      .filter(Boolean);
  }, [tempLabels]);

  // tempIndustry の入力値に応じて既存業種候補をフィルタリング
  const filteredIndustries = useMemo(() => {
    const isUnchanged = tempIndustry.trim() === values.industry.trim();
    const trimmed = isUnchanged ? "" : tempIndustry.trim().toLowerCase();
    if (!trimmed) {
      return isIndustryExpanded ? existingIndustries : existingIndustries.slice(0, 5);
    }
    return existingIndustries.filter((ind) => ind.toLowerCase().includes(trimmed));
  }, [existingIndustries, tempIndustry, values.industry, isIndustryExpanded]);

  // tagInput の入力値に応じて既存ラベル候補をフィルタリング
  const filteredLabels = useMemo(() => {
    const trimmed = tagInput.trim().toLowerCase();
    if (!trimmed) {
      return isLabelsExpanded ? existingLabels : existingLabels.slice(0, 5);
    }
    return existingLabels.filter((lbl) => lbl.toLowerCase().includes(trimmed));
  }, [existingLabels, tagInput, isLabelsExpanded]);

  return (
    <form id={formId} onSubmit={handleSubmit} className="flex flex-col">
      {/* 1. Header (Name Only) */}
      <LinearDialogHeader
        titlePlaceholder="顧客名 (例: 株式会社ショウニン)"
        titleValue={values.name}
        onTitleChange={(val) => updateValue("name", val)}
        titleRequired
      />

      {/* 2. Metadata Pills Bar (クイック設定項目のみ配置) */}
      <LinearDialogMetadataBar>
        {/* 業種 */}
        <LinearDialogPill
          icon={<Building2 className="size-3.5" />}
          label="業種"
          value={values.industry ? values.industry : "未設定"}
          active={Boolean(values.industry)}
          open={openPopover === "industry"}
          onOpenChange={(open) => {
            if (open) {
              setTempIndustry(values.industry);
              setIsIndustryExpanded(false);
            }
            setOpenPopover(open ? "industry" : null);
          }}
          popoverClassName="w-72 sm:w-80"
          popoverContent={
            <div className="flex flex-col gap-3">
              <p className="text-xs font-bold text-muted-foreground">
                業種の設定
              </p>
              <div className="flex items-center gap-2 p-1.5 rounded-lg border border-input bg-background shadow-2xs focus-within:ring-2 focus-within:ring-ring/20 focus-within:border-ring transition-all">
                <input
                  type="text"
                  value={tempIndustry}
                  onChange={(e) => setTempIndustry(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (tempIndustry.trim()) {
                        updateValue("industry", tempIndustry.trim());
                        setOpenPopover(null);
                      }
                    }
                  }}
                  placeholder="業種を入力..."
                  className="w-full border-none bg-transparent px-2 py-1 text-xs font-semibold text-foreground placeholder:text-muted-foreground/50 outline-none focus:ring-0"
                />
                {tempIndustry.trim() && (
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1 pointer-events-none select-none bg-muted/50 border border-border/60 px-1.5 py-0.5 rounded-md shadow-2xs shrink-0">
                    確定: <kbd className="font-mono text-[9px] font-bold">Enter</kbd>
                  </span>
                )}
              </div>

              {existingIndustries.length > 0 && (
                <div className="animate-in fade-in-50 duration-150 flex flex-col gap-1.5">
                  <p className="text-[11px] text-muted-foreground font-semibold">
                    既存の業種から選択:
                  </p>
                  <div
                    className={cn(
                      "flex flex-wrap items-center gap-1.5 transition-all duration-200",
                      isIndustryExpanded && "max-h-36 overflow-y-auto pr-1 pb-1",
                    )}
                  >
                    {filteredIndustries.length > 0 ? (
                      <>
                        {filteredIndustries.map((ind) => {
                          const isSelected = values.industry === ind;
                          return (
                            <button
                              key={ind}
                              type="button"
                              onClick={() => {
                                updateValue("industry", ind);
                                setOpenPopover(null);
                              }}
                              className={cn(
                                "rounded-full px-2.5 py-1 text-xs font-semibold border transition-colors cursor-pointer shadow-2xs flex items-center gap-1",
                                isSelected
                                  ? "bg-primary text-primary-foreground border-primary"
                                  : "bg-muted/50 hover:bg-muted text-foreground border-border/60",
                              )}
                            >
                              <span>{ind}</span>
                              {isSelected && (
                                <span className="text-[10px] opacity-70">✓</span>
                              )}
                            </button>
                          );
                        })}
                        {(tempIndustry.trim() === values.industry.trim() ||
                          !tempIndustry.trim()) &&
                          existingIndustries.length > 5 && (
                            <button
                              type="button"
                              onClick={() => setIsIndustryExpanded((v) => !v)}
                              className="group inline-flex items-center gap-1 rounded-full bg-primary/10 hover:bg-primary/20 px-2.5 py-1 text-xs font-bold text-primary transition-colors border border-primary/25 shadow-2xs cursor-pointer animate-in fade-in zoom-in-95 duration-100"
                            >
                              <span>
                                {isIndustryExpanded
                                  ? "一部を表示"
                                  : `+ 他 ${existingIndustries.length - 5} 件を表示`}
                              </span>
                            </button>
                          )}
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          updateValue("industry", tempIndustry.trim());
                          setOpenPopover(null);
                        }}
                        className="group inline-flex items-center gap-1 rounded-full bg-primary/10 hover:bg-primary/20 px-3 py-1 text-xs font-bold text-primary transition-colors border border-primary/20 shadow-2xs cursor-pointer animate-in fade-in zoom-in-95 duration-100"
                      >
                        <Plus className="size-3.5" />
                        <span>「{tempIndustry.trim()}」を新しく追加</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

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
                    updateValue("industry", tempIndustry.trim());
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

        {/* ランク */}
        <LinearDialogPill
          icon={<Star className="size-3.5" />}
          label="ランク"
          value={values.rank}
          active={true}
          open={openPopover === "rank"}
          onOpenChange={(open) => setOpenPopover(open ? "rank" : null)}
          popoverContent={
            <div className="flex flex-col gap-1">
              <p className="text-xs font-bold text-muted-foreground px-2 py-1">
                顧客ランクを選択
              </p>
              {(["A", "B", "C", "D"] as CustomerRank[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => {
                    updateValue("rank", r);
                    setOpenPopover(null);
                  }}
                  className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold hover:bg-muted text-foreground transition-colors cursor-pointer"
                >
                  <span>ランク {r}</span>
                  {values.rank === r && (
                    <Check className="size-3.5 text-primary" />
                  )}
                </button>
              ))}
            </div>
          }
        />

        {/* ステータス */}
        <LinearDialogPill
          icon={<Activity className="size-3.5" />}
          label="ステータス"
          value={
            {
              lead: "リード",
              proposing: "提案中",
              negotiating: "商談中",
              active: "既存顧客",
              dormant: "休眠",
            }[values.status || "lead"]
          }
          active={true}
          open={openPopover === "status"}
          onOpenChange={(open) => setOpenPopover(open ? "status" : null)}
          popoverContent={
            <div className="flex flex-col gap-1">
              <p className="text-xs font-bold text-muted-foreground px-2 py-1">
                ステータスを選択
              </p>
              {(
                [
                  "lead",
                  "proposing",
                  "negotiating",
                  "active",
                  "dormant",
                ] as CustomerStatus[]
              ).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    updateValue("status", s);
                    setOpenPopover(null);
                  }}
                  className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold hover:bg-muted text-foreground transition-colors cursor-pointer"
                >
                  <span>
                    {
                      {
                        lead: "リード",
                        proposing: "提案中",
                        negotiating: "商談中",
                        active: "既存顧客",
                        dormant: "休眠",
                      }[s]
                    }
                  </span>
                  {values.status === s && (
                    <Check className="size-3.5 text-primary" />
                  )}
                </button>
              ))}
            </div>
          }
        />

        {/* ピン留め */}
        <LinearDialogPill
          icon={<Pin className="size-3.5" />}
          label={values.is_pinned ? "ピン留め済み" : "ピン留め"}
          active={values.is_pinned}
          onClick={() => updateValue("is_pinned", !values.is_pinned)}
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

              {/* フィルタリングされたラベル候補の選択チップ一覧 */}
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
      </LinearDialogMetadataBar>

      {/* 3. Main Form Section (2カラム・カードグリッド) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-6 border-b border-border/60 w-full">
        {/* 基本情報グループカード */}
        <div className="flex flex-col gap-5 bg-muted/20 dark:bg-muted/10 p-6 rounded-2xl border border-border/60 shadow-2xs h-fit">
          <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2 pb-3 border-b border-border/60">
            <Building2 className="size-4 text-primary" /> 基本情報
          </h4>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="company_code" className="text-xs font-bold text-foreground/90">
                企業コード
              </label>
              <input
                id="company_code"
                type="text"
                value={values.company_code}
                onChange={(e) => updateValue("company_code", e.target.value)}
                placeholder="例: CUST-001"
                className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm font-medium text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 transition-all shadow-2xs"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="employee_count" className="text-xs font-bold text-foreground/90">
                従業員数
              </label>
              <input
                id="employee_count"
                type="number"
                min="0"
                value={values.employee_count}
                onChange={(e) => updateValue("employee_count", e.target.value)}
                placeholder="例: 150"
                className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm font-medium text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 transition-all shadow-2xs"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="acquisition_source" className="text-xs font-bold text-foreground/90">
                流入・獲得経路
              </label>
              <input
                id="acquisition_source"
                type="text"
                value={values.acquisition_source}
                onChange={(e) => updateValue("acquisition_source", e.target.value)}
                placeholder="例: Web問合せ、展示会など"
                className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm font-medium text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 transition-all shadow-2xs"
              />
            </div>
          </div>
        </div>

        {/* 連絡先・所在地グループカード */}
        <div className="flex flex-col gap-5 bg-muted/20 dark:bg-muted/10 p-6 rounded-2xl border border-border/60 shadow-2xs h-fit">
          <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2 pb-3 border-b border-border/60">
            <Phone className="size-4 text-primary" /> 連絡先・所在地
          </h4>
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="email" className="text-xs font-bold text-foreground/90">
                  メールアドレス
                </label>
                <input
                  id="email"
                  type="email"
                  value={values.email}
                  onChange={(e) => updateValue("email", e.target.value)}
                  placeholder="例: info@example.com"
                  className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm font-medium text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 transition-all shadow-2xs"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="phone" className="text-xs font-bold text-foreground/90">
                  電話番号
                </label>
                <input
                  id="phone"
                  type="text"
                  value={values.phone}
                  onChange={(e) => updateValue("phone", e.target.value)}
                  placeholder="例: 03-0000-0000"
                  className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm font-medium text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 transition-all shadow-2xs"
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="website" className="text-xs font-bold text-foreground/90">
                Webサイト
              </label>
              <input
                id="website"
                type="url"
                value={values.website}
                onChange={(e) => updateValue("website", e.target.value)}
                placeholder="例: https://example.com"
                className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm font-medium text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 transition-all shadow-2xs"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="address" className="text-xs font-bold text-foreground/90">
                所在地
              </label>
              <textarea
                id="address"
                value={values.address}
                onChange={(e) => updateValue("address", e.target.value)}
                placeholder="例: 東京都渋谷区神宮前1-1-1"
                rows={2}
                className="w-full rounded-xl border border-input bg-background p-3 text-sm font-medium text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 transition-all shadow-2xs resize-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 4. Textarea (メモ・特記事項) */}
      <div className="py-4 flex flex-col gap-2">
        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
          <FileText className="size-3.5 text-primary" /> メモ・特記事項
        </h4>
        <LinearDialogTextarea
          value={values.note}
          onChange={(event) => updateValue("note", event.target.value)}
          placeholder="企業の状況、商談背景、次に確認したいこと..."
          className="min-h-40 text-sm leading-relaxed"
        />
      </div>

      <button type="submit" className="sr-only">
        {submitLabel}
      </button>
    </form>
  );
}
