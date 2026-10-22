import { useEffect, useRef, useState } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { api, send, setToken, type User } from "@/lib/api";
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

function AuthCallback() {
  const location = useLocation();
  const navigate = useNavigate();
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    done.current = true;
    const sessionId = new URLSearchParams(location.hash.slice(1)).get("session_id");
    send<User & { session_token: string }>("/auth/session", "POST", { session_id: sessionId })
      .then(({ session_token, ...user }) => { setToken(session_token); navigate("/", { replace: true, state: { user } }); })
      .catch(() => navigate("/", { replace: true }));
  }, [location.hash, navigate]);
  return <Splash />;
}

const Splash = () => (
  <div className="night-sky grid h-dvh place-items-center" data-testid="app-loading">
    <p className="font-display text-3xl">Enfance<span className="text-gold">+</span></p>
  </div>
);

function Gate() {
  const location = useLocation();
  const [user, setUser] = useState<User | null | false>((location.state as { user?: User } | null)?.user ?? null);
  const [setup, setSetup] = useState<boolean | null>(null);
  const [contentReady, setContentReady] = useState(false);
  useEffect(() => { api<{ needs_setup: boolean }>("/setup/status").then((r) => setSetup(r.needs_setup)).catch(() => setSetup(false)); }, []);
  useEffect(() => {
    if (user) return;
    api<User>("/auth/me").then(setUser).catch(() => setUser(false));
  }, [user]);
  useEffect(() => {
    if (user && user.status === "active") api<ContentDoc[]>("/content").then(applyAll).catch(() => {}).finally(() => setContentReady(true));
  }, [user]);
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
  if (location.hash?.includes("session_id=")) return <AuthCallback />;
  if (location.pathname === "/verifier") return <Login initial="verify" />;
  if (location.pathname === "/reinitialiser") return <Login initial="reset" />;
  if (location.pathname === "/decouvrir") return <LauncherPage />;
  return <Gate />;
}
