import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BellRing } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { api } from "@/lib/api";
import { frDate } from "@/lib/icons";

export interface Reminder { child_id: string; name: string; last_note_at: string | null }

export function useReminders() {
  const { user } = useApp();
  const [items, setItems] = useState<Reminder[]>([]);
  useEffect(() => { if (user.role === "admin" || user.role === "educator") api<Reminder[]>("/reminders").then(setItems).catch(() => {}); }, [user.role]);
  return items;
}

export const reminderText = (r: Reminder) => r.last_note_at ? `dernière note le ${frDate(r.last_note_at)}` : "aucune note pour l'instant";

export function ReminderBanner() {
  const items = useReminders();
  const { selectChild } = useApp();
  const [hidden, setHidden] = useState(() => sessionStorage.getItem("enfanceplus.reminders") === "1");
  if (!items.length || hidden) return null;
  return (
    <div className="panel fixed bottom-4 right-4 z-40 flex max-w-md flex-wrap items-center gap-3 border-amber-300/40 px-4 py-3 text-sm panel-enter" data-testid="reminder-banner">
      <BellRing size={16} className="text-amber-300" />
      <span className="mr-auto">Petit rappel : pas de note depuis 2 semaines pour{" "}
        {items.map((r, i) => <span key={r.child_id}>{i > 0 && ", "}<Link to="/profil" onClick={() => selectChild(r.child_id)} className="text-gold underline" title={reminderText(r)} data-testid={`reminder-child-${r.child_id}`}>{r.name}</Link></span>)}.
      </span>
      <button className="text-xs text-muted-foreground hover:text-foreground" onClick={() => { sessionStorage.setItem("enfanceplus.reminders", "1"); setHidden(true); }} data-testid="reminder-dismiss">Plus tard</button>
    </div>
  );
}
