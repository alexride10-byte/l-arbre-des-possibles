import { useEffect, useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { api, API, type User } from "@/lib/api";
import { AppProvider } from "@/context/AppContext";
import { AppShell } from "@/components/layout/AppShell";
import Login, { PendingScreen, SetupScreen } from "@/pages/Login";
import { applyAll, type ContentDoc } from "@/lib/content";
import ChildrenPage from "@/pages/ChildrenPage";
import AdminPage from "@/pages/AdminPage";
import InternalPage from "@/pages/InternalPage";
import AccountPage from "@/pages/AccountPage";
import DomainPage from "@/pages/DomainPage";
import FuturePage from "@/pages/FuturePage";
import MessagesPage from "@/pages/MessagesPage";
import Overview from "@/pages/Overview";
import ProfilePage from "@/pages/ProfilePage";
import SkillsPage from "@/pages/SkillsPage";
import TimelinePage from "@/pages/TimelinePage";
import InterventionsPage from "@/pages/InterventionsPage";
import ResourcesPage from "@/pages/ResourcesPage";
import DocumentsPage from "@/pages/DocumentsPage";
import ProgressCardPage from "@/pages/ProgressCardPage";
import CalendarPage from "@/pages/CalendarPage";
import ReportPage from "@/pages/ReportPage";
import LauncherPage from "@/launcher/LauncherPage";

// Sur l'offre gratuite de Render, le serveur s'endort après 15 min : le premier appel peut prendre jusqu'à une minute.
function Splash({ waking = false, failed = false, onRetry }: { waking?: boolean; failed?: boolean; onRetry?: () => void }) {
  const [slow, setSlow] = useState(false);
  useEffect(() => { const t = setTimeout(() => setSlow(true), 2500); return () => clearTimeout(t); }, []);
  return (
    <div className="night-sky grid h-dvh place-items-center px-6 text-center" data-testid="app-loading">
      <div className="space-y-3">
        <p className="font-display text-3xl">Enfance<span className="text-gold">+</span></p>
        {failed ? (
          <>
            <p className="text-sm text-red-300">Le serveur ne répond pas. Vérifiez votre connexion internet.</p>
            <button className="btn-outline" onClick={onRetry}>Réessayer</button>
          </>
        ) : (waking || slow) && (
          <p className="max-w-xs text-sm text-muted-foreground" data-testid="app-waking">Réveil du serveur en cours… Cela peut prendre jusqu'à une minute après une période d'inactivité.</p>
        )}
      </div>
    </div>
  );
}

/** Attend que le serveur se réveille (jusqu'à ~90 s), puis renvoie true s'il répond. */
async function waitForServer(onWaking: () => void): Promise<boolean> {
  const deadline = Date.now() + 90_000;
  for (let attempt = 0; Date.now() < deadline; attempt++) {
    try {
      const r = await fetch(`${API}/`, { cache: "no-store" });
      if (r.ok) return true;
    } catch { /* serveur encore endormi */ }
    if (attempt === 0) onWaking();
    await new Promise((res) => setTimeout(res, 3000));
  }
  return false;
}

function Gate() {
  const location = useLocation();
  const [user, setUser] = useState<User | null | false>((location.state as { user?: User } | null)?.user ?? null);
  const [setup, setSetup] = useState<boolean | null>(null);
  const [contentReady, setContentReady] = useState(false);
  const [server, setServer] = useState<"checking" | "waking" | "up" | "down">("checking");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    setServer("checking");
    waitForServer(() => setServer("waking")).then((ok) => setServer(ok ? "up" : "down"));
  }, [attempt]);
  useEffect(() => {
    if (server !== "up") return;
    api<{ needs_setup: boolean }>("/setup/status").then((r) => setSetup(r.needs_setup)).catch(() => setSetup(false));
  }, [server]);
  useEffect(() => {
    if (user || server !== "up") return;
    api<User>("/auth/me").then(setUser).catch(() => setUser(false));
  }, [user, server]);
  useEffect(() => {
    if (user && user.status === "active") api<ContentDoc[]>("/content").then(applyAll).catch(() => {}).finally(() => setContentReady(true));
  }, [user]);
  if (server !== "up") return <Splash waking={server === "waking"} failed={server === "down"} onRetry={() => setAttempt((a) => a + 1)} />;
  if (user === null || setup === null) return <Splash />;
  if (setup && !user) return <SetupScreen />;
  if (user === false) return <Login />;
  if (user.status !== "active") return <PendingScreen user={user} />;
  if (!contentReady) return <Splash />;
  if (user.role === "internal") return (
    <AppProvider initialUser={user}><AppShell><Routes>
      <Route path="/compte" element={<AccountPage />} /><Route path="/messages" element={<MessagesPage />} /><Route path="*" element={<InternalPage />} />
    </Routes></AppShell></AppProvider>
  );
  return (
    <AppProvider initialUser={user}>
      <AppShell>
        <Routes>
          <Route path="/" element={<Overview />} />
          <Route path="/arbre" element={<Overview fullTree />} />
          <Route path="/profil" element={<ProfilePage />} />
          <Route path="/competences" element={<SkillsPage />} />
          <Route path="/chronologie" element={<TimelinePage />} />
          <Route path="/interventions" element={<InterventionsPage />} />
          <Route path="/ressources" element={<ResourcesPage />} />
          <Route path="/documents" element={<DocumentsPage />} />
          <Route path="/carte" element={<ProgressCardPage />} />
          <Route path="/calendrier" element={<CalendarPage />} />
          <Route path="/rapport" element={<ReportPage />} />
          <Route path="/enfants" element={<ChildrenPage />} />
          <Route path="/admin" element={user.role === "admin" ? <AdminPage /> : <Navigate to="/" />} />
          <Route path="/compte" element={<AccountPage />} />
          <Route path="/domaine/:id" element={<DomainPage />} />
          <Route path="/futur" element={<FuturePage />} />
          <Route path="/messages" element={<MessagesPage />} />
          <Route path="*" element={<Overview />} />
        </Routes>
      </AppShell>
    </AppProvider>
  );
}

export default function App() {
  const location = useLocation();
  if (location.pathname === "/reinitialiser") return <Login initial="reset" />;
  if (location.pathname === "/decouvrir") return <LauncherPage />;
  return <Gate />;
}
