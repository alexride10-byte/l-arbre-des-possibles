import { useEffect, useState } from "react";
import { NotebookPen, Pencil, Trash2, Save, X } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { api, send } from "@/lib/api";
import { frDate } from "@/lib/icons";

interface Note { note_id: string; text: string; author_id: string; author_name: string; created_at: string; updated_at?: string | null }

const when = (iso: string) => `${frDate(iso)} ${new Date(iso).toLocaleTimeString("fr-FR").slice(0, 5)}`;

export function ChildNotes() {
  const { child, user, canWrite } = useApp();
  const [notes, setNotes] = useState<Note[]>([]);
  const [text, setText] = useState("");
  const [edit, setEdit] = useState<{ id: string; text: string } | null>(null);
  const base = child ? `/children/${child.child_id}/notes` : "";
  const load = () => base && api<Note[]>(base).then(setNotes);
  useEffect(() => { setEdit(null); load(); }, [base]);
  if (!child) return null;

  const add = async () => { if (!text.trim()) return; await send(base, "POST", { text }); setText(""); load(); };
  const save = async () => { if (!edit?.text.trim()) return; await send(`${base}/${edit.id}`, "PUT", { text: edit.text }); setEdit(null); load(); };
  const remove = async (id: string) => { if (window.confirm("Supprimer cette note ?")) { await send(`${base}/${id}`, "DELETE"); load(); } };
  const mine = (n: Note) => canWrite && (n.author_id === user.user_id || user.role === "admin");

  return (
    <section className="panel space-y-4 p-6" data-testid="child-notes">
      <div className="flex items-center gap-3">
        <span className="medal-lg"><NotebookPen size={20} /></span>
        <div><h2 className="font-display text-xl font-semibold">Notes de suivi · {child.name}</h2>
          <p className="text-xs text-muted-foreground">Visibles par l'équipe qui suit l'enfant et par l'administration. Chaque ajout est tracé dans le journal.</p></div>
      </div>
      {canWrite && (
        <div className="space-y-2">
          <textarea rows={3} className="field" placeholder="Écrire une note (fait observé, échange, rendez-vous…)" value={text} onChange={(e) => setText(e.target.value)} data-testid="note-input" />
          <button className="btn-primary" onClick={add} disabled={!text.trim()} data-testid="note-add-button"><Save size={15} /> Ajouter la note</button>
        </div>
      )}
      {notes.length === 0 && <p className="text-sm text-muted-foreground" data-testid="notes-empty">Aucune note pour l'instant.</p>}
      <ul className="space-y-2">
        {notes.map((n) => (
          <li key={n.note_id} className="rounded-xl border border-border bg-black/10 p-3" data-testid={`note-${n.note_id}`}>
            <div className="mb-1 flex items-center gap-2 text-[11px] text-muted-foreground">
              <span className="text-gold">{n.author_name}</span> · {when(n.created_at)}{n.updated_at && <span>· modifiée le {when(n.updated_at)}</span>}
              {mine(n) && edit?.id !== n.note_id && <span className="ml-auto flex gap-1">
                <button className="icon-btn h-7 w-7" onClick={() => setEdit({ id: n.note_id, text: n.text })} aria-label="Modifier" data-testid={`note-edit-${n.note_id}`}><Pencil size={13} /></button>
                <button className="icon-btn h-7 w-7" onClick={() => remove(n.note_id)} aria-label="Supprimer" data-testid={`note-delete-${n.note_id}`}><Trash2 size={13} /></button>
              </span>}
            </div>
            {edit?.id === n.note_id ? (
              <div className="space-y-2">
                <textarea rows={3} className="field" value={edit.text} onChange={(e) => setEdit({ ...edit, text: e.target.value })} data-testid="note-edit-input" />
                <div className="flex gap-2">
                  <button className="btn-primary h-9" onClick={save} data-testid="note-save-button"><Save size={14} /> Enregistrer</button>
                  <button className="btn-outline h-9" onClick={() => setEdit(null)} data-testid="note-cancel-button"><X size={14} /> Annuler</button>
                </div>
              </div>
            ) : <p className="whitespace-pre-wrap text-sm">{n.text}</p>}
          </li>
        ))}
      </ul>
    </section>
  );
}
