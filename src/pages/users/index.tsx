import {
  useState,
  type FormEvent,
} from "react";
import { Send, UserPlus } from "lucide-react";

import AppLayout from "@/components/layout/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  company?: string;
  group?: string;
}

const roleOptions: UserRole[] = ["管理者", "一般ユーザー"];
const statusOptions: UserStatus[] = ["有効", "無効"];
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const companyOptions = [
  "Natura株式会社",
  "株式会社アルファテック",
  "日本製造株式会社",
  "グローバルフィナンス株式会社",
  "株式会社ネクストリテール",
];

const groupOptions = [
  "営業チーム",
  "開発チーム",
  "管理チーム",
  "プロジェクト推進チーム",
];

const initialUsers: UserRecord[] = [
  {
    id: "user-001",
    displayName: "田中 拓海",
    email: "takumi.tanaka@example.com",
    role: "管理者",
    status: "有効",
    lastLogin: "2026-05-28 09:18",
    company: "Natura株式会社",
    group: "営業チーム",
  },
  {
    id: "user-002",
    displayName: "佐藤 美咲",
    email: "misaki.sato@example.com",
    role: "一般ユーザー",
    status: "有効",
    lastLogin: "2026-05-27 18:42",
    company: "Natura株式会社",
    group: "営業チーム",
  },
];

export default function UsersPage() {
  const [users, setUsers] = useState(initialUsers);
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);
  const [formValues, setFormValues] = useState<UserRecord>(initialUsers[0]);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteValues, setInviteValues] = useState({
    name: "",
    email: "",
    password: "",
    role: "一般ユーザー" as UserRole,
    status: "有効" as UserStatus,
    company: "未選択",
    group: "未選択",
  });
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
    setInviteValues({
      name: "",
      email: "",
      password: "",
      role: "一般ユーザー",
      status: "有効",
      company: "未選択",
      group: "未選択",
    });
    setInviteError("");
  };

  const handleInviteSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const name = inviteValues.name.trim();
    const email = inviteValues.email.trim();
    const password = inviteValues.password.trim();

    if (!name) {
      setInviteError("名前を入力してください。");
      return;
    }

    if (!email) {
      setInviteError("メールアドレスを入力してください。");
      return;
    }

    if (!isEmail(email)) {
      setInviteError("有効なメールアドレスを入力してください。");
      return;
    }

    if (!password) {
      setInviteError("パスワードを入力してください。");
      return;
    }

    if (password.length < 8) {
      setInviteError("パスワードは8文字以上で入力してください。");
      return;
    }

    const newUser: UserRecord = {
      id: `user-${Date.now()}`,
      displayName: name,
      email: email,
      role: inviteValues.role,
      status: inviteValues.status,
      lastLogin: "未ログイン",
      company: inviteValues.company !== "未選択" ? inviteValues.company : undefined,
      group: inviteValues.group !== "未選択" ? inviteValues.group : undefined,
    };

    setUsers((current) => [...current, newUser]);
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
              <Table className="min-w-[900px]">
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead className="w-48">表示名</TableHead>
                    <TableHead>メール</TableHead>
                    <TableHead className="w-32">権限</TableHead>
                    <TableHead className="w-28">フェーズ</TableHead>
                    <TableHead className="w-44">所属企業</TableHead>
                    <TableHead className="w-44">所属グループ</TableHead>
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
                      <TableCell className="text-muted-foreground">
                        {user.company || <span className="text-muted-foreground/50">-</span>}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {user.group || <span className="text-muted-foreground/50">-</span>}
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
                    setFormValues((current) => ({
                      ...current,
                      displayName: value,
                    }))
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

                <div className="grid gap-3 sm:grid-cols-2">
                  <SelectField
                    label="所属企業"
                    value={formValues.company || "未選択"}
                    options={["未選択", ...companyOptions]}
                    onChange={(value) =>
                      setFormValues((current) => ({
                        ...current,
                        company: value !== "未選択" ? value : undefined,
                      }))
                    }
                  />
                  <SelectField
                    label="所属グループ"
                    value={formValues.group || "未選択"}
                    options={["未選択", ...groupOptions]}
                    onChange={(value) =>
                      setFormValues((current) => ({
                        ...current,
                        group: value !== "未選択" ? value : undefined,
                      }))
                    }
                  />
                </div>

                <InputField
                  label="最終ログイン"
                  value={formValues.lastLogin}
                  onChange={(value) =>
                    setFormValues((current) => ({
                      ...current,
                      lastLogin: value,
                    }))
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
          <DialogContent className="max-w-2xl gap-0 overflow-hidden p-0">
            <form onSubmit={handleInviteSubmit}>
              <DialogHeader className="border-b border-border px-6 py-5">
                <DialogTitle>ユーザーを招待</DialogTitle>
                <DialogDescription>
                  新しいユーザー情報を入力して、招待を送信します。
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 px-6 py-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <InputField
                    label="名前"
                    value={inviteValues.name}
                    onChange={(value) =>
                      setInviteValues((current) => ({
                        ...current,
                        name: value,
                      }))
                    }
                    required
                    placeholder="例：山田 太郎"
                  />
                  <InputField
                    label="メールアドレス"
                    type="email"
                    value={inviteValues.email}
                    onChange={(value) =>
                      setInviteValues((current) => ({
                        ...current,
                        email: value,
                      }))
                    }
                    required
                    placeholder="name@example.com"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <InputField
                    label="パスワード"
                    type="password"
                    value={inviteValues.password}
                    onChange={(value) =>
                      setInviteValues((current) => ({
                        ...current,
                        password: value,
                      }))
                    }
                    required
                    placeholder="8文字以上"
                  />
                  <SelectField
                    label="権限"
                    value={inviteValues.role}
                    options={roleOptions}
                    onChange={(value) =>
                      setInviteValues((current) => ({
                        ...current,
                        role: value as UserRole,
                      }))
                    }
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <SelectField
                    label="ステータス"
                    value={inviteValues.status}
                    options={statusOptions}
                    onChange={(value) =>
                      setInviteValues((current) => ({
                        ...current,
                        status: value as UserStatus,
                      }))
                    }
                  />
                  <SelectField
                    label="所属企業"
                    value={inviteValues.company}
                    options={["未選択", ...companyOptions]}
                    onChange={(value) =>
                      setInviteValues((current) => ({
                        ...current,
                        company: value,
                      }))
                    }
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <SelectField
                    label="所属グループ"
                    value={inviteValues.group}
                    options={["未選択", ...groupOptions]}
                    onChange={(value) =>
                      setInviteValues((current) => ({
                        ...current,
                        group: value,
                      }))
                    }
                  />
                </div>

                {inviteError ? (
                  <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">
                    {inviteError}
                  </p>
                ) : null}
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={closeInviteDialog}
                >
                  キャンセル
                </Button>
                <Button
                  type="submit"
                  variant="primary"
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

function InputField({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-foreground">
        {label}
        {required && <span className="ml-1 text-destructive">*</span>}
      </span>
      <input
        type={type}
        value={value}
        required={required}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
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

function UserStatusBadge({ status }: { status: UserStatus }) {
  const className =
    status === "有効"
      ? "border-0 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/10 dark:text-emerald-400"
      : "border-0 bg-muted text-muted-foreground hover:bg-muted";

  return <Badge className={className}>{status}</Badge>;
}

function isEmail(value: string) {
  return emailPattern.test(value);
}
