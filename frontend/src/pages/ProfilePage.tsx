import { useEffect, useState } from "react";
import { Plus, Trash2, Save, Palette } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { send, type Child } from "@/lib/api";
import { AvatarIllustration } from "@/components/layout/AvatarIllustration";
import { AvatarCustomizer } from "@/components/layout/AvatarCustomizer";
import { xpLevel } from "@/lib/rpg";

export default function ProfilePage() {
  const { child, profiles, selectChild, saveChild, reloadProfiles } = useApp();
  const [form, setForm] = useState({ name: "", age: 8, grade: "", notes: "" });
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [newKid, setNewKid] = useState({ name: "", age: 6, grade: "" });
  const [saved, setSaved] = useState(false);
  useEffect(() => { if (child) setForm({ name: child.name, age: child.age, grade: child.grade, notes: child.notes }); }, [child?.child_id]);
  if (!child) return null;

  const save = async () => { saveChild(await send<Child>(`/children/${child.child_id}`, "PUT", form)); setSaved(true); setTimeout(() => setSaved(false), 1800); };
  const create = async (e: React.FormEvent) => {
    e.preventDefault(); if (!newKid.name.trim()) return;
    const c = await send<Child>("/children", "POST", { ...newKid, notes: "" });
    await reloadProfiles(); selectChild(c.child_id); setNewKid({ name: "", age: 6, grade: "" });
  };
  const remove = async (id: string) => {
    if (!window.confirm("Supprimer ce profil et toutes ses observations ?")) return;
    await send(`/children/${id}`, "DELETE"); await reloadProfiles();
    const rest = profiles.filter((p) => p.child_id !== id); if (rest[0]) selectChild(rest[0].child_id);
  };
  return (
    <div className="page grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]" data-testid="profile-page">
      <section className="panel space-y-5 p-6">
        <div className="flex flex-wrap items-center gap-5">
          <div className="profile-portrait h-40 w-36"><AvatarIllustration options={child.avatar} className="h-full w-full" /></div>
          <div className="space-y-2">
            <p className="eyebrow">Profil de l'enfant</p>
            <h1 className="font-display text-3xl font-semibold">{child.name}</h1>
            <p className="text-sm text-muted-foreground">Niveau {xpLevel(child.xp).level} · {child.xp} XP</p>
            <button className="btn-outline" onClick={() => setAvatarOpen(true)} data-testid="profile-avatar-button"><Palette size={15} /> Personnaliser l'avatar</button>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="text-xs text-muted-foreground">Prénom<input className="field mt-1" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} data-testid="profile-name-input" /></label>
          <label className="text-xs text-muted-foreground">Âge<input type="number" min={0} max={21} className="field mt-1" value={form.age} onChange={(e) => setForm({ ...form, age: Number(e.target.value) })} data-testid="profile-age-input" /></label>
          <label className="text-xs text-muted-foreground">Classe / niveau<input className="field mt-1" value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value })} data-testid="profile-grade-input" /></label>
        </div>
        <label className="block text-xs text-muted-foreground">Notes de contexte<textarea rows={4} className="field mt-1" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} data-testid="profile-notes-input" /></label>
        <button className="btn-primary" onClick={save} data-testid="profile-save-button"><Save size={15} /> {saved ? "Enregistré ✓" : "Enregistrer"}</button>
      </section>
      <section className="panel space-y-4 p-6">
        <h2 className="font-display text-xl font-semibold">Profils suivis</h2>
        <ul className="space-y-2">
          {profiles.map((p) => (
            <li key={p.child_id} className={`profile-row ${p.child_id === child.child_id ? "profile-row-on" : ""}`} data-testid={`profile-row-${p.child_id}`}>
              <button className="flex flex-1 items-center gap-3 text-left" onClick={() => selectChild(p.child_id)}>
                <span className="h-10 w-9 overflow-hidden rounded-md bg-muted"><AvatarIllustration options={p.avatar} className="h-full w-full" /></span>
                <span><span className="block text-sm font-semibold">{p.name}</span><span className="text-xs text-muted-foreground">{p.age} ans {p.grade && `· ${p.grade}`}</span></span>
              </button>
              {profiles.length > 1 && <button className="icon-btn h-8 w-8" onClick={() => remove(p.child_id)} aria-label="Supprimer" data-testid={`profile-delete-${p.child_id}`}><Trash2 size={14} /></button>}
            </li>
          ))}
        </ul>
        <form onSubmit={create} className="space-y-2 border-t border-border pt-4" data-testid="new-profile-form">
          <p className="text-sm font-semibold">Nouveau profil</p>
          <input className="field" placeholder="Prénom" value={newKid.name} onChange={(e) => setNewKid({ ...newKid, name: e.target.value })} data-testid="new-profile-name-input" />
          <div className="grid grid-cols-2 gap-2">
            <input type="number" min={0} max={21} className="field" value={newKid.age} onChange={(e) => setNewKid({ ...newKid, age: Number(e.target.value) })} data-testid="new-profile-age-input" />
            <input className="field" placeholder="Classe" value={newKid.grade} onChange={(e) => setNewKid({ ...newKid, grade: e.target.value })} data-testid="new-profile-grade-input" />
          </div>
          <button className="btn-outline w-full" type="submit" data-testid="new-profile-submit"><Plus size={15} /> Ajouter le profil</button>
        </form>
      </section>
      {avatarOpen && <AvatarCustomizer options={child.avatar} onChange={async (a) => saveChild(await send<Child>(`/children/${child.child_id}`, "PUT", { avatar: a }))} onClose={() => setAvatarOpen(false)} />}
    </div>
  );
}
