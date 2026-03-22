import { useState } from "react";
import { Outlet, NavLink, useLocation } from "react-router-dom";
import { 
  SquaresFour, 
  Receipt, 
  ChartLineUp,
  CaretLeft,
  CaretRight,
  Export,
  Calendar,
  Target
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const navItems = [
  { path: "/", icon: SquaresFour, label: "Dashboard" },
  { path: "/calendar", icon: Calendar, label: "Calendar" },
  { path: "/transactions", icon: Receipt, label: "Transactions" },
  { path: "/investments", icon: ChartLineUp, label: "Investments" },
  { path: "/life-os", icon: Target, label: "Life OS" },
];

export const Layout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const handleExport = () => {
    window.open(`${BACKEND_URL}/api/export/master`, '_blank');
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-screen flex-col bg-white border-r border-border transition-all duration-300",
          collapsed ? "w-16" : "w-60"
        )}
        data-testid="sidebar"
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          {!collapsed && (
            <h1 className="font-heading text-lg font-bold text-foreground">
              WealthDock
            </h1>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 rounded-md hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
            data-testid="sidebar-toggle"
          >
            {collapsed ? <CaretRight size={18} weight="bold" /> : <CaretLeft size={18} weight="bold" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={cn("sidebar-link", isActive && "active")}
                data-testid={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
              >
                <Icon size={20} weight={isActive ? "fill" : "regular"} />
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* Export button */}
        <div className="border-t border-border p-3">
          <button
            onClick={handleExport}
            className={cn(
              "sidebar-link w-full",
              collapsed && "justify-center"
            )}
            data-testid="export-btn"
          >
            <Export size={20} />
            {!collapsed && <span>Export All</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className={cn("flex-1 transition-all duration-300", collapsed ? "ml-16" : "ml-60")}>
        <div className="p-6 lg:p-8 max-w-[1600px]">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
