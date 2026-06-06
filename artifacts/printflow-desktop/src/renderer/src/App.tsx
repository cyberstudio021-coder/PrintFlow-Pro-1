import { Switch, Route } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import TitleBar from "@/components/title-bar";
import Sidebar from "@/components/sidebar";
import Dashboard from "@/pages/dashboard";
import Analytics from "@/pages/analytics";
import Printers from "@/pages/printers";
import Reports from "@/pages/reports";
import Sync from "@/pages/sync";
import Settings from "@/pages/settings";

const qc = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false, staleTime: 30_000, retry: 1 },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <div className="flex flex-col h-screen w-screen overflow-hidden bg-background">
        <TitleBar />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-y-auto">
            <Switch>
              <Route path="/" component={Dashboard} />
              <Route path="/analytics" component={Analytics} />
              <Route path="/printers" component={Printers} />
              <Route path="/reports" component={Reports} />
              <Route path="/sync" component={Sync} />
              <Route path="/settings" component={Settings} />
            </Switch>
          </main>
        </div>
      </div>
      <Toaster />
    </QueryClientProvider>
  );
}
