import type { DocumentChecklist as DocumentChecklistItem } from "../../types/candidate";

type DocumentChecklistProps = {
  items: DocumentChecklistItem[];
};

const statusLabel = {
  present: "Présent",
  manquant: "Manquant",
  a_verifier: "À vérifier",
};

export function DocumentChecklist({ items }: DocumentChecklistProps) {
  const grouped = items.reduce<Record<string, DocumentChecklistItem[]>>((acc, item) => {
    acc[item.aidName] = [...(acc[item.aidName] ?? []), item];
    return acc;
  }, {});

  if (items.length === 0) {
    return <p className="text-sm text-zinc-500 italic p-4 bg-zinc-50 rounded-xl border border-zinc-100">Aucune pièce requise pour ce dossier.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {Object.entries(grouped).map(([aidName, documents]) => (
        <article className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm" key={aidName}>
          <h4 className="text-sm font-bold text-zinc-900 border-b border-zinc-100 pb-2">{aidName}</h4>
          <div className="flex flex-col gap-2">
            {documents.map((document) => (
              <div className="flex items-start justify-between gap-4 py-2 border-b border-zinc-50 last:border-0" key={`${document.aidId}-${document.document}`}>
                <div className="flex flex-col">
                  <strong className="text-sm font-medium text-zinc-800">{document.document}</strong>
                  {document.comment && <small className="text-[11px] text-zinc-500 mt-0.5">{document.comment}</small>}
                </div>
                <span className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                  document.status === "present" ? "bg-emerald-100 text-emerald-800" 
                  : document.status === "manquant" ? "bg-red-100 text-red-800" 
                  : "bg-amber-100 text-amber-800"
                }`}>
                  {statusLabel[document.status]}
                </span>
              </div>
            ))}
          </div>
        </article>
      ))}
    </div>
  );
}
