import { useState, type FormEvent } from "react";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Plus, Trash2 } from "lucide-react";

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
import { cn } from "@/lib/utils";

type RegistrationTab = "industries" | "phases" | "labels";

interface RegistrationRecord {
  id: string;
  name: string;
  count: number;
}

interface RegistrationCategory {
  tab: RegistrationTab;
  title: string;
  description: string;
  columnLabel: string;
  inputLabel: string;
  placeholder: string;
  duplicateMessage: string;
  emptyMessage: string;
  countLabel: string;
  initialRecords: RegistrationRecord[];
}

const categories: RegistrationCategory[] = [
  {
    tab: "industries",
    title: "業種設定",
    description: "顧客情報で選択する業種を管理します。",
    columnLabel: "業種名",
    inputLabel: "業種名",
    placeholder: "例：IT・ソフトウェア",
    duplicateMessage: "同じ業種名がすでに登録されています。",
    emptyMessage: "業種名を入力してください。",
    countLabel: "利用件数",
    initialRecords: [
      { id: "industry-001", name: "IT・ソフトウェア", count: 18 },
      { id: "industry-002", name: "製造業", count: 9 },
      { id: "industry-003", name: "金融・保険", count: 6 },
      { id: "industry-004", name: "小売・EC", count: 5 },
    ],
  },
  {
    tab: "phases",
    title: "フェーズ設定",
    description: "上から下の順番が、顧客や案件の進行フローになります。",
    columnLabel: "フェーズ名",
    inputLabel: "フェーズ名",
    placeholder: "例：商談中",
    duplicateMessage: "同じフェーズ名がすでに登録されています。",
    emptyMessage: "フェーズ名を入力してください。",
    countLabel: "利用件数",
    initialRecords: [
      { id: "phase-001", name: "リード", count: 12 },
      { id: "phase-002", name: "商談中", count: 15 },
      { id: "phase-003", name: "提案中", count: 8 },
      { id: "phase-004", name: "成約", count: 4 },
    ],
  },
  {
    tab: "labels",
    title: "ラベル設定",
    description: "顧客や案件に付与する分類ラベルを管理します。",
    columnLabel: "ラベル名",
    inputLabel: "ラベル名",
    placeholder: "例：既存顧客",
    duplicateMessage: "同じラベル名がすでに登録されています。",
    emptyMessage: "ラベル名を入力してください。",
    countLabel: "利用件数",
    initialRecords: [
      { id: "label-001", name: "既存顧客", count: 16 },
      { id: "label-002", name: "新規顧客", count: 10 },
      { id: "label-003", name: "掘り起こし", count: 7 },
      { id: "label-004", name: "重点対応", count: 5 },
    ],
  },
];

const initialRecordsByTab = categories.reduce(
  (records, category) => {
    records[category.tab] = category.initialRecords;
    return records;
  },
  {} as Record<RegistrationTab, RegistrationRecord[]>,
);

export default function RegistrationItemsPage() {
  const [recordsByTab, setRecordsByTab] = useState(initialRecordsByTab);
  const [activeTab, setActiveTab] = useState<RegistrationTab>("industries");
  const activeCategory =
    categories.find((category) => category.tab === activeTab) ?? categories[0];

  const addRecord = (tab: RegistrationTab, record: RegistrationRecord) => {
    setRecordsByTab((current) => ({
      ...current,
      [tab]: [...current[tab], record],
    }));
  };

  const deleteRecord = (tab: RegistrationTab, recordId: string) => {
    setRecordsByTab((current) => ({
      ...current,
      [tab]: current[tab].filter((record) => record.id !== recordId),
    }));
  };

  const reorderRecords = (
    tab: RegistrationTab,
    activeId: string,
    overId: string,
  ) => {
    setRecordsByTab((current) => {
      const records = current[tab];
      const oldIndex = records.findIndex((record) => record.id === activeId);
      const newIndex = records.findIndex((record) => record.id === overId);

      if (oldIndex < 0 || newIndex < 0) return current;

      return {
        ...current,
        [tab]: arrayMove(records, oldIndex, newIndex),
      };
    });
  };

  return (
    <AppLayout>
      <div className="flex h-full flex-col overflow-hidden bg-background">
        <div className="shrink-0 border-b border-border bg-card px-4 py-5 md:px-6">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              登録項目の設定
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              業種、フェーズ、ラベルの選択肢を管理します。
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-muted/5 p-3 md:p-4">
          <div className="mx-auto flex max-w-5xl flex-col gap-3">
            <div className="flex shrink-0 overflow-x-auto border-b border-border bg-muted/5 px-2">
              {categories.map((category) => {
                const isActive = activeTab === category.tab;
                return (
                  <button
                    key={category.tab}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    data-state={isActive ? "active" : "inactive"}
                    onClick={() => setActiveTab(category.tab)}
                    className={cn(
                      "min-w-[112px] border-b-2 px-3 py-3 text-center text-xs font-bold tracking-wider transition-colors",
                      isActive
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {category.title}
                  </button>
                );
              })}
            </div>

            <RegistrationTable
              key={activeCategory.tab}
              category={activeCategory}
              records={recordsByTab[activeCategory.tab]}
              onAdd={addRecord}
              onDelete={deleteRecord}
              onReorder={reorderRecords}
            />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function RegistrationTable({
  category,
  records,
  onAdd,
  onDelete,
  onReorder,
}: {
  category: RegistrationCategory;
  records: RegistrationRecord[];
  onAdd: (tab: RegistrationTab, record: RegistrationRecord) => void;
  onDelete: (tab: RegistrationTab, recordId: string) => void;
  onReorder: (tab: RegistrationTab, activeId: string, overId: string) => void;
}) {
  const [name, setName] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );
  const isPhaseTable = category.tab === "phases";

  const handleAdd = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrorMessage(category.emptyMessage);
      return;
    }

    if (records.some((record) => record.name === trimmedName)) {
      setErrorMessage(category.duplicateMessage);
      return;
    }

    onAdd(category.tab, {
      id: `${category.tab}-${Date.now()}`,
      name: trimmedName,
      count: 0,
    });
    setName("");
    setErrorMessage("");
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    onReorder(category.tab, String(active.id), String(over.id));
  };

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
      <div className="flex flex-col gap-3 border-b border-border bg-card px-3 py-3 md:flex-row md:items-end md:justify-between md:px-4">
        <div className="min-w-0">
          <h2 className="text-sm font-bold text-foreground">
            {category.title}
          </h2>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            {category.description}
          </p>
        </div>

        <form
          onSubmit={handleAdd}
          className="grid gap-2 md:w-[440px] md:grid-cols-[1fr_auto]"
        >
          <label className="block">
            <span className="sr-only">{category.inputLabel}</span>
            <input
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setErrorMessage("");
              }}
              placeholder={category.placeholder}
              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition-all focus:border-ring focus:ring-2 focus:ring-ring/20"
            />
          </label>
          <Button type="submit" variant="primary" size="md" className="gap-1.5">
            <Plus className="h-4 w-4" />
            新規作成
          </Button>
          {errorMessage ? (
            <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive md:col-span-2">
              {errorMessage}
            </p>
          ) : null}
        </form>
      </div>

      {isPhaseTable ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={records.map((record) => record.id)}
            strategy={verticalListSortingStrategy}
          >
            <RecordTable
              category={category}
              records={records}
              isDraggable
              onDelete={onDelete}
            />
          </SortableContext>
        </DndContext>
      ) : (
        <RecordTable
          category={category}
          records={records}
          isDraggable={false}
          onDelete={onDelete}
        />
      )}
    </div>
  );
}

function RecordTable({
  category,
  records,
  isDraggable,
  onDelete,
}: {
  category: RegistrationCategory;
  records: RegistrationRecord[];
  isDraggable: boolean;
  onDelete: (tab: RegistrationTab, recordId: string) => void;
}) {
  return (
    <Table className="table-fixed">
      <TableHeader className="bg-muted/40">
        <TableRow>
          {isDraggable ? (
            <>
              <TableHead className="w-12 px-3" />
              <TableHead className="w-20 px-3">順番</TableHead>
            </>
          ) : null}
          <TableHead className={cn("px-3", isDraggable ? "w-[46%]" : "w-[62%]")}>
            {category.columnLabel}
          </TableHead>
          <TableHead className="w-28 px-3 text-right">
            {category.countLabel}
          </TableHead>
          <TableHead className="w-28 px-3 text-right">操作</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {records.map((record, index) =>
          isDraggable ? (
            <SortableRecordRow
              key={record.id}
              category={category}
              record={record}
              index={index}
              onDelete={onDelete}
            />
          ) : (
            <RecordRow
              key={record.id}
              category={category}
              record={record}
              index={index}
              onDelete={onDelete}
            />
          ),
        )}
      </TableBody>
    </Table>
  );
}

function SortableRecordRow({
  category,
  record,
  index,
  onDelete,
}: {
  category: RegistrationCategory;
  record: RegistrationRecord;
  index: number;
  onDelete: (tab: RegistrationTab, recordId: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: record.id });

  return (
    <RecordRow
      ref={setNodeRef}
      category={category}
      record={record}
      index={index}
      isDragging={isDragging}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      dragHandleProps={{ ...attributes, ...listeners }}
      onDelete={onDelete}
    />
  );
}

function RecordRow({
  ref,
  category,
  record,
  index,
  isDragging = false,
  style,
  dragHandleProps,
  onDelete,
}: {
  ref?: React.Ref<HTMLTableRowElement>;
  category: RegistrationCategory;
  record: RegistrationRecord;
  index: number;
  isDragging?: boolean;
  style?: React.CSSProperties;
  dragHandleProps?: React.HTMLAttributes<HTMLButtonElement>;
  onDelete: (tab: RegistrationTab, recordId: string) => void;
}) {
  const isDraggable = category.tab === "phases";

  return (
    <TableRow
      ref={ref}
      style={style}
      className={isDragging ? "relative z-10 bg-primary/5 shadow-md" : ""}
    >
      {isDraggable ? (
        <>
          <TableCell className="px-3 py-3">
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring/30"
              aria-label={`${record.name} の順番を変更`}
              {...dragHandleProps}
            >
              <GripVertical className="h-4 w-4" />
            </button>
          </TableCell>
          <TableCell className="px-3 py-3">
            <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-primary/10 px-2 text-xs font-bold text-primary">
              {index + 1}
            </span>
          </TableCell>
        </>
      ) : null}
      <TableCell className="truncate px-3 py-3 font-medium text-foreground">
        {record.name}
      </TableCell>
      <TableCell className="px-3 py-3 text-right text-muted-foreground">
        {record.count}件
      </TableCell>
      <TableCell className="px-3 py-3 text-right">
        <Button
          type="button"
          variant="destructive"
          size="sm"
          className="gap-1.5"
          onClick={() => onDelete(category.tab, record.id)}
        >
          <Trash2 className="h-3.5 w-3.5" />
          削除
        </Button>
      </TableCell>
    </TableRow>
  );
}
