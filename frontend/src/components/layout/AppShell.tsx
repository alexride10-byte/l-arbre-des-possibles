import { useState, type ReactNode } from "react";
import { TopBar } from "./TopBar";
import { LeftSidebar } from "./LeftSidebar";
import { AssistantDrawer } from "@/components/assistant/AssistantDrawer";
import { useApp } from "@/context/AppContext";

export function AppShell({ children }: { children: ReactNode }) {
  const { child } = useApp();
  const [menu, setMenu] = useState(false);
  return (
    <main className="night-sky flex h-dvh w-full flex-col overflow-hidden" data-testid="app-shell">
      <TopBar onMenu={() => setMenu(true)} />
      <div className="shell-grid min-h-0 flex-1">
        <div className="hidden min-h-0 lg:block"><LeftSidebar /></div>
        <div className="min-h-0 min-w-0">{child ? children : <p className="p-8 text-muted-foreground" data-testid="loading-profiles">Chargement des profils…</p>}</div>
      </div>
      {menu && (
        <div className="fixed inset-0 z-50 bg-background/80 p-3 backdrop-blur-sm lg:hidden" onClick={() => setMenu(false)} data-testid="mobile-menu-overlay">
          <div className="h-full w-[88%] max-w-xs" onClick={(e) => e.stopPropagation()}><LeftSidebar onNavigate={() => setMenu(false)} /></div>
        </div>
      )}
      <AssistantDrawer />
    </main>
  );
}
