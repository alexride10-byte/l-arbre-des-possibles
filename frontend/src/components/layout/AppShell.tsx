import { useState, type ReactNode } from "react";
import { TopBar } from "./TopBar";
import { LeftSidebar } from "./LeftSidebar";
import { AssistantDrawer } from "@/components/assistant/AssistantDrawer";
import { useApp } from "@/context/AppContext";
import { useLocation } from "react-router-dom";

export function AppShell({ children }: { children: ReactNode }) {
  const { child, user } = useApp();
  const { pathname } = useLocation();
  const free = user.role === "internal" || ["/admin", "/compte", "/enfants", "/interne"].includes(pathname);
  const [menu, setMenu] = useState(false);
  return (
    <main className="night-sky flex h-dvh w-full flex-col overflow-hidden" data-testid="app-shell">
      <TopBar onMenu={() => setMenu(true)} />
      <div className="shell-grid min-h-0 flex-1">
        <div className="hidden min-h-0 lg:block">{child ? <LeftSidebar /> : <div className="panel h-full" />}</div>
        <div className="min-h-0 min-w-0">{child || free ? children : <p className="p-8 text-muted-foreground" data-testid="loading-profiles">Aucun dossier disponible pour l'instant. Votre administrateur doit vous attribuer des enfants.</p>}</div>
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
