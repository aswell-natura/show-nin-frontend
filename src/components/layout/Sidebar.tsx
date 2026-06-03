import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useAuth } from "../../context/AuthContext";
import { managerSidebarMenuItems, sidebarMenuItems } from "../../data/mock";
import {
  Home,
  Building,
  Folder,
  CalendarDays,
  Mic,
  Target,
  Users,
  FileText,
  AlertTriangle,
  BookOpen,
  GripVertical,
  IdCard,
  Unlock,
  Lock,
  MessageCircle,
  Receipt,
  ScanText,
  ChevronLeft,
  ChevronRight,
  SquareCheckBig,
  type LucideIcon
} from "lucide-react";
import {
  loadFeatureFlags,
  OPTIONAL_FEATURE_FLAGS_EVENT,
  optionalFeatures,
} from "@/lib/feature-menu";

const sidebarIconMap: Record<string, LucideIcon> = {
  home: Home,
  building: Building,
  folder: Folder,
  mic: Mic,
  check: SquareCheckBig,
  target: Target,
  users: Users,
  "file-text": FileText,
  alert: AlertTriangle,
  calendar: CalendarDays,
  "scan-text": ScanText,
  "message-circle": MessageCircle,
  "id-card": IdCard,
  receipt: Receipt,
  "book-open": BookOpen,
};
import { Button } from "../ui/button";
import logoUrlLight from "../../assets/show-nin.svg";
import logoUrlDark from "../../assets/show-nin-white.svg";

interface SidebarProps {
  isMobileOpen: boolean;
  onMobileClose: () => void;
}

interface SortableItemProps {
  id: string;
  label: string;
  icon: string;
  isActive: boolean;
  isUnlocked: boolean;
  isCollapsed: boolean;
  onClick: () => void;
}

function SortableItem({
  id,
  label,
  icon,
  isActive,
  isUnlocked,
  isCollapsed,
  onClick,
}: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      title={isCollapsed ? label : undefined}
      className={`
        flex items-center gap-2.5 rounded-lg mx-2 text-sm cursor-pointer select-none
        transition-all duration-150
        ${isCollapsed ? "px-2 py-2.5 justify-center" : "px-3 py-2"}
        ${isActive ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-sm border border-primary/20" : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"}
        ${isDragging ? "shadow-md bg-sidebar-accent/50 backdrop-blur-sm" : ""}
      `}
      onClick={!isUnlocked ? onClick : undefined}
    >
      {isUnlocked && !isCollapsed && (
        <div
          {...attributes}
          {...listeners}
          className="text-sidebar-foreground/40 hover:text-sidebar-foreground/80 cursor-grab active:cursor-grabbing shrink-0"
        >
          <GripVertical className="w-3.5 h-3.5" />
        </div>
      )}
      {(() => {
        const MappedIcon = sidebarIconMap[icon];
        return MappedIcon ? <MappedIcon className="w-4 h-4 shrink-0" /> : null;
      })()}
      {!isCollapsed && <span className="truncate">{label}</span>}
    </div>
  );
}

function NavContent({
  order,
  isUnlocked,
  isCollapsed,
  onNavigate,
  onToggleLock,
  getActivePath,
  menuItems,
}: {
  order: string[];
  isUnlocked: boolean;
  isCollapsed: boolean;
  onNavigate: (id: string) => void;
  onToggleLock: () => void;
  getActivePath: (id: string) => boolean;
  menuItems: typeof sidebarMenuItems;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );
  const [localOrder, setLocalOrder] = useState(order);
  const currentOrder = [
    ...localOrder.filter((id) => order.includes(id)),
    ...order.filter((id) => !localOrder.includes(id)),
  ];

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setLocalOrder((prev) => {
        const nextOrder = [
          ...prev.filter((id) => order.includes(id)),
          ...order.filter((id) => !prev.includes(id)),
        ];
        const oldIndex = nextOrder.indexOf(active.id as string);
        const newIndex = nextOrder.indexOf(over.id as string);
        return arrayMove(nextOrder, oldIndex, newIndex);
      });
    }
  }

  const orderedItems = currentOrder
    .map((id) => menuItems.find((m) => m.id === id))
    .filter(Boolean) as typeof menuItems;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={currentOrder}
        strategy={verticalListSortingStrategy}
      >
        <nav className="flex flex-col gap-0.5 flex-1 min-h-0 overflow-y-auto overflow-x-hidden pb-2">
          {orderedItems.map((item) => (
            <SortableItem
              key={item.id}
              id={item.id}
              label={item.label}
              icon={item.icon}
              isActive={getActivePath(item.id)}
              isUnlocked={isUnlocked}
              isCollapsed={isCollapsed}
              onClick={() => onNavigate(item.id)}
            />
          ))}
        </nav>
      </SortableContext>

      {!isCollapsed && (
        <div className="px-3 pt-3 border-t border-border mx-2 mt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleLock}
            className={`w-full justify-start gap-2 text-xs transition-colors ${
              isUnlocked
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
            }`}
          >
            {isUnlocked ? (
              <Unlock className="w-3.5 h-3.5 shrink-0" />
            ) : (
              <Lock className="w-3.5 h-3.5 shrink-0" />
            )}
            <span>{isUnlocked ? "並び替えモード" : "メニューを並び替え"}</span>
          </Button>
        </div>
      )}
    </DndContext>
  );
}

export default function Sidebar({ isMobileOpen, onMobileClose }: SidebarProps) {
  const { currentUser, activeMode } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const effectiveMode =
    currentUser?.role === "manager"
      ? "manager"
      : currentUser?.role === "dual"
        ? activeMode
        : "player";
  const menuItems =
    effectiveMode === "manager" ? managerSidebarMenuItems : sidebarMenuItems;
  const [featureFlags, setFeatureFlags] = useState(() => loadFeatureFlags());
  const enabledFeatureItems = optionalFeatures
    .filter((feature) => featureFlags[feature.id])
    .map((feature) => ({
      id: feature.id,
      label: feature.label,
      icon: feature.icon,
      path: feature.path,
    }));
  const sidebarItems = [...menuItems, ...enabledFeatureItems];
  const roleDefaultOrder = sidebarItems.map((m) => m.id);
  const userOrder = currentUser?.sidebar_settings.order ?? roleDefaultOrder;
  const normalizedUserOrder = [
    ...userOrder.filter((id) => sidebarItems.some((m) => m.id === id)),
    ...roleDefaultOrder.filter((id) => !userOrder.includes(id)),
  ];
  const initialOrder =
    effectiveMode === "manager" ? roleDefaultOrder : normalizedUserOrder;
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const refresh = () => setFeatureFlags(loadFeatureFlags());
    window.addEventListener(OPTIONAL_FEATURE_FLAGS_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(OPTIONAL_FEATURE_FLAGS_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  function getActivePath(itemId: string) {
    if (itemId === "home") return location.pathname === "/dashboard";
    if (itemId === "customers")
      return location.pathname.startsWith("/customers");
    if (itemId === "projects") return location.pathname.startsWith("/projects");
    if (itemId === "minutes") return location.pathname.startsWith("/minutes");
    if (itemId === "tasks") return location.pathname.startsWith("/tasks");
    if (itemId === "members") return location.pathname.startsWith("/members");
    if (itemId === "budget")
      return (
        location.pathname.startsWith("/budget") ||
        location.pathname.startsWith("/my-budget")
      );
    if (itemId === "reviews") return location.pathname.startsWith("/reviews");
    if (itemId === "risks") return location.pathname.startsWith("/risks");
    if (itemId === "reports") return location.pathname.startsWith("/reports");
    if (optionalFeatures.some((feature) => feature.id === itemId)) {
      return location.pathname.startsWith("/settings");
    }
    return false;
  }

  function handleNavigate(itemId: string) {
    if (itemId === "home") navigate("/dashboard");
    else if (itemId === "customers") navigate("/customers");
    else if (itemId === "projects") navigate("/projects");
    else if (itemId === "minutes") navigate("/minutes");
    else if (itemId === "tasks") navigate("/tasks");
    else if (itemId === "members") navigate("/members");
    else if (itemId === "budget")
      navigate(effectiveMode === "manager" ? "/budget" : "/my-budget");
    else if (itemId === "reviews") navigate("/reviews");
    else if (itemId === "risks") navigate("/risks");
    else if (itemId === "reports") navigate("/reports/rep-001");
    else {
      const feature = optionalFeatures.find((item) => item.id === itemId);
      navigate(feature?.path ?? "/dashboard");
    }
    onMobileClose();
  }

  const sharedProps = {
    order: initialOrder,
    isUnlocked,
    isCollapsed: false,
    onNavigate: handleNavigate,
    onToggleLock: () => setIsUnlocked((v) => !v),
    getActivePath,
    menuItems: sidebarItems,
  };

  return (
    <>
      {/* ─── モバイル：オーバーレイドロワー ─────────────────── */}
      <div
        className={`
          md:hidden fixed inset-0 z-60 transition-opacity duration-200
          ${isMobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}
        `}
      >
        {/* 背景タップで閉じる */}
        <div className="absolute inset-0 bg-black/30" onClick={onMobileClose} />

        {/* ドロワー本体 */}
        <aside
          className={`
            absolute top-0 left-0 h-full w-64 bg-sidebar flex flex-col py-3 overflow-hidden
            border-r border-sidebar-border shadow-xl
            transition-transform duration-200
            ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
          `}
        >
          {/* 閉じるボタン */}
          <div className="flex items-center justify-between px-4 mb-3">
            <div className="flex items-center gap-2">
              <>
                <img src={logoUrlLight} alt="SHOW-NIN" className="w-8 h-8 dark:hidden" />
                <img src={logoUrlDark} alt="SHOW-NIN" className="w-8 h-8 hidden dark:block" />
              </>
              <span className="text-sm font-semibold text-sidebar-foreground">
                SHOW-NIN
              </span>
            </div>
            <button
              onClick={onMobileClose}
              className="w-7 h-7 flex items-center justify-center rounded-md text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
          <NavContent {...sharedProps} />
        </aside>
      </div>

      {/* ─── デスクトップ：インラインサイドバー ──────────────── */}
      <aside
        className={`
          hidden md:flex flex-col py-3 bg-sidebar border-r border-sidebar-border shrink-0 overflow-hidden
          transition-all duration-200
          ${isCollapsed ? "w-14" : "w-52"}
        `}
      >
        {/* 折り畳みトグル */}
        <div
          className={`flex mb-2 ${isCollapsed ? "justify-center" : "justify-end px-3"}`}
        >
          <button
            onClick={() => {
              setIsCollapsed((v) => !v);
              if (!isCollapsed) setIsUnlocked(false);
            }}
            title={isCollapsed ? "サイドバーを開く" : "サイドバーを閉じる"}
            className="w-7 h-7 flex items-center justify-center rounded-md text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
          >
            {isCollapsed ? (
              <ChevronRight className="w-3.5 h-3.5" />
            ) : (
              <ChevronLeft className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
        <NavContent {...sharedProps} isCollapsed={isCollapsed} />
      </aside>
    </>
  );
}
