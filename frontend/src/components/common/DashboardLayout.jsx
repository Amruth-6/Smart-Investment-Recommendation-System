import React, { useState } from "react";
import { NavLink, useNavigate, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  User,
  Wallet,
  ShieldCheck,
  HeartPulse,
  Target,
  Sparkles,
  PieChart,
  Compass,
  LineChart,
  SlidersHorizontal,
  MessageSquare,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  BarChart3,
  Users,
} from "lucide-react";
import { Logo } from "./Logo";
import { useAuth } from "../../context/AuthContext";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/financial-profile", label: "Financial Profile", icon: Wallet },
  { to: "/risk-assessment", label: "Risk Assessment", icon: ShieldCheck },
  { to: "/financial-health", label: "Financial Health", icon: HeartPulse },
  { to: "/goals", label: "Goals", icon: Target },
  { to: "/recommendations", label: "Recommendations", icon: Sparkles },
  { to: "/portfolio", label: "Portfolio", icon: PieChart },
  { to: "/portfolio-analysis", label: "Portfolio Analysis", icon: BarChart3 },
  { to: "/investments", label: "Investment Explorer", icon: Compass },
  { to: "/simulator", label: "Wealth Simulator", icon: LineChart },
  { to: "/what-if", label: "What-If Analysis", icon: SlidersHorizontal },
  { to: "/assistant", label: "AI Assistant", icon: MessageSquare },
  { to: "/notifications", label: "Notifications", icon: Bell },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const SidebarInner = (
    <div className="flex h-full flex-col">
      <div className="px-5 py-5">
        <Logo />
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 pb-4">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={() => setOpen(false)}
            data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
            className={({ isActive }) =>
              `group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-200 ${
                isActive
                  ? "bg-blue-500/15 text-blue-300 border border-blue-500/25"
                  : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-100 border border-transparent"
              }`
            }
          >
            <item.icon className="h-[18px] w-[18px]" strokeWidth={2} />
            {item.label}
          </NavLink>
        ))}
        {user?.role === "admin" && (
          <NavLink
            to="/admin"
            onClick={() => setOpen(false)}
            data-testid="nav-admin"
            className={({ isActive }) =>
              `group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-200 ${
                isActive
                  ? "bg-amber-500/15 text-amber-300 border border-amber-500/25"
                  : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-100 border border-transparent"
              }`
            }
          >
            <Users className="h-[18px] w-[18px]" strokeWidth={2} />
            Admin Dashboard
          </NavLink>
        )}
      </nav>
      <div className="border-t border-white/[0.06] p-3">
        <div className="mb-2 flex items-center gap-3 rounded-lg px-3 py-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-500/20 font-manrope text-sm font-bold text-blue-300">
            {(user?.name || "U").charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-slate-100">{user?.name}</div>
            <div className="truncate text-xs text-slate-500">{user?.email}</div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          data-testid="logout-button"
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 transition-colors duration-200 hover:bg-red-500/10 hover:text-red-300"
        >
          <LogOut className="h-[18px] w-[18px]" strokeWidth={2} />
          Log out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#0A0C10]">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-white/[0.06] bg-[#0B0E13] lg:block">
        {SidebarInner}
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 border-r border-white/[0.06] bg-[#0B0E13]">
            {SidebarInner}
          </aside>
        </div>
      )}

      <div className="flex flex-1 flex-col lg:pl-64">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-white/[0.06] bg-[#0A0C10]/70 px-4 py-3 backdrop-blur-xl lg:px-8">
          <button
            className="rounded-lg p-2 text-slate-300 hover:bg-white/5 lg:hidden"
            onClick={() => setOpen(true)}
            data-testid="mobile-menu-button"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="hidden text-sm text-slate-500 lg:block">
            Educational analytical platform — returns are not guaranteed
          </div>
          <button
            onClick={() => navigate("/notifications")}
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-white/5 hover:text-slate-100"
            data-testid="topbar-notifications"
          >
            <Bell className="h-5 w-5" />
          </button>
        </header>
        <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
