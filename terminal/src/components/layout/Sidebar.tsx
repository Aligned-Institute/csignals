import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Trophy, Briefcase, BarChart3, MessageCircle, Network,
  LogOut, Sun, Moon, Menu, X, Search, Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/hooks/use-theme";


const navItems = [
  { href: "/dashboard",         label: "Market Overview",   icon: LayoutDashboard },
  { href: "/leaderboard",       label: "Signal Board",      icon: Trophy          },
  { href: "/charts",            label: "Price Charts",      icon: BarChart3       },
  { href: "/ecosystem",         label: "Value Chain",       icon: Network         },
  { href: "/portfolio",         label: "Brief Archive",     icon: Briefcase       },
  { href: "/upload",            label: "Data Analyzer",     icon: Upload          },
];

interface SidebarProps {
  onOpenSearch?: () => void;
}

export function Sidebar({ onOpenSearch }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { light, toggle } = useTheme();
  
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  return (
    <>
      {/* Top Header Navigation Bar */}
      <header className="fixed top-0 inset-x-0 h-16 z-50 border-b border-sidebar-border bg-sidebar/95 backdrop-blur supports-[backdrop-filter]:bg-sidebar/80 flex items-center justify-between px-4 md:px-8 select-none">
        
        {/* Left: Branding Logo */}
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-xl font-bold bg-gradient-to-r from-slate-900 dark:from-white to-[#00ff9d] bg-clip-text text-transparent">
            ChemSignals
          </Link>
        </div>

        {/* Center: Horizontal Navigation Links (Desktop) */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-primary shadow-sm"
                    : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )}
              >
                <Icon className="size-4" />
                <span>{label}</span>
              </Link>
            );
          })}
          
          {/* Weekly Brief (Sage Link) */}
          <Link
            href="/sage"
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
              pathname.startsWith("/sage")
                ? "bg-sidebar-accent text-sidebar-primary shadow-sm"
                : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
            )}
          >
            <MessageCircle className="size-4" />
            <span>Weekly Brief</span>
          </Link>
        </nav>

        {/* Right: Actions (Search, Light/Dark, Logout, Hamburger) */}
        <div className="flex items-center gap-2">
          {/* Search Trigger */}
          <button
            onClick={onOpenSearch}
            className="flex items-center gap-1.5 rounded-lg border border-sidebar-border bg-sidebar-accent/30 px-2.5 py-1 text-xs text-sidebar-foreground/60 hover:bg-sidebar-accent/50 transition-colors cursor-pointer"
          >
            <Search className="size-3.5" />
            <span className="hidden sm:inline">Search...</span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggle}
            className="p-1.5 rounded-lg border border-sidebar-border bg-sidebar-accent/10 hover:bg-sidebar-accent/40 text-sidebar-foreground/60 hover:text-sidebar-foreground cursor-pointer transition-colors"
            title={light ? "Night Mode" : "Day Mode"}
          >
            {light ? <Moon className="size-4" /> : <Sun className="size-4" />}
          </button>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="hidden sm:flex items-center gap-1.5 rounded-lg border border-sidebar-border bg-sidebar-accent/10 hover:bg-sidebar-accent/40 px-2.5 py-1 text-xs text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors cursor-pointer"
          >
            <LogOut className="size-3.5" />
            <span>Logout</span>
          </button>

          {/* Mobile Menu Button (Hamburger) */}
          <button
            className="lg:hidden p-1.5 rounded-lg border border-sidebar-border bg-sidebar-accent/10 hover:bg-sidebar-accent/40 text-sidebar-foreground cursor-pointer"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </header>

      {/* Mobile Navigation Dropdown Menu */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-x-0 top-16 bg-sidebar/95 backdrop-blur border-b border-sidebar-border z-40 p-4 space-y-1 animate-page-in shadow-xl max-h-[calc(100vh-4rem)] overflow-y-auto">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-primary"
                    : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )}
              >
                <Icon className="size-4.5" />
                <span>{label}</span>
              </Link>
            );
          })}
          
          <Link
            href="/sage"
            className={cn(
              "flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors",
              pathname.startsWith("/sage")
                ? "bg-sidebar-accent text-sidebar-primary"
                : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50"
            )}
          >
            <MessageCircle className="size-4.5" />
            <span>Weekly Brief</span>
          </Link>

          <div className="border-t border-sidebar-border mt-3 pt-3">
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors cursor-pointer"
            >
              <LogOut className="size-4.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
