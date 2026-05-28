import { useState, type FormEvent } from "react";
import { Plus, Trash2 } from "lucide-react";

import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface PositionRecord {
  id: string;
  name: string;
  memberCount: number;
}

const initialPositions: PositionRecord[] = [
  { id: "position-001", name: "代表取締役", memberCount: 1 },
  { id: "position-002", name: "営業部長", memberCount: 2 },
  { id: "position-003", name: "マネージャー", memberCount: 4 },
  { id: "position-004", name: "メンバー", memberCount: 12 },
];

export default function PositionsPage() {
  const [positions, setPositions] = useState(initialPositions);
  const [positionName, setPositionName] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleAddPosition = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const name = positionName.trim();
    if (!name) {
      setErrorMessage("役職名を入力してください。");
      return;
    }

    if (positions.some((position) => position.name === name)) {
      setErrorMessage("同じ役職名がすでに登録されています。");
      return;
    }

    setPositions((current) => [
      ...current,
      {
        id: `position-${Date.now()}`,
        name,
        memberCount: 0,
      },
    ]);
    setPositionName("");
    setErrorMessage("");
  };

  const handleDeletePosition = (positionId: string) => {
    setPositions((current) =>
      current.filter((position) => position.id !== positionId),
    );
  };

  return (
    <AppLayout>
      <div className="flex h-full flex-col overflow-hidden bg-background">
        <div className="shrink-0 border-b border-border bg-card px-4 py-5 md:px-6">
          <div className="flex flex-col items-stretch justify-between gap-4 md:flex-row md:items-center">
            <div>
              <div className="flex w-full items-center gap-2 md:w-auto">
                <h1 className="text-xl font-bold tracking-tight text-foreground">
                  役職設定
                </h1>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                利用ユーザーに割り当てる役職を追加・削除できます。
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="grid gap-4 xl:grid-cols-[minmax(280px,360px)_1fr]">
            <form
              onSubmit={handleAddPosition}
              className="rounded-lg border border-border bg-card p-4 shadow-sm"
            >
              <h2 className="text-sm font-bold text-foreground">役職を追加</h2>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                組織で利用する役職名を入力してください。
              </p>
              <label className="mt-4 block">
                <span className="mb-2 block text-sm font-medium text-foreground">
                  役職名
                </span>
                <input
                  value={positionName}
                  onChange={(event) => {
                    setPositionName(event.target.value);
                    setErrorMessage("");
                  }}
                  placeholder="例：営業部長"
                  className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition-all focus:border-ring focus:ring-2 focus:ring-ring/20"
                />
              </label>
              {errorMessage ? (
                <p className="mt-3 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">
                  {errorMessage}
                </p>
              ) : null}
              <Button
                type="submit"
                variant="primary"
                className="mt-4 w-full gap-2"
              >
                <Plus className="h-4 w-4" />
                追加
              </Button>
            </form>

            <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead>役職名</TableHead>
                    <TableHead className="w-32 text-right">利用人数</TableHead>
                    <TableHead className="w-24 text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {positions.map((position) => (
                    <TableRow key={position.id}>
                      <TableCell className="font-medium text-foreground">
                        {position.name}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {position.memberCount}人
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="gap-1.5"
                          onClick={() => handleDeletePosition(position.id)}
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
    </AppLayout>
  );
}
