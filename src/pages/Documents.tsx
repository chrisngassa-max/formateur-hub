import { useEffect, useState } from "react";
import { supabase } from "../integrations/supabase/client";
import { useAuth } from "../lib/auth";

type DocRow = {
  id: string;
  candidate_id: string;
  storage_path: string;
  file_name: string;
  mime_type: string | null;
  size_bytes: number | null;
  doc_type: string | null;
  created_at: string;
};

type CandRow = { id: string; data: { firstName: string; lastName: string } };

export function Documents() {
  const { user } = useAuth();
  const [docs, setDocs] = useState<DocRow[]>([]);
  const [candidates, setCandidates] = useState<CandRow[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    const [d, c] = await Promise.all([
      supabase.from("candidate_documents").select("*").order("created_at", { ascending: false }),
      supabase.from("candidates").select("id,data").order("updated_at", { ascending: false }),
    ]);
    if (d.data) setDocs(d.data as any);
    if (c.data) setCandidates(c.data as any);
  }

  useEffect(() => { refresh(); }, []);

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!user || !selected) { setError("Sélectionnez un candidat."); return; }
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true); setError(null);
    try {
      const path = `${selected}/${Date.now()}-${file.name}`;
      const up = await supabase.storage.from("candidate-documents").upload(path, file);
      if (up.error) throw up.error;
      const ins = await supabase.from("candidate_documents").insert({
        candidate_id: selected,
        uploaded_by: user.id,
        storage_path: path,
        file_name: file.name,
        mime_type: file.type,
        size_bytes: file.size,
      });
      if (ins.error) throw ins.error;
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur upload");
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  }

  async function download(d: DocRow) {
    const { data, error } = await supabase.storage.from("candidate-documents").createSignedUrl(d.storage_path, 60);
    if (error) { setError(error.message); return; }
    window.open(data.signedUrl, "_blank");
  }

  async function remove(d: DocRow) {
    if (!confirm("Supprimer ce document ?")) return;
    await supabase.storage.from("candidate-documents").remove([d.storage_path]);
    await supabase.from("candidate_documents").delete().eq("id", d.id);
    await refresh();
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Documents candidats</p>
          <h2>Pièces jointes</h2>
          <p>Stockage sécurisé. Accès restreint aux utilisateurs connectés.</p>
        </div>
      </header>

      <section className="panel">
        <h3>Téléverser un document</h3>
        <div style={{ display: "grid", gap: 12 }}>
          <label>
            Candidat
            <select value={selected} onChange={(e) => setSelected(e.target.value)}>
              <option value="">— Choisir —</option>
              {candidates.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.data?.firstName} {c.data?.lastName}
                </option>
              ))}
            </select>
          </label>
          <input type="file" disabled={busy || !selected} onChange={onUpload} />
          {error && <p className="ai-error">{error}</p>}
        </div>
      </section>

      <section className="panel">
        <h3>Documents enregistrés ({docs.length})</h3>
        {docs.length === 0 ? (
          <p>Aucun document pour l'instant.</p>
        ) : (
          <ul className="clean-list">
            {docs.map((d) => {
              const cand = candidates.find((c) => c.id === d.candidate_id);
              return (
                <li key={d.id} style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <span>
                    <strong>{d.file_name}</strong> — {cand?.data?.firstName} {cand?.data?.lastName}
                    <br />
                    <small style={{ opacity: 0.6 }}>{new Date(d.created_at).toLocaleString()}</small>
                  </span>
                  <span style={{ display: "flex", gap: 8 }}>
                    <button className="secondary" onClick={() => download(d)}>Télécharger</button>
                    <button className="danger" onClick={() => remove(d)}>Supprimer</button>
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
