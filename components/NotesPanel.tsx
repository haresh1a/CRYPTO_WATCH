"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNotes } from "@/hooks/useUserData";
import { useToast } from "./Toast";
import { ErrorBoundary } from "./ErrorBoundary";
import { classNames, displaySymbol, formatRelative } from "@/lib/format";

export function NotesPanel({ symbol }: { symbol?: string }) {
  const { user } = useAuth();
  const { items, add, update, remove } = useNotes(user?.id ?? null, symbol);
  const { toast } = useToast();
  const [draft, setDraft] = useState<{ title: string; body: string; tags: string }>({ title: "", body: "", tags: "" });
  const [editing, setEditing] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { toast({ title: "Sign in to save notes", variant: "warning" }); return; }
    if (!symbol) { toast({ title: "Pick a symbol first", variant: "warning" }); return; }
    if (!draft.body.trim()) { toast({ title: "Note body is empty", variant: "danger" }); return; }
    const tags = draft.tags.split(",").map((s) => s.trim()).filter(Boolean);
    try {
      if (editing) {
        await update(editing, { title: draft.title || null, body: draft.body, tags });
        setEditing(null);
      } else {
        await add({ symbol, title: draft.title || null, body: draft.body, tags });
      }
      setDraft({ title: "", body: "", tags: "" });
      toast({ title: editing ? "Note updated" : "Note saved", variant: "success" });
    } catch (err) {
      toast({ title: "Could not save note", description: err instanceof Error ? err.message : "Try again", variant: "danger" });
    }
  };

  const startEdit = (id: string) => {
    const n = items.find((x) => x.id === id);
    if (!n) return;
    setEditing(id);
    setDraft({ title: n.title ?? "", body: n.body, tags: n.tags.join(", ") });
  };

  return (
    <ErrorBoundary label="Notes">
      <section aria-label="Trade journal" className="panel flex flex-col">
        <header className="px-3 py-2 border-b border-border flex items-center justify-between">
          <h2 className="text-sm font-medium text-fg">
            Notes {symbol && <span className="text-fg-muted">· {displaySymbol(symbol)}</span>}
          </h2>
        </header>

        {!user && (
          <p className="p-3 text-xs text-fg-muted">Sign in to save notes to your account.</p>
        )}

        <form onSubmit={submit} className="p-3 grid gap-2 text-sm">
          <input
            className="input"
            placeholder="Title (optional)"
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            maxLength={120}
          />
          <textarea
            className="input min-h-[88px]"
            placeholder="Trade idea, observation, lesson…"
            value={draft.body}
            onChange={(e) => setDraft({ ...draft, body: e.target.value })}
            maxLength={20_000}
          />
          <input
            className="input"
            placeholder="Tags, comma-separated"
            value={draft.tags}
            onChange={(e) => setDraft({ ...draft, tags: e.target.value })}
          />
          <div className="flex gap-2">
            <button type="submit" className="btn-primary">{editing ? "Update note" : "Save note"}</button>
            {editing && (
              <button type="button" className="btn" onClick={() => { setEditing(null); setDraft({ title: "", body: "", tags: "" }); }}>
                Cancel
              </button>
            )}
          </div>
        </form>

        <div className="border-t border-border">
          {items.length === 0 ? (
            <p className="p-6 text-sm text-fg-muted text-center">No notes for this asset yet.</p>
          ) : (
            <ul>
              {items.map((n) => (
                <li key={n.id} className="p-3 border-b border-border/40">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-sm font-medium text-fg">{n.title ?? <span className="text-fg-muted">Untitled</span>}</p>
                    <p className="text-xs text-fg-muted">{formatRelative(n.updatedAt)}</p>
                  </div>
                  <p className="text-sm text-fg-secondary mt-1 whitespace-pre-wrap break-words">{n.body}</p>
                  {n.tags.length > 0 && (
                    <p className="text-xs text-fg-muted mt-1 flex flex-wrap gap-1">
                      {n.tags.map((t) => <span key={t} className="pill bg-bg-hover text-fg-secondary">#{t}</span>)}
                    </p>
                  )}
                  <div className="flex gap-1 mt-2">
                    <button className="btn text-xs" onClick={() => startEdit(n.id)}>Edit</button>
                    <button className="btn text-xs" onClick={() => remove(n.id)}>Delete</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </ErrorBoundary>
  );
}
