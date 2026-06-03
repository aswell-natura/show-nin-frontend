import { useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { dashboardCardDefs } from "../../data/mock";
import type { ActiveMode } from "../../types";
import { Button } from "@/components/ui/button";
import { StatCard } from "./shared/StatCard";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  GripVertical,
  ChevronUp,
  ChevronDown,
  GalleryHorizontal,
  Check,
  ArrowLeftRight,
} from "lucide-react";

interface CardValue {
  id: number;
  value: string | number;
}

function computeCardValues(): CardValue[] {
  return [
    { id: 1, value: 3 },
    { id: 2, value: 2 },
    { id: 3, value: "1,850" },
    { id: 4, value: 5 },
    { id: 5, value: 72 },
    { id: 6, value: 68 },
    { id: 7, value: 8 },
    { id: 8, value: 3 },
    { id: 9, value: 2 },
    { id: 10, value: "640" },
    { id: 11, value: "1,500" },
    { id: 12, value: 45 },
    { id: 13, value: 0 },
    { id: 14, value: 0 },
    { id: 15, value: 0 },
    { id: 16, value: 7 },
  ];
}

interface SortableCardProps {
  cardId: number;
  isEditMode: boolean;
  values: CardValue[];
}

function SortableCard({ cardId, isEditMode, values }: SortableCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: cardId });
  const def = dashboardCardDefs.find((d) => d.id === cardId);
  const val = values.find((v) => v.id === cardId);
  if (!def) return null;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <StatCard
      ref={setNodeRef}
      style={style}
      {...(isEditMode ? { ...attributes, ...listeners } : {})}
      className={cn(
        "flex-1 min-w-[130px] max-w-[220px] select-none snap-start bg-card text-card-foreground",
        isEditMode
          ? "cursor-grab active:cursor-grabbing shadow-md scale-[1.02] border border-primary/50"
          : "",
        isDragging ? "shadow-xl scale-105 z-50" : "",
      )}
      label={def.label}
      value={val?.value ?? 0}
      unit={def.unit}
      icon={isEditMode ? <GripVertical className="w-3.5 h-3.5" /> : undefined}
    />
  );
}

interface SummaryCardsProps {
  mode: ActiveMode;
  cardOrder: number[];
  onOrderChange: (newOrder: number[]) => void;
}

export default function SummaryCards({
  mode,
  cardOrder,
  onOrderChange,
}: SummaryCardsProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const values = computeCardValues();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  const visibleDefs = dashboardCardDefs.filter(
    (d) => d.role_visibility === mode || d.role_visibility === "both",
  );

  const orderedIds = cardOrder.filter((id) =>
    visibleDefs.some((d) => d.id === id),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = cardOrder.indexOf(active.id as number);
      const newIndex = cardOrder.indexOf(over.id as number);
      onOrderChange(arrayMove(cardOrder, oldIndex, newIndex));
    }
  }

  function toggleCardVisibility(id: number) {
    if (cardOrder.includes(id)) {
      onOrderChange(cardOrder.filter((i) => i !== id));
    } else if (cardOrder.length < 7) {
      onOrderChange([...cardOrder, id]);
    }
  }

  return (
    <div className="bg-background border-b border-border flex flex-col shrink-0 py-2">
      <div className="flex items-center justify-between px-4 py-2 h-11">
        <button
          onClick={() => {
            setIsVisible(!isVisible);
            if (isEditMode) setIsEditMode(false);
          }}
          className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors shrink-0"
        >
          {isVisible ? (
            <ChevronUp className="w-5 h-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          )}
          <span className="text-lg font-bold text-foreground">サマリー</span>
        </button>

        <div className="flex items-center gap-2">
          {/* 表示項目選択ボタン */}
          {isVisible && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="secondary"
                  className="h-8 gap-1.5 px-3 rounded-lg text-[11px] font-bold"
                >
                  <GalleryHorizontal className="w-3.5 h-3.5" />
                  <span>サマリー項目</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="px-2 py-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    サマリー項目
                  </p>
                  <p className="text-[9px] text-primary/70 mt-0.5">
                    最大7件まで選択可能
                  </p>
                </div>
                <DropdownMenuSeparator />
                {visibleDefs.map((def) => {
                  const isChecked = cardOrder.includes(def.id);
                  const isMaxReached = cardOrder.length >= 7;
                  return (
                    <DropdownMenuCheckboxItem
                      key={def.id}
                      checked={isChecked}
                      disabled={!isChecked && isMaxReached}
                      onCheckedChange={() => toggleCardVisibility(def.id)}
                      onSelect={(e) => e.preventDefault()}
                      className="text-xs"
                    >
                      {def.label}
                    </DropdownMenuCheckboxItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* 並び替えボタン */}
          {isVisible && (
            <Button
              variant={isEditMode ? "primary" : "secondary"}
              onClick={() => setIsEditMode(!isEditMode)}
              className="h-8 gap-1.5 px-3 rounded-lg text-[11px] font-bold"
            >
              {isEditMode ? (
                <Check className="w-3.5 h-3.5" />
              ) : (
                <ArrowLeftRight className="w-3.5 h-3.5" />
              )}
              <span>{isEditMode ? "完了" : "並び替え"}</span>
            </Button>
          )}
        </div>
      </div>

      {isVisible && (
        <div className="px-4 pb-3">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={orderedIds}
              strategy={horizontalListSortingStrategy}
            >
              <div
                className={`
                  flex gap-3 overflow-x-auto min-w-0 py-2 px-2 snap-x transition-all duration-300 rounded-xl
                  scrollbar-none touch-pan-x
                  ${isEditMode ? "bg-muted/50 shadow-inner outline outline-foreground/10 ring-1 ring-accent/10" : ""}
                `}
              >
                {orderedIds.length > 0 ? (
                  orderedIds.map((id) => (
                    <SortableCard
                      key={id}
                      cardId={id}
                      isEditMode={isEditMode}
                      values={values}
                    />
                  ))
                ) : (
                  <div className="flex-1 py-5 rounded-lg border border-dashed border-border flex items-center justify-center text-[10px] uppercase tracking-widest text-muted-foreground/50 font-medium">
                    表示する項目がありません
                  </div>
                )}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}
    </div>
  );
}
