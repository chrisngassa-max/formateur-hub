type InternalNoteProps = {
  note: string;
};

export function InternalNote({ note }: InternalNoteProps) {
  if (!note) {
    return <p className="text-sm text-zinc-500 italic p-4 bg-zinc-50 rounded-xl border border-zinc-100">Aucune note interne pour le moment.</p>;
  }

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 font-mono text-sm leading-relaxed text-amber-900 shadow-sm">
      {note.split("\n").map((line, idx) => (
        <p key={`${line}-${idx}`} className="mb-2 last:mb-0">{line}</p>
      ))}
    </div>
  );
}
