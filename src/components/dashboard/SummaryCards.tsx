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
import Icon from "../ui/Icon";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, GripVertical } from "lucide-react";

interface CardValue {
  id: number;
  value: string | number;
}

function computeCardValues(_mode: ActiveMode): CardValue[] {
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
    { id: 11, value: "2,500" },
    { id: 12, value: 45 },
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
    <Card
      ref={setNodeRef}
      style={style}
      {...(isEditMode ? { ...attributes, ...listeners } : {})}
      className={`
        flex-1 min-w-[130px] max-w-[220px] rounded-lg p-3.5 flex flex-col justify-center select-none snap-start
        transition-all duration-150 hover:bg-accent/50
        ${isEditMode ? "cursor-grab active:cursor-grabbing shadow-md scale-[1.02] border border-primary/50" : "border-[0.5] shadow-none hover:shadow-md"}
        ${isDragging ? "shadow-xl scale-105 z-50" : ""}
      `}
    >
      {isEditMode && (
        <div className="absolute top-2 right-2 text-muted-foreground/30">
          <GripVertical className="w-3.5 h-3.5" />
        </div>
      )}
      <div className="min-w-0 w-full text-left">
        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider truncate mb-1.5">
          {def.label}
        </p>
        <p className="text-2xl font-bold leading-none text-foreground tracking-tight">
          {val?.value ?? "—"}
          {def.unit && (
            <span className="text-xs font-normal ml-1 text-muted-foreground">
              {def.unit}
            </span>
          )}
        </p>
      </div>
    </Card>
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
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );
  const values = computeCardValues(mode);

  const visibleDefs = dashboardCardDefs.filter(
    (d) => d.role_visibility === mode || d.role_visibility === "both",
  );
  const orderedIds = cardOrder.filter((id) =>
    visibleDefs.some((d) => d.id === id),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = orderedIds.indexOf(active.id as number);
      const newIndex = orderedIds.indexOf(over.id as number);
      onOrderChange(arrayMove(orderedIds, oldIndex, newIndex));
    }
  }

  function toggleCardVisibility(id: number) {
    if (cardOrder.includes(id)) {
      onOrderChange(cardOrder.filter((i) => i !== id));
    } else {
      onOrderChange([...cardOrder, id]);
    }
  }

  return (
    <div className="bg-background border-b border-border flex flex-col shrink-0">
      <div className="flex items-center justify-between px-4 py-2 h-11">
        {/* 折り畳みトグル + ラベル */}
        <button
          onClick={() => {
            setIsVisible(!isVisible);
            if (isEditMode) setIsEditMode(false);
          }}
          className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors shrink-0"
        >
          <Icon
            name={isVisible ? "chevron-up" : "chevron-down"}
            className="w-4 h-4"
          />
          <span className="text-[11px] font-medium uppercase tracking-wider">
            サマリー
          </span>
        </button>

        <div className="flex items-center gap-2">
          {/* 表示項目選択ボタン */}
          {isVisible && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="secondary"
                  size="sm"
                  className="h-7 text-[11px] rounded-full px-3"
                >
                  表示項目 <ChevronDown className="ml-1 h-3 w-3 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  サマリー項目
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {visibleDefs.map((def) => (
                  <DropdownMenuCheckboxItem
                    key={def.id}
                    checked={cardOrder.includes(def.id)}
                    onCheckedChange={() => toggleCardVisibility(def.id)}
                    onSelect={(e) => e.preventDefault()}
                    className="text-xs"
                  >
                    {def.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* 並び替えボタン */}
          {isVisible && (
            <Button
              variant={isEditMode ? "primary" : "secondary"}
              size="sm"
              onClick={() => setIsEditMode(!isEditMode)}
              className="h-7 text-[11px] rounded-full px-3"
            >
              {isEditMode ? "完了" : "並び替え"}
            </Button>
          )}
        </div>
      </div>

      {/* カード列 */}
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
                  [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]
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
