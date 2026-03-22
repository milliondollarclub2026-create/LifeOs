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
import { Button } from "@/components/ui/button";

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
          "fixed left-0 top-0 z-50 flex h-screen flex-col border-r border-border bg-white transition-all duration-300",
          collapsed ? "w-16" : "w-64"
        )}
        data-testid="sidebar"
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          {!collapsed && (
            <h1 className="font-heading text-xl font-bold text-foreground tracking-tight">
              WealthDock
            </h1>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="rounded-lg p-2 hover:bg-secondary transition-colors"
            data-testid="sidebar-toggle"
          >
            {collapsed ? (
              <CaretRight size={20} weight="bold" />
            ) : (
              <CaretLeft size={20} weight="bold" />
            )}
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
                className={cn(
                  "sidebar-link",
                  isActive && "active"
                )}
                data-testid={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
              >
                <Icon size={22} weight={isActive ? "fill" : "regular"} />
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* Export button */}
        <div className="border-t border-border p-3">
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start gap-2 btn-press",
              collapsed && "justify-center px-2"
            )}
            onClick={handleExport}
            data-testid="export-btn"
          >
            <Export size={20} />
            {!collapsed && <span>Export All</span>}
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main
        className={cn(
          "flex-1 transition-all duration-300",
          collapsed ? "ml-16" : "ml-64"
        )}
      >
        <div className="p-6 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
