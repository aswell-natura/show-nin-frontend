import { useMemo, useState, type FormEvent } from "react";
import {
  Building2,
  BriefcaseBusiness,
  Calendar,
  ListChecks,
  User,
} from "lucide-react";

import CustomerDialogForm from "@/components/customers/CustomerDialogForm";
import MemberDialogForm from "@/components/members/MemberDialogForm";
import ProjectDialogForm from "@/components/projects/ProjectDialogForm";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { DatePicker } from "@/components/ui/date-picker";
import {
  LinearDialogHeader,
  LinearDialogMetadataBar,
  LinearDialogPill,
  LinearDialogTextarea,
} from "@/components/ui/linear-dialog";
import { useDataStore } from "@/context/DataStoreContext";
import { useGlobalDialog } from "@/context/GlobalDialogContext";
import type { Task } from "@/types";

export interface TaskDialogValues {
  title: string;
  summary: string;
  customer_id: string;
  project_id: string | null;
  user_id: string;
  due_date: string;
  is_completed: boolean;
  progress_percent: number;
  progress_updated_at: string;
}

export interface TaskDialogFormProps {
  formId: string;
  submitLabel: string;
  initialValues?: Partial<TaskDialogValues>;
  onSubmit: (values: Omit<Task, "id">) => void;
}

const progressOptions = Array.from({ length: 11 }, (_, index) => index * 10);

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

export default function TaskDialogForm({
  formId,
  submitLabel,
  initialValues,
  onSubmit,
}: TaskDialogFormProps) {
  const {
    customers,
    projects,
    profiles,
    addCustomer,
    addProject,
    addProfile,
  } = useDataStore();
  const { openDialog, closeDialog } = useGlobalDialog();

  const defaultCustomerId = initialValues?.customer_id ?? customers[0]?.id ?? "";
  const defaultProjectId =
    initialValues?.project_id ??
    projects.find((project) => project.customer_id === defaultCustomerId)?.id ??
    projects[0]?.id ??
    null;
  const defaultOwnerId = initialValues?.user_id ?? profiles[0]?.id ?? "user-001";

  const [values, setValues] = useState<{
    title: string;
    summary: string;
    customer_id: string;
    project_id: string | null;
    user_id: string;
    due_date: string;
    progress_percent: number;
  }>({
    title: initialValues?.title ?? "",
    summary: initialValues?.summary ?? "",
    customer_id: defaultCustomerId,
    project_id: defaultProjectId,
    user_id: defaultOwnerId,
    due_date: initialValues?.due_date ?? todayString(),
    progress_percent: initialValues?.progress_percent ?? 0,
  });
  const [openPopover, setOpenPopover] = useState<string | null>(null);

  const updateValue = <K extends keyof typeof values>(key: K, value: typeof values[K]) => {
    setValues((current) => ({ ...current, [key]: value }));
  };

  const customerOptions = useMemo(
    () =>
      customers
        .map((customer) => ({ label: customer.name, value: customer.id }))
        .sort((a, b) => a.label.localeCompare(b.label, "ja")),
    [customers],
  );

  const projectOptions = useMemo(() => {
    const visibleProjects = values.customer_id
      ? projects.filter((project) => project.customer_id === values.customer_id)
      : projects;

    return visibleProjects
      .map((project) => ({ label: project.name, value: project.id }))
      .sort((a, b) => a.label.localeCompare(b.label, "ja"));
  }, [projects, values.customer_id]);

  const ownerOptions = useMemo(
    () =>
      profiles
        .map((profile) => ({ label: profile.name, value: profile.id }))
        .sort((a, b) => a.label.localeCompare(b.label, "ja")),
    [profiles],
  );

  const selectedCustomerName = useMemo(() => {
    return customers.find((customer) => customer.id === values.customer_id)?.name ?? "未設定";
  }, [customers, values.customer_id]);

  const selectedProjectName = useMemo(() => {
    if (!values.project_id) return "未設定";
    return projects.find((project) => project.id === values.project_id)?.name ?? "未設定";
  }, [projects, values.project_id]);

  const selectedOwnerName = useMemo(() => {
    return profiles.find((profile) => profile.id === values.user_id)?.name ?? "未設定";
  }, [profiles, values.user_id]);

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
    updateValue("project_id", null);
    setOpenPopover(null);
  };

  const handleCreateCustomerDetail = (name: string) => {
    const nestedFormId = "add-customer-from-task-form";
    openDialog({
      mode: "add",
      eyebrow: "顧客",
      breadcrumbs: ["新規作成"],
      title: "顧客を追加",
      hideHeaderTitle: true,
      size: "xl",
      content: (
        <CustomerDialogForm
          formId={nestedFormId}
          submitLabel="顧客を追加"
          initialValues={{ name }}
          onSubmit={(customerValues) => {
            const newCustomer = addCustomer({
              ...customerValues,
              created_by: values.user_id || "user-001",
            });
            updateValue("customer_id", newCustomer.id);
            updateValue("project_id", null);
            closeDialog();
          }}
        />
      ),
      footer: (
        <>
          <Button type="button" variant="secondary" onClick={closeDialog}>
            キャンセル
          </Button>
          <Button type="submit" form={nestedFormId} variant="primary">
            顧客を追加
          </Button>
        </>
      ),
    });
    setOpenPopover(null);
  };

  const handleCreateProjectQuick = (name: string) => {
    const newProject = addProject({
      name,
      customer_id: values.customer_id || null,
      status: "lead",
      priority: 2,
      amount: 0,
      user_id: values.user_id || "user-001",
      source: "manual",
      next_action_date: values.due_date,
    });
    updateValue("project_id", newProject.id);
    setOpenPopover(null);
  };

  const handleCreateProjectDetail = (name: string) => {
    const nestedFormId = "add-project-from-task-form";
    openDialog({
      mode: "add",
      eyebrow: "案件",
      breadcrumbs: ["新規作成"],
      title: "案件を追加",
      hideHeaderTitle: true,
      size: "xl",
      content: (
        <ProjectDialogForm
          formId={nestedFormId}
          submitLabel="案件を追加"
          initialValues={{
            name,
            customer_id: values.customer_id || null,
            user_id: values.user_id || "user-001",
            source: "manual",
            next_action_date: values.due_date,
          }}
          onSubmit={(projectValues) => {
            const newProject = addProject(projectValues);
            updateValue("project_id", newProject.id);
            if (newProject.customer_id) {
              updateValue("customer_id", newProject.customer_id);
            }
            closeDialog();
          }}
        />
      ),
      footer: (
        <>
          <Button type="button" variant="secondary" onClick={closeDialog}>
            キャンセル
          </Button>
          <Button type="submit" form={nestedFormId} variant="primary">
            案件を追加
          </Button>
        </>
      ),
    });
    setOpenPopover(null);
  };

  const handleCreateOwnerQuick = (name: string) => {
    const initials = name
      .split(" ")
      .map((part) => part[0])
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
    const nestedFormId = "add-member-from-task-form";
    openDialog({
      mode: "add",
      eyebrow: "メンバー",
      breadcrumbs: ["新規作成"],
      title: "メンバーを追加",
      hideHeaderTitle: true,
      size: "xl",
      content: (
        <MemberDialogForm
          formId={nestedFormId}
          initialValues={{ name }}
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
          <Button type="submit" form={nestedFormId} variant="primary">
            メンバーを追加
          </Button>
        </>
      ),
    });
    setOpenPopover(null);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const title = values.title.trim();
    if (!title) return;

    const progress = Number(values.progress_percent) || 0;
    onSubmit({
      title,
      summary: values.summary.trim() || undefined,
      customer_id: values.customer_id,
      project_id: values.project_id || null,
      user_id: values.user_id,
      due_date: values.due_date || todayString(),
      is_completed: progress === 100,
      progress_percent: progress,
      progress_updated_at: todayString(),
    });
  };

  return (
    <form id={formId} onSubmit={handleSubmit} className="flex flex-col">
      <LinearDialogHeader
        titlePlaceholder="タスク名（例: 次回提案資料を準備）"
        titleValue={values.title}
        onTitleChange={(value) => updateValue("title", value)}
        titleRequired
      />

      <LinearDialogMetadataBar>
        <LinearDialogPill
          icon={<Building2 className="size-3.5" />}
          label="企業"
          value={selectedCustomerName}
          active={Boolean(values.customer_id)}
          open={openPopover === "customer"}
          onOpenChange={(open) => setOpenPopover(open ? "customer" : null)}
          popoverClassName="w-72 sm:w-80"
          popoverContent={
            <div className="flex flex-col gap-2">
              <p className="px-1 py-0.5 text-xs font-bold text-muted-foreground">
                企業を紐づける
              </p>
              <Combobox
                options={customerOptions}
                value={values.customer_id}
                onValueChange={(value) => {
                  updateValue("customer_id", value);
                  const nextProject = projects.find((project) => project.customer_id === value);
                  updateValue("project_id", nextProject?.id ?? null);
                  setOpenPopover(null);
                }}
                onCreateOptionQuick={handleCreateCustomerQuick}
                onCreateOptionDetail={handleCreateCustomerDetail}
                placeholder="企業名で検索..."
                className="h-8 w-full text-xs font-semibold"
              />
            </div>
          }
        />

        <LinearDialogPill
          icon={<BriefcaseBusiness className="size-3.5" />}
          label="案件"
          value={selectedProjectName}
          active={Boolean(values.project_id)}
          open={openPopover === "project"}
          onOpenChange={(open) => setOpenPopover(open ? "project" : null)}
          popoverClassName="w-72 sm:w-80"
          popoverContent={
            <div className="flex flex-col gap-2">
              <p className="px-1 py-0.5 text-xs font-bold text-muted-foreground">
                案件を紐づける
              </p>
              <Combobox
                options={[{ label: "案件未設定", value: "" }, ...projectOptions]}
                value={values.project_id ?? ""}
                onValueChange={(value) => {
                  updateValue("project_id", value || null);
                  const selectedProject = projects.find((project) => project.id === value);
                  if (selectedProject?.customer_id) {
                    updateValue("customer_id", selectedProject.customer_id);
                  }
                  setOpenPopover(null);
                }}
                onCreateOptionQuick={handleCreateProjectQuick}
                onCreateOptionDetail={handleCreateProjectDetail}
                placeholder="案件名で検索..."
                className="h-8 w-full text-xs font-semibold"
              />
            </div>
          }
        />

        <LinearDialogPill
          icon={<User className="size-3.5" />}
          label="担当"
          value={selectedOwnerName}
          active={Boolean(values.user_id)}
          open={openPopover === "owner"}
          onOpenChange={(open) => setOpenPopover(open ? "owner" : null)}
          popoverClassName="w-72 sm:w-80"
          popoverContent={
            <div className="flex flex-col gap-2">
              <p className="px-1 py-0.5 text-xs font-bold text-muted-foreground">
                担当者を選択
              </p>
              <Combobox
                options={ownerOptions}
                value={values.user_id}
                onValueChange={(value) => {
                  updateValue("user_id", value);
                  setOpenPopover(null);
                }}
                onCreateOptionQuick={handleCreateOwnerQuick}
                onCreateOptionDetail={handleCreateOwnerDetail}
                placeholder="名前で検索..."
                className="h-8 w-full text-xs font-semibold"
              />
            </div>
          }
        />

      </LinearDialogMetadataBar>

      <div className="grid w-full grid-cols-1 gap-8 border-b border-border/60 py-6 md:grid-cols-2">
        <div className="flex h-fit flex-col gap-5 rounded-2xl border border-border/60 bg-muted/20 p-6 shadow-2xs dark:bg-muted/10">
          <h4 className="flex items-center gap-2 border-b border-border/60 pb-3 text-xs font-bold uppercase tracking-wider text-foreground">
            <Calendar className="size-4 text-primary" /> 日程
          </h4>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="task_due_date" className="text-xs font-bold text-foreground/90">
                期限日
              </label>
              <DatePicker
                id="task_due_date"
                value={values.due_date}
                onChange={(value) => updateValue("due_date", value)}
              />
            </div>
          </div>
        </div>

        <div className="flex h-fit flex-col gap-5 rounded-2xl border border-border/60 bg-muted/20 p-6 shadow-2xs dark:bg-muted/10">
          <h4 className="flex items-center gap-2 border-b border-border/60 pb-3 text-xs font-bold uppercase tracking-wider text-foreground">
            <ListChecks className="size-4 text-primary" /> 進捗
          </h4>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="task_progress_percent" className="text-xs font-bold text-foreground/90">
                進捗率
              </label>
              <select
                id="task_progress_percent"
                value={values.progress_percent}
                onChange={(event) => updateValue("progress_percent", Number(event.target.value))}
                className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm font-medium text-foreground shadow-2xs outline-none transition-all focus:border-ring focus:ring-2 focus:ring-ring/20"
              >
                {progressOptions.map((progress) => (
                  <option key={progress} value={progress}>
                    {progress}%
                  </option>
                ))}
              </select>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{ width: `${values.progress_percent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="border-b border-border/60 py-4">
        <h4 className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          <ListChecks className="size-3.5 text-primary" /> タスク概要
        </h4>
        <LinearDialogTextarea
          value={values.summary}
          onChange={(event) => updateValue("summary", event.target.value)}
          placeholder="タスクの目的、背景、完了条件などを入力..."
          className="min-h-28 text-sm leading-relaxed"
        />
      </div>

      <button type="submit" className="sr-only">
        {submitLabel}
      </button>
    </form>
  );
}
