import {
  Home,
  Building,
  Folder,
  Check,
  File,
  Calendar,
  CheckCircle,
  CircleDollarSign,
  Clipboard,
  Target,
  BarChart,
  Users,
  FileText,
  AlertTriangle,
  TrendingUp,
  Lock,
  Unlock,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Mic,
  Search,
  Settings,
  GripVertical,
  HelpCircle,
  User,
  Mail,
  CreditCard,
  History,
  Palette,
  LogOut,
  Database,
  Sun,
  Moon,
  Type,
  Maximize,
  Minimize,
  Layout,
  LayoutDashboard,
  Columns2,
  Columns3,
  LayoutGrid,
  Square,
  CalendarCheck,
  Building2,
  Briefcase,
  CheckSquare,
  PieChart,
  Calculator,
  ClipboardCheck,
  GitPullRequest,
  ShieldAlert,
  Activity,
  Minus,
  type LucideIcon
} from 'lucide-react'

interface IconProps {
  name: string
  className?: string
  strokeWidth?: number
}

const iconMap: Record<string, LucideIcon> = {
  home: Home,
  building: Building,
  folder: Folder,
  check: Check,
  file: File,
  calendar: Calendar,
  'check-circle': CheckCircle,
  coin: CircleDollarSign,
  clipboard: Clipboard,
  target: Target,
  'bar-chart': BarChart,
  users: Users,
  'file-text': FileText,
  alert: AlertTriangle,
  'trending-up': TrendingUp,
  lock: Lock,
  unlock: Unlock,
  'chevron-left': ChevronLeft,
  'chevron-right': ChevronRight,
  'chevron-up': ChevronUp,
  'chevron-down': ChevronDown,
  mic: Mic,
  search: Search,
  settings: Settings,
  grip: GripVertical,
  user: User,
  mail: Mail,
  credit: CreditCard,
  history: History,
  palette: Palette,
  logout: LogOut,
  database: Database,
  sun: Sun,
  moon: Moon,
  type: Type,
  maximize: Maximize,
  minimize: Minimize,
  layout: Layout,
  'layout-dashboard': LayoutDashboard,
  'columns-2': Columns2,
  'columns-3': Columns3,
  'layout-grid': LayoutGrid,
  'square': Square,
  'calendar-check': CalendarCheck,
  'building-2': Building2,
  'briefcase': Briefcase,
  'check-square': CheckSquare,
  'pie-chart': PieChart,
  'calculator': Calculator,
  'clipboard-check': ClipboardCheck,
  'git-pull-request': GitPullRequest,
  'shield-alert': ShieldAlert,
  'activity': Activity,
  'minus': Minus,
}

/**
 * Shared Icon component that maps legacy names to Lucide React components.
 */
export default function Icon({ 
  name, 
  className = 'w-4 h-4',
  strokeWidth = 1.75 
}: IconProps) {
  const LucideIcon = iconMap[name] || HelpCircle

  return (
    <LucideIcon 
      className={className} 
      strokeWidth={strokeWidth}
    />
  )
}
