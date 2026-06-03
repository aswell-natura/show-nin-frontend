import { useState, type FormEvent } from "react";
import { Plus, Trash2 } from "lucide-react";

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
import { mockProfiles } from "@/data/mock";

interface GroupRecord {
  id: string;
  name: string;
  userIds: string[];
}

const users = mockProfiles.map((profile) => ({
  id: profile.id,
  name: profile.name,
  email: profile.email,
}));

const initialGroups: GroupRecord[] = [
  { id: "group-001", name: "営業チーム", userIds: ["user-001", "user-002"] },
  { id: "group-002", name: "開発チーム", userIds: ["user-003", "user-004"] },
  { id: "group-003", name: "管理チーム", userIds: ["user-003"] },
  { id: "group-004", name: "プロジェクト推進チーム", userIds: ["user-001", "user-004"] },
];

export default function GroupsPage() {
  const [groups, setGroups] = useState(initialGroups);
  const [groupName, setGroupName] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<GroupRecord | null>(null);
  const [formValues, setFormValues] = useState<GroupRecord | null>(null);

  const handleAddGroup = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const name = groupName.trim();
    if (!name) {
      setErrorMessage("所属グループ名を入力してください。");
      return;
    }

    if (groups.some((group) => group.name === name)) {
      setErrorMessage("同じ所属グループ名がすでに登録されています。");
      return;
    }

    setGroups((current) => [
      ...current,
      {
        id: `group-${Date.now()}`,
        name,
        userIds: [],
      },
    ]);
    setGroupName("");
    setErrorMessage("");
  };

  const openDetail = (group: GroupRecord) => {
    setSelectedGroup(group);
    setFormValues({ ...group, userIds: [...group.userIds] });
  };

  const closeDetail = () => {
    setSelectedGroup(null);
    setFormValues(null);
  };

  const toggleUser = (userId: string) => {
    setFormValues((current) => {
      if (!current) return current;
      const belongs = current.userIds.includes(userId);
      return {
        ...current,
        userIds: belongs
          ? current.userIds.filter((id) => id !== userId)
          : [...current.userIds, userId],
      };
    });
  };

  const handleSave = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!formValues) return;

    setGroups((current) =>
      current.map((group) =>
        group.id === formValues.id
          ? { ...formValues, name: formValues.name.trim() || group.name }
          : group,
      ),
    );
    closeDetail();
  };

  const handleDeleteGroup = (groupId: string) => {
    setGroups((current) => current.filter((group) => group.id !== groupId));
  };

  return (
    <AppLayout>
      <div className="flex h-full flex-col overflow-hidden bg-background">
        <div className="shrink-0 border-b border-border bg-card px-4 py-5 md:px-6">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              所属グループ設定
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              利用ユーザーに割り当てる所属グループを追加・編集できます。
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="grid gap-4 xl:grid-cols-[minmax(280px,360px)_1fr]">
            <form
              onSubmit={handleAddGroup}
              className="rounded-lg border border-border bg-card p-4 shadow-sm"
            >
              <h2 className="text-sm font-bold text-foreground">
                所属グループを追加
              </h2>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                組織で利用する所属グループ名を入力してください。
              </p>
              <label className="mt-4 block">
                <span className="mb-2 block text-sm font-medium text-foreground">
                  所属グループ名
                </span>
                <input
                  value={groupName}
                  onChange={(event) => {
                    setGroupName(event.target.value);
                    setErrorMessage("");
                  }}
                  placeholder="例：営業チーム"
                  className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition-all focus:border-ring focus:ring-2 focus:ring-ring/20"
                />
              </label>
              {errorMessage ? (
                <p className="mt-3 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">
                  {errorMessage}
                </p>
              ) : null}
              <Button type="submit" variant="primary" className="mt-4 w-full gap-2">
                <Plus className="h-4 w-4" />
                追加
              </Button>
            </form>

            <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead>所属グループ名</TableHead>
                    <TableHead className="w-32 text-right">利用人数</TableHead>
                    <TableHead className="w-24 text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groups.map((group) => (
                    <TableRow
                      key={group.id}
                      className="cursor-pointer"
                      onClick={() => openDetail(group)}
                    >
                      <TableCell className="font-medium text-foreground">
                        {group.name}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {group.userIds.length}人
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="gap-1.5"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleDeleteGroup(group.id);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          削除
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={selectedGroup !== null} onOpenChange={(open) => !open && closeDetail()}>
        <DialogContent className="max-w-2xl p-6">
          {formValues ? (
            <form onSubmit={handleSave}>
              <DialogHeader>
                <DialogTitle>所属グループ詳細</DialogTitle>
                <DialogDescription>
                  所属グループ名と、このグループに属するユーザーを編集できます。
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-5 py-5">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-foreground">
                    所属グループ名
                  </span>
                  <input
                    value={formValues.name}
                    onChange={(event) =>
                      setFormValues((current) =>
                        current ? { ...current, name: event.target.value } : current,
                      )
                    }
                    className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition-all focus:border-ring focus:ring-2 focus:ring-ring/20"
                  />
                </label>

                <div>
                  <h3 className="text-sm font-bold text-foreground">所属ユーザー</h3>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {users.map((user) => {
                      const active = formValues.userIds.includes(user.id);
                      return (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => toggleUser(user.id)}
                          className={`rounded-lg border px-3 py-2 text-left transition-colors ${
                            active
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border bg-muted/30 text-muted-foreground hover:bg-muted"
                          }`}
                        >
                          <span className="block text-sm font-bold">{user.name}</span>
                          <span className="mt-0.5 block truncate text-xs opacity-80">
                            {user.email}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="secondary" onClick={closeDetail}>
                  キャンセル
                </Button>
                <Button type="submit" variant="primary">
                  保存
                </Button>
              </DialogFooter>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
