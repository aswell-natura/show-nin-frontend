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

interface DepartmentRecord {
  id: string;
  name: string;
  memberCount: number;
}

const initialDepartments: DepartmentRecord[] = [
  { id: "department-001", name: "経営企画部", memberCount: 3 },
  { id: "department-002", name: "営業部", memberCount: 8 },
  { id: "department-003", name: "システム開発部", memberCount: 12 },
  { id: "department-004", name: "管理部", memberCount: 4 },
];

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState(initialDepartments);
  const [departmentName, setDepartmentName] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleAddDepartment = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const name = departmentName.trim();
    if (!name) {
      setErrorMessage("部署名を入力してください。");
      return;
    }

    if (departments.some((department) => department.name === name)) {
      setErrorMessage("同じ部署名がすでに登録されています。");
      return;
    }

    setDepartments((current) => [
      ...current,
      {
        id: `department-${Date.now()}`,
        name,
        memberCount: 0,
      },
    ]);
    setDepartmentName("");
    setErrorMessage("");
  };

  const handleDeleteDepartment = (departmentId: string) => {
    setDepartments((current) =>
      current.filter((department) => department.id !== departmentId),
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
                  部署設定
                </h1>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                利用ユーザーに割り当てる部署を追加・削除できます。
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="grid gap-4 xl:grid-cols-[minmax(280px,360px)_1fr]">
            <form
              onSubmit={handleAddDepartment}
              className="rounded-lg border border-border bg-card p-4 shadow-sm"
            >
              <h2 className="text-sm font-bold text-foreground">部署を追加</h2>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                組織で利用する部署名を入力してください。
              </p>
              <label className="mt-4 block">
                <span className="mb-2 block text-sm font-medium text-foreground">
                  部署名
                </span>
                <input
                  value={departmentName}
                  onChange={(event) => {
                    setDepartmentName(event.target.value);
                    setErrorMessage("");
                  }}
                  placeholder="例：営業部"
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
                    <TableHead>部署名</TableHead>
                    <TableHead className="w-32 text-right">利用人数</TableHead>
                    <TableHead className="w-24 text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {departments.map((department) => (
                    <TableRow key={department.id}>
                      <TableCell className="font-medium text-foreground">
                        {department.name}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {department.memberCount}人
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="gap-1.5"
                          onClick={() => handleDeleteDepartment(department.id)}
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
