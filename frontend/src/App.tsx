import { useEffect, useRef, useState } from "react";
import { Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { api, send, setToken, type User } from "@/lib/api";
import { AppProvider } from "@/context/AppContext";
import { AppShell } from "@/components/layout/AppShell";
import Login from "@/pages/Login";
import Overview from "@/pages/Overview";
import ProfilePage from "@/pages/ProfilePage";
import SkillsPage from "@/pages/SkillsPage";
import TimelinePage from "@/pages/TimelinePage";
import InterventionsPage from "@/pages/InterventionsPage";
import ResourcesPage from "@/pages/ResourcesPage";
import DocumentsPage from "@/pages/DocumentsPage";
import ProgressCardPage from "@/pages/ProgressCardPage";

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
  useEffect(() => {
    if (user) return;
    api<User>("/auth/me").then(setUser).catch(() => setUser(false));
  }, [user]);
  if (user === null) return <Splash />;
  if (user === false) return <Login />;
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
          <Route path="*" element={<Overview />} />
        </Routes>
      </AppShell>
    </AppProvider>
  );
}

export default function App() {
  const location = useLocation();
  if (location.hash?.includes("session_id=")) return <AuthCallback />;
  return <Gate />;
}
