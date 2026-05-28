import {
  useState,
  type FormEvent,
  type KeyboardEvent,
  type ClipboardEvent,
} from "react";
import { Plus, Send, UserPlus, X } from "lucide-react";

import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type UserRole = "管理者" | "一般ユーザー";
type UserStatus = "有効" | "無効";

interface UserRecord {
  id: string;
  displayName: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  lastLogin: string;
}

const roleOptions: UserRole[] = ["管理者", "一般ユーザー"];
const statusOptions: UserStatus[] = ["有効", "無効"];

const initialUsers: UserRecord[] = [
  {
    id: "user-001",
    displayName: "田中 拓海",
    email: "takumi.tanaka@example.com",
    role: "管理者",
    status: "有効",
    lastLogin: "2026-05-28 09:18",
  },
  {
    id: "user-002",
    displayName: "佐藤 美咲",
    email: "misaki.sato@example.com",
    role: "一般ユーザー",
    status: "有効",
    lastLogin: "2026-05-27 18:42",
  },
];

export default function UsersPage() {
  const [users, setUsers] = useState(initialUsers);
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);
  const [formValues, setFormValues] = useState<UserRecord>(initialUsers[0]);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteInput, setInviteInput] = useState("");
  const [inviteEmails, setInviteEmails] = useState<string[]>([]);
  const [inviteError, setInviteError] = useState("");

  const openDetail = (user: UserRecord) => {
    setSelectedUser(user);
    setFormValues(user);
  };

  const handleSave = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setUsers((current) =>
      current.map((user) => (user.id === formValues.id ? formValues : user)),
    );
    setSelectedUser(null);
  };

  const closeInviteDialog = () => {
    setIsInviteOpen(false);
    setInviteInput("");
    setInviteEmails([]);
    setInviteError("");
  };

  const addInviteEmails = (rawValue: string) => {
    const values = rawValue
      .split(/[,\s]+/)
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean);

    if (values.length === 0) return true;

    const invalidEmail = values.find((value) => !isEmail(value));

    if (invalidEmail) {
      setInviteError(`${invalidEmail} はメールアドレスとして認識できません。`);
      return false;
    }

    setInviteEmails((current) => {
      const existing = new Set(current);
      return [...current, ...values.filter((value) => !existing.has(value))];
    });
    setInviteInput("");
    setInviteError("");
    return true;
  };

  const removeInviteEmail = (email: string) => {
    setInviteEmails((current) => current.filter((item) => item !== email));
  };

  const handleInviteKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === "," || event.key === "Tab") {
      if (inviteInput.trim()) {
        event.preventDefault();
        addInviteEmails(inviteInput);
      }
    }

    if (
      event.key === "Backspace" &&
      inviteInput.length === 0 &&
      inviteEmails.length > 0
    ) {
      removeInviteEmail(inviteEmails[inviteEmails.length - 1]);
    }
  };

  const handleInvitePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    const pastedText = event.clipboardData.getData("text");

    if (pastedText.includes(",")) {
      event.preventDefault();
      addInviteEmails(pastedText);
    }
  };

  const handleInviteSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (inviteInput.trim()) {
      if (!addInviteEmails(inviteInput)) return;
      closeInviteDialog();
      return;
    }

    if (inviteEmails.length === 0) {
      setInviteError("招待するメールアドレスを入力してください。");
      return;
    }

    closeInviteDialog();
  };

  return (
    <AppLayout>
      <div className="flex h-full flex-col overflow-hidden bg-background">
        <div className="shrink-0 border-b border-border bg-card px-4 py-5 md:px-6">
          <div className="flex flex-col items-stretch justify-between gap-4 md:flex-row md:items-center">
            <div>
              <div className="flex w-full items-center gap-2 md:w-auto">
                <h1 className="text-xl font-bold tracking-tight text-foreground">
                  ユーザー
                </h1>
                <Button
                  type="button"
                  size="icon"
                  variant="primary"
                  className="ml-auto h-9 w-9 shrink-0 rounded-full shadow-md md:hidden"
                  aria-label="ユーザーを招待"
                  onClick={() => setIsInviteOpen(true)}
                >
                  <UserPlus className="h-4 w-4" />
                </Button>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                利用ユーザーの権限とフェーズを管理します。
              </p>
            </div>
            <Button
              type="button"
              size="md"
              variant="primary"
              className="hidden h-10 w-full shrink-0 justify-center gap-2 px-4 shadow-md sm:w-auto md:inline-flex"
              onClick={() => setIsInviteOpen(true)}
            >
              <UserPlus className="h-4 w-4" />
              <span className="text-sm font-bold">ユーザーを招待</span>
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
            <div className="overflow-x-auto">
              <Table className="min-w-[720px]">
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead className="w-56">表示名</TableHead>
                    <TableHead>メール</TableHead>
                    <TableHead className="w-32">権限</TableHead>
                    <TableHead className="w-28">フェーズ</TableHead>
                    <TableHead className="w-44">最終ログイン</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow
                      key={user.id}
                      className="cursor-pointer"
                      onClick={() => openDetail(user)}
                    >
                      <TableCell className="font-medium text-foreground">
                        {user.displayName}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {user.email}
                      </TableCell>
                      <TableCell>{user.role}</TableCell>
                      <TableCell>
                        <UserStatusBadge status={user.status} />
                      </TableCell>
                      <TableCell>{user.lastLogin}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

        <Dialog
          open={selectedUser !== null}
          onOpenChange={(open) => {
            if (!open) setSelectedUser(null);
          }}
        >
          <DialogContent className="max-w-2xl gap-0 overflow-hidden p-0">
            <form onSubmit={handleSave}>
              <DialogHeader className="border-b border-border px-6 py-5">
                <DialogTitle>ユーザー詳細</DialogTitle>
                <DialogDescription>
                  ユーザー情報を編集できます。
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-5 px-6 py-5">
                <InputField
                  label="表示名"
                  value={formValues.displayName}
                  onChange={(value) =>
                    setFormValues((current) => ({ ...current, displayName: value }))
                  }
                />
                <InputField
                  label="メール"
                  type="email"
                  value={formValues.email}
                  onChange={(value) =>
                    setFormValues((current) => ({ ...current, email: value }))
                  }
                />

                <div className="grid gap-3 sm:grid-cols-2">
                  <SelectField
                    label="権限"
                    value={formValues.role}
                    options={roleOptions}
                    onChange={(value) =>
                      setFormValues((current) => ({
                        ...current,
                        role: value as UserRole,
                      }))
                    }
                  />
                  <SelectField
                    label="フェーズ"
                    value={formValues.status}
                    options={statusOptions}
                    onChange={(value) =>
                      setFormValues((current) => ({
                        ...current,
                        status: value as UserStatus,
                      }))
                    }
                  />
                </div>

                <InputField
                  label="最終ログイン"
                  value={formValues.lastLogin}
                  onChange={(value) =>
                    setFormValues((current) => ({ ...current, lastLogin: value }))
                  }
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setSelectedUser(null)}
                >
                  キャンセル
                </Button>
                <Button type="submit" variant="primary">
                  保存
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog
          open={isInviteOpen}
          onOpenChange={(open) => {
            if (open) {
              setIsInviteOpen(true);
              return;
            }

            closeInviteDialog();
          }}
        >
          <DialogContent className="max-w-xl gap-0 overflow-hidden p-0">
            <form onSubmit={handleInviteSubmit}>
              <DialogHeader className="border-b border-border px-6 py-5">
                <DialogTitle>ユーザーを招待</DialogTitle>
                <DialogDescription>
                  メールアドレスを入力して、複数の招待をまとめて送信できます。
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 px-6 py-5">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-foreground">
                    招待先メール
                  </span>
                  <div className="flex min-h-11 flex-wrap items-center gap-2 rounded-lg border border-input bg-background px-3 py-2 transition-all focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20">
                    {inviteEmails.map((email) => (
                      <span
                        key={email}
                        className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary"
                      >
                        <span className="truncate">{email}</span>
                        <button
                          type="button"
                          className="rounded-full p-0.5 text-primary/70 transition-colors hover:bg-primary/10 hover:text-primary focus:outline-none focus:ring-2 focus:ring-ring/30"
                          aria-label={`${email} を削除`}
                          onClick={() => removeInviteEmail(email)}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                    <input
                      type="email"
                      value={inviteInput}
                      onChange={(event) => {
                        setInviteInput(event.target.value);
                        setInviteError("");
                      }}
                      onKeyDown={handleInviteKeyDown}
                      onPaste={handleInvitePaste}
                      onBlur={() => addInviteEmails(inviteInput)}
                      placeholder={
                        inviteEmails.length === 0
                          ? "name@example.com, team@example.com"
                          : "メールを追加"
                      }
                      className="min-w-48 flex-1 border-0 bg-transparent p-0 text-sm text-foreground outline-none placeholder:text-muted-foreground"
                    />
                    <button
                      type="button"
                      className="inline-flex h-7 shrink-0 items-center gap-1 rounded-md border border-border bg-secondary px-2 text-xs font-medium text-secondary-foreground shadow-sm transition-colors hover:border-primary/35 hover:bg-secondary/80 focus:outline-none focus:ring-2 focus:ring-ring/30 disabled:pointer-events-none disabled:opacity-50"
                      disabled={!inviteInput.trim()}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => addInviteEmails(inviteInput)}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      追加
                    </button>
                  </div>
                </label>

                <p className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                  <Kbd>Enter</Kbd>
                  <Kbd>Tab</Kbd>
                  <Kbd>,</Kbd>
                  <span>または追加ボタンで入力を確定します。</span>
                </p>
                {inviteError ? (
                  <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">
                    {inviteError}
                  </p>
                ) : null}
              </div>

              <DialogFooter>
                <Button type="button" variant="secondary" onClick={closeInviteDialog}>
                  キャンセル
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={inviteEmails.length === 0 && !inviteInput.trim()}
                >
                  <Send className="h-4 w-4" />
                  招待を送信
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function UserStatusBadge({ status }: { status: UserStatus }) {
  return (
    <span
      className={
        status === "有効"
          ? "inline-flex shrink-0 rounded-md bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700"
          : "inline-flex shrink-0 rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground"
      }
    >
      {status}
    </span>
  );
}

function InputField({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-foreground">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition-all focus:border-ring focus:ring-2 focus:ring-ring/20"
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-foreground">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition-all focus:border-ring focus:ring-2 focus:ring-ring/20"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}
