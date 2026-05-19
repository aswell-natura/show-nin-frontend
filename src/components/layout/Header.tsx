import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useLayoutConfig } from "../../context/LayoutConfigContext";
import { useDataStore } from "../../context/DataStoreContext";
import type { ActiveMode } from "../../types";
import { Avatar, AvatarFallback } from "../ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { SearchBar } from "../ui/search-bar";
import {
  Settings,
  User,
  Lock,
  Building,
  CreditCard,
  CircleDollarSign,
  History,
  BarChart,
  HelpCircle,
  Database,
  LogOut,
  Bell,
} from "lucide-react";
import logoUrlLight from "../../assets/show-nin.svg";
import logoUrlDark from "../../assets/show-nin-white.svg";
import { RecordButton } from "./RecordButton";

interface HeaderProps {
  onMenuToggle: () => void;
}

export default function Header({ onMenuToggle }: HeaderProps) {
  const { currentUser, activeMode, setActiveMode, logout } = useAuth();
  const { playerConfig, managerConfig, openSettingsPanel } = useLayoutConfig();
  const { notifications, customers, resetToDefaults } = useDataStore();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  if (!currentUser) return null;

  const effectiveMode: ActiveMode =
    currentUser.role === "manager"
      ? "manager"
      : currentUser.role === "dual"
        ? activeMode
        : "player";

  const headerSize =
    effectiveMode === "manager"
      ? managerConfig.headerSize
      : playerConfig.headerSize;

  const isCompact = headerSize === "compact";
  const isLarge = headerSize === "large";

  const headerHeight = isCompact ? "h-10" : isLarge ? "h-16" : "h-14";
  const iconSize = isCompact ? "w-7 h-7" : isLarge ? "w-9 h-9" : "w-8 h-8";
  const px = isCompact ? "px-3 gap-2" : isLarge ? "px-5 gap-4" : "px-4 gap-3";

  const unreadCount = notifications.filter(
    (n) => n.user_id === currentUser.id && !n.is_read,
  ).length;

  const userNotifications = notifications.filter(
    (n) => n.user_id === currentUser.id,
  );

  const filteredCustomers =
    searchQuery.length > 0
      ? customers.filter(
          (c) =>
            c.name.includes(searchQuery) || c.industry.includes(searchQuery),
        )
      : [];

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <header
      className={`${headerHeight} bg-background border-b border-border flex items-center ${px} shrink-0 relative z-50 transition-all duration-200`}
    >
      {/* ハンバーガー（モバイルのみ） */}
      <button
        onClick={onMenuToggle}
        className={`md:hidden ${iconSize} flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted transition-colors shrink-0`}
      >
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.75}
        >
          <line x1="3" y1="6" x2="21" y2="6" strokeLinecap="round" />
          <line x1="3" y1="12" x2="21" y2="12" strokeLinecap="round" />
          <line x1="3" y1="18" x2="21" y2="18" strokeLinecap="round" />
        </svg>
      </button>

      {/* ロゴ */}
      <div
        className={`hidden md:block ${isCompact ? "text-sm" : isLarge ? "text-lg" : "text-base"} font-semibold text-foreground tracking-tight shrink-0`}
      >
        <>
          <img
            src={logoUrlLight}
            alt="SHOW-NIN"
            className="dark:hidden"
            width={isCompact ? "26" : isLarge ? "36" : "32"}
            height={isCompact ? "26" : isLarge ? "36" : "32"}
          />
          <img
            src={logoUrlDark}
            alt="SHOW-NIN"
            className="hidden dark:block"
            width={isCompact ? "26" : isLarge ? "36" : "32"}
            height={isCompact ? "26" : isLarge ? "36" : "32"}
          />
        </>
      </div>

      {/* 顧客検索（コンパクト時は非表示） */}
      {!isCompact && (
        <div className="absolute left-1/2 -translate-x-1/2 hidden sm:block w-full max-w-sm">
          <SearchBar
            placeholder="顧客を検索..."
            value={searchQuery}
            onSearchChange={setSearchQuery}
            isCompact={isCompact}
          />

          {filteredCustomers.length > 0 && (
            <div className="absolute top-10 left-0 w-full bg-background border border-border rounded-lg shadow-md overflow-hidden z-50">
              {filteredCustomers.map((c) => (
                <button
                  key={c.id}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted text-left"
                  onClick={() => {
                    navigate(`/customers/${c.id}`);
                    setSearchQuery("");
                  }}
                >
                  <div
                    className={`w-2 h-2 rounded-full shrink-0 ${c.rank === "A" ? "bg-primary" : c.rank === "B" ? "bg-muted-foreground" : "bg-border"}`}
                  />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {c.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {c.industry}
                    </p>
                  </div>
                  <span className="ml-auto text-xs text-muted-foreground">
                    ランク {c.rank}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Dual権限時のモード切り替え */}
      {currentUser.role === "dual" && (
        <div className="flex items-center bg-secondary border border-border rounded-full p-0.5 shrink-0">
          <button
            onClick={() => setActiveMode("player")}
            className={`px-2.5 sm:px-3.5 py-1 text-xs font-medium rounded-full transition-all duration-150 ${
              activeMode === "player"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span className="hidden sm:inline">Player</span>
          </button>
          <button
            onClick={() => setActiveMode("manager")}
            className={`px-2.5 sm:px-3.5 py-1 text-xs font-medium rounded-full transition-all duration-150 ${
              activeMode === "manager"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            MG<span className="hidden sm:inline">R</span>
          </button>
        </div>
      )}

      <div className="ml-auto flex items-center gap-4 shrink-0">
        {/* 録音ボタン */}
        <div className="hidden md:flex">
          <RecordButton compact={isCompact} />
        </div>

        {/* 表示設定 */}
        <button
          onClick={openSettingsPanel}
          title="表示設定"
          className={`${iconSize} flex items-center justify-center rounded-full text-muted-foreground hover:bg-muted transition-colors`}
        >
          <Settings className="w-4.5 h-4.5" />
        </button>

        {/* 通知 */}
        <div className="relative flex items-center justify-center">
          <Popover>
            <PopoverTrigger asChild>
              <button
                className={`relative ${iconSize} flex items-center justify-center rounded-full text-muted-foreground hover:bg-muted transition-colors outline-none`}
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-destructive text-background text-[10px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent
              className="w-72 sm:w-80 p-0 overflow-hidden"
              align="end"
              sideOffset={10}
            >
              <div className="px-4 py-3 border-b border-border">
                <p className="text-sm font-semibold text-foreground">通知</p>
              </div>
              <div className="max-h-72 overflow-y-auto">
                {userNotifications.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    通知はありません
                  </p>
                ) : (
                  userNotifications.map((n) => (
                    <div
                      key={n.id}
                      className={`px-4 py-3 border-b border-border hover:bg-muted cursor-pointer ${!n.is_read ? "bg-primary/5" : ""}`}
                    >
                      <p className="text-sm font-medium text-foreground">
                        {n.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {n.body}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(n.created_at).toLocaleDateString("ja-JP")}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* プロフィール */}
        <div className="relative flex items-center justify-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="rounded-full transition-colors hover:ring-2 hover:ring-primary/20 hover:ring-offset-1 hover:ring-offset-background outline-none">
                <Avatar
                  className={
                    isCompact ? "size-7" : isLarge ? "size-9" : "size-8"
                  }
                >
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                    {currentUser.avatar}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-64 max-h-[80vh] overflow-y-auto"
              align="end"
              sideOffset={10}
            >
              <div className="px-2 py-2 mb-1">
                <p className="text-sm font-semibold text-foreground truncate">
                  {currentUser.name}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {currentUser.email}
                </p>
              </div>

              <DropdownMenuSeparator />

              <DropdownMenuGroup>
                <DropdownMenuLabel>アカウント</DropdownMenuLabel>
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  <span>プロフィール編集</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Lock className="mr-2 h-4 w-4" />
                  <span>パスワード変更</span>
                </DropdownMenuItem>
              </DropdownMenuGroup>

              <DropdownMenuSeparator />

              <DropdownMenuGroup>
                <DropdownMenuLabel>設定</DropdownMenuLabel>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>基本設定 機能選択</span>
                </DropdownMenuItem>
                {effectiveMode === "manager" && (
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>詳細設定</span>
                  </DropdownMenuItem>
                )}
              </DropdownMenuGroup>

              {effectiveMode === "manager" && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuLabel>支払い・利用状況</DropdownMenuLabel>
                    <DropdownMenuItem>
                      <Building className="mr-2 h-4 w-4" />
                      <span>課金プラン</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <CreditCard className="mr-2 h-4 w-4" />
                      <span>カード情報変更</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-primary font-medium">
                      <CircleDollarSign className="mr-2 h-4 w-4" />
                      <span>AIパケット追加</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <History className="mr-2 h-4 w-4" />
                      <span>決済履歴</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-primary font-medium">
                      <History className="mr-2 h-4 w-4" />
                      <span>AIパケット履歴</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <BarChart className="mr-2 h-4 w-4" />
                      <span>利用状況</span>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </>
              )}

              <DropdownMenuSeparator />

              <DropdownMenuGroup>
                <DropdownMenuItem>
                  <HelpCircle className="mr-2 h-4 w-4" />
                  <span>使い方</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={resetToDefaults}>
                  <Database className="mr-2 h-4 w-4" />
                  <span>データをリセット</span>
                </DropdownMenuItem>
              </DropdownMenuGroup>

              <DropdownMenuSeparator />

              <DropdownMenuItem onClick={handleLogout} variant="destructive">
                <LogOut className="mr-2 h-4 w-4" />
                <span>ログアウト</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
