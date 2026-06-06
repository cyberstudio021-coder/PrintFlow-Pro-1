import { useLocation, Link } from "wouter";
import { LayoutDashboard, BarChart3, Printer, FileText, RefreshCw, Settings } from "lucide-react";

const nav = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Printers", href: "/printers", icon: Printer },
  { name: "Reports", href: "/reports", icon: FileText },
  { name: "Google Sync", href: "/sync", icon: RefreshCw },
  { name: "Settings", href: "/settings", icon: Settings },
];

export default function Sidebar() {
  const [location] = useLocation();

  return (
    <aside
      className="w-56 shrink-0 flex flex-col py-4 border-r overflow-y-auto"
      style={{ background: "#050505", borderColor: "rgba(255,255,255,0.06)" }}
    >
      <nav className="flex-1 px-3 space-y-0.5">
        {nav.map((item) => {
          const active = location === item.href;
          return (
            <Link key={item.name} href={item.href}>
              <a
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                }`}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                {item.name}
              </a>
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-3 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="text-xs text-muted-foreground">
          <div className="font-medium text-foreground/60">PrintFlow Pro</div>
          <div>v1.0.0 — Local Mode</div>
        </div>
      </div>
    </aside>
  );
}
