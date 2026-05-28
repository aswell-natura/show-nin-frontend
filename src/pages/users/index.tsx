import { useState, type FormEvent } from "react";

import AppLayout from "@/components/layout/AppLayout";
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

  return (
    <AppLayout>
      <div className="flex h-full flex-col overflow-hidden bg-background">
        <div className="shrink-0 border-b border-border bg-card px-4 py-5 md:px-6">
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            ユーザー
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            利用ユーザーの権限とフェーズを管理します。
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
            <Table>
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
                      <span
                        className={
                          user.status === "有効"
                            ? "inline-flex rounded-md bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700"
                            : "inline-flex rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground"
                        }
                      >
                        {user.status}
                      </span>
                    </TableCell>
                    <TableCell>{user.lastLogin}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
      </div>
    </AppLayout>
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
