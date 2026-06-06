import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { Link, useLocation } from "wouter";
import { LayoutDashboard, BarChart3, Printer, FileText, RefreshCw, Settings } from "lucide-react";

export function AppSidebar() {
  const [location] = useLocation();

  const navigation = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Analytics", href: "/analytics", icon: BarChart3 },
    { name: "Printers", href: "/printers", icon: Printer },
    { name: "Reports", href: "/reports", icon: FileText },
    { name: "Google Sync", href: "/sync", icon: RefreshCw },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <Sidebar className="border-r border-border bg-background text-foreground">
      <SidebarContent>
        <SidebarGroup>
          <div className="px-6 py-8 flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Printer className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground">PrintFlow<span className="text-primary">.</span></span>
          </div>
          <SidebarGroupContent>
            <SidebarMenu className="px-3 gap-1">
              {navigation.map((item) => (
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.href}
                    className="element-radius py-5"
                  >
                    <Link href={item.href} className="flex items-center gap-3">
                      <item.icon className="w-5 h-5" />
                      <span className="font-medium">{item.name}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
