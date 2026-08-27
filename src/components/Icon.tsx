import { cn } from "@/lib/utils";
import {
  Wrench,
  Car,
  Receipt,
  Sliders,
  Bot,
  Home,
  Zap,
  User,
  Search,
  Settings,
  Bell,
  BellRing,
  Code2,
  Key,
  UserCircle,
  HelpCircle,
  LogOut,
  Check,
  Activity,
  Download,
  Edit3,
  AlertTriangle,
  Eye,
  EyeOff,
  Copy,
  RefreshCw,
  Gauge,
  Plus,
  Paperclip,
  Cpu,
  Shield,
  Calendar,
  Network,
  CheckCircle,
  Lock,
  Mail,
  Trash2,
  X,
  ArrowRight,
  ChevronRight,
  BatteryCharging,
  BarChart2,
  Palette,
  CreditCard,
  Radio,
  Loader2,
  PlayCircle,
  Circle,
  FileText,
  type LucideIcon,
} from "lucide-react";

const LUCIDE_MAP: Record<string, LucideIcon> = {
  // Navigation & Core
  precision_manufacturing: Wrench,
  directions_car: Car,
  receipt_long: Receipt,
  tune: Sliders,
  smart_toy: Bot,
  home: Home,
  bolt: Zap,
  person: User,
  search: Search,
  settings: Settings,
  notifications: Bell,
  notifications_active: BellRing,
  account_circle: UserCircle,
  help_outline: HelpCircle,
  logout: LogOut,
  api: Code2,
  key: Key,
  credit_card: CreditCard,
  sensors: Radio,
  description: FileText,

  // Actions & States
  check: Check,
  monitoring: Activity,
  download: Download,
  edit: Edit3,
  warning: AlertTriangle,
  visibility: Eye,
  visibility_off: EyeOff,
  content_copy: Copy,
  refresh: RefreshCw,
  speed: Gauge,
  add: Plus,
  attach_file: Paperclip,
  troubleshoot: Activity,
  settings_ethernet: Cpu,
  shield: Shield,
  calendar_today: Calendar,
  build: Wrench,
  hub: Network,
  verified: CheckCircle,
  lock: Lock,
  mail: Mail,
  delete: Trash2,
  trash: Trash2,
  close: X,
  arrow_forward: ArrowRight,
  chevron_right: ChevronRight,
  battery_charging: BatteryCharging,
  analytics: BarChart2,
  palette: Palette,
  sync: Loader2,
  play_circle: PlayCircle,
};

export function Icon({
  name,
  className,
  filled = false,
}: {
  name: string;
  className?: string;
  filled?: boolean;
}) {
  const Component = LUCIDE_MAP[name];

  if (Component) {
    return (
      <Component
        aria-hidden="true"
        className={cn(
          "inline-block shrink-0 transition-transform",
          filled ? "fill-current" : "",
          className,
        )}
      />
    );
  }

  // No Material Symbols webfont is loaded, so an unmapped name used to render
  // as its literal text (the "sync" spinner showed the word "sync"). Fall back
  // to a neutral glyph instead and surface the gap in development.
  if (import.meta.env.DEV) {
    console.warn(`Icon: "${name}" is not in LUCIDE_MAP; rendering placeholder.`);
  }

  return (
    <Circle
      aria-hidden="true"
      className={cn("inline-block shrink-0", filled ? "fill-current" : "", className)}
    />
  );
}
