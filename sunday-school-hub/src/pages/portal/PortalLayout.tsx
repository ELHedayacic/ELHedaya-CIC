import { NavLink, Outlet, Link } from "react-router-dom";
import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  BookOpen,
  LineChart,
  MessageSquareText,
  CreditCard,
  Settings,
  LogOut,
  ShieldCheck,
  Menu,
  X,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/portal", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/portal/students", label: "My children", icon: Users },
  { to: "/portal/schedule", label: "Schedule", icon: CalendarDays },
  { to: "/portal/homework", label: "Homework", icon: BookOpen },
  { to: "/portal/progress", label: "Progress", icon: LineChart },
  { to: "/portal/messages", label: "Messages", icon: MessageSquareText },
  { to: "/portal/payments", label: "Payments", icon: CreditCard },
  { to: "/portal/settings", label: "Settings", icon: Settings },
];

export default function PortalLayout() {
  const { profile, signOut, isStaff } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      {/* Mobile top bar */}
      <div className="fixed inset-x-0 top-0 z-40 flex items-center justify-between border-b border-black/5 bg-twilight-900/70 px-4 py-3 backdrop-blur-2xl lg:hidden">
        <Link to="/portal" className="mr-3 flex min-w-0 flex-1 items-center gap-2">
          <img src="/logo.png" alt="El Hedaya Islamic School" className="h-7 w-7 shrink-0 rounded-lg object-contain" />
          <span className="truncate font-display text-sm font-semibold text-twilight-50">El Hedaya Islamic School</span>
        </Link>
        <button onClick={() => setMobileOpen((v) => !v)} className="rounded-lg p-2 text-twilight-200 hover:bg-black/5">
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 w-72 shrink-0 border-r border-black/5 bg-twilight-900/65 p-5 backdrop-blur-2xl transition-transform lg:static lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          "pt-20 lg:pt-5"
        )}
      >
        <Link to="/portal" className="mb-8 hidden items-center gap-2 px-2 lg:flex">
          <img src="/logo.png" alt="El Hedaya Islamic School" className="h-9 w-9 shrink-0 rounded-lg object-contain" />
          <span className="font-display text-base font-semibold leading-tight text-twilight-50">El Hedaya Islamic School</span>
        </Link>

        <nav className="space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) => cn("nav-link", isActive && "nav-link-active")}
            >
              <item.icon className="h-4.5 w-4.5" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="absolute bottom-5 left-5 right-5 border-t border-black/5 pt-4">
          <div className="mb-3 flex items-center gap-3 px-1">
            <Avatar name={profile?.full_name ?? "Family"} size="sm" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-twilight-50">{profile?.full_name}</p>
              <p className="truncate text-xs text-twilight-200">Family portal</p>
            </div>
          </div>
          {isStaff && (
            <Link to="/admin" className="nav-link mb-1 w-full text-amber-700 hover:bg-amber-500/10">
              <ShieldCheck className="h-4.5 w-4.5" />
              Switch to staff console
            </Link>
          )}
          <button onClick={() => signOut()} className="nav-link w-full text-coral-700 hover:bg-coral-500/10">
            <LogOut className="h-4.5 w-4.5" />
            Sign out
          </button>
        </div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-20 bg-black/60 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <main className="flex-1 px-5 pb-16 pt-20 lg:px-10 lg:pt-10">
        <div className="mx-auto max-w-6xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
