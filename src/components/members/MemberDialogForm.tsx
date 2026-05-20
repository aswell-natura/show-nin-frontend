import { useState, useMemo, type FormEvent } from "react";
import { User, Mail, Shield, Users } from "lucide-react";
import {
  LinearDialogHeader,
  LinearDialogMetadataBar,
  LinearDialogPill,
} from "@/components/ui/linear-dialog";
import { useDataStore } from "../../context/DataStoreContext";
import { Check } from "lucide-react";

export interface MemberDialogValues {
  name: string;
  email: string;
  avatar: string;
  role: "player" | "manager" | "dual";
  manager_id: string | null;
}

export interface MemberDialogFormProps {
  formId: string;
  initialValues?: Partial<MemberDialogValues>;
  onSubmit: (values: MemberDialogValues) => void;
}

export default function MemberDialogForm({
  formId,
  initialValues,
  onSubmit,
}: MemberDialogFormProps) {
  const { profiles } = useDataStore();

  const [values, setValues] = useState({
    name: initialValues?.name ?? "",
    email: initialValues?.email ?? "",
    avatar: initialValues?.avatar ?? "",
    role: (initialValues?.role ?? "player") as "player" | "manager" | "dual",
    manager_id: initialValues?.manager_id ?? (null as string | null),
  });

  const [openPopover, setOpenPopover] = useState<string | null>(null);

  const updateValue = <K extends keyof typeof values>(key: K, value: typeof values[K]) => {
    setValues((current) => ({ ...current, [key]: value }));
  };

  // Filter manager options (those who are manager or dual)
  const managerCandidates = useMemo(() => {
    return profiles.filter((p) => p.role === "manager" || p.role === "dual");
  }, [profiles]);

  const selectedManagerName = useMemo(() => {
    if (!values.manager_id) return "なし";
    const m = profiles.find((p) => p.id === values.manager_id);
    return m ? m.name : "なし";
  }, [values.manager_id, profiles]);

  const roleLabels = {
    player: "一般（プレイヤー）",
    manager: "マネージャー",
    dual: "特権管理者（デュアル）",
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = values.name.trim();
    const email = values.email.trim();
    if (!name || !email) return;

    // Generate avatar initials if not provided
    let avatar = values.avatar.trim();
    if (!avatar) {
      avatar = name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
      if (!avatar) {
        avatar = name.slice(0, 2);
      }
    }

    onSubmit({
      name,
      email,
      avatar,
      role: values.role,
      manager_id: values.manager_id,
    });
  };

  return (
    <form id={formId} onSubmit={handleSubmit} className="flex flex-col">
      {/* 1. Header (Name Only) */}
      <LinearDialogHeader
        titlePlaceholder="メンバー名 (例: 鈴木 一郎)"
        titleValue={values.name}
        onTitleChange={(val) => updateValue("name", val)}
        titleRequired
      />

      {/* 2. Metadata Pills Bar */}
      <LinearDialogMetadataBar>
        {/* 権限ロール */}
        <LinearDialogPill
          icon={<Shield className="size-3.5" />}
          label="役割/ロール"
          value={roleLabels[values.role]}
          active={true}
          open={openPopover === "role"}
          onOpenChange={(open) => setOpenPopover(open ? "role" : null)}
          popoverContent={
            <div className="flex flex-col gap-1">
              <p className="text-xs font-bold text-muted-foreground px-2 py-1">
                ロールを選択
              </p>
              {(["player", "manager", "dual"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => {
                    updateValue("role", r);
                    setOpenPopover(null);
                  }}
                  className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold hover:bg-muted text-foreground transition-colors cursor-pointer w-full text-left"
                >
                  <span>{roleLabels[r]}</span>
                  {values.role === r && (
                    <Check className="size-3.5 text-primary" />
                  )}
                </button>
              ))}
            </div>
          }
        />

        {/* 直属のマネージャー */}
        <LinearDialogPill
          icon={<Users className="size-3.5" />}
          label="直属の上司"
          value={selectedManagerName}
          active={Boolean(values.manager_id)}
          open={openPopover === "manager"}
          onOpenChange={(open) => setOpenPopover(open ? "manager" : null)}
          popoverContent={
            <div className="flex flex-col gap-1 max-h-[220px] overflow-y-auto">
              <p className="text-xs font-bold text-muted-foreground px-2 py-1">
                マネージャーを選択
              </p>
              <button
                type="button"
                onClick={() => {
                  updateValue("manager_id", null);
                  setOpenPopover(null);
                }}
                className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold hover:bg-muted text-foreground transition-colors cursor-pointer w-full text-left"
              >
                <span>なし</span>
                {!values.manager_id && (
                  <Check className="size-3.5 text-primary" />
                )}
              </button>
              {managerCandidates.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    updateValue("manager_id", m.id);
                    setOpenPopover(null);
                  }}
                  className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold hover:bg-muted text-foreground transition-colors cursor-pointer w-full text-left"
                >
                  <span>{m.name}</span>
                  {values.manager_id === m.id && (
                    <Check className="size-3.5 text-primary" />
                  )}
                </button>
              ))}
            </div>
          }
        />
      </LinearDialogMetadataBar>

      {/* 3. Detail Fields Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-6 border-b border-border/60 w-full">
        {/* 基本設定 */}
        <div className="flex flex-col gap-5 bg-muted/20 dark:bg-muted/10 p-6 rounded-2xl border border-border/60 shadow-2xs h-fit col-span-2">
          <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2 pb-3 border-b border-border/60">
            <User className="size-4 text-primary" /> アカウント基本情報
          </h4>
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="email" className="text-xs font-bold text-foreground/90">
                  メールアドレス <span className="text-destructive">*</span>
                </label>
                <div className="relative flex items-center">
                  <Mail className="absolute left-3 size-4 text-muted-foreground/60" />
                  <input
                    id="email"
                    type="email"
                    required
                    value={values.email}
                    onChange={(e) => updateValue("email", e.target.value)}
                    placeholder="example@email.com"
                    className="w-full h-10 rounded-xl border border-input bg-background pl-9 pr-3 text-sm font-medium text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 transition-all shadow-2xs"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="avatar" className="text-xs font-bold text-foreground/90">
                  イニシャルアイコン (省略時は自動生成)
                </label>
                <input
                  id="avatar"
                  type="text"
                  maxLength={2}
                  value={values.avatar}
                  onChange={(e) => updateValue("avatar", e.target.value)}
                  placeholder="例: YS (2文字以内)"
                  className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm font-medium text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 transition-all shadow-2xs"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
