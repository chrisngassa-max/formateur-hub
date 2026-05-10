import type { FolderNode } from "../../types/candidate";
import { Folder, File, ChevronDown, CheckCircle2, AlertCircle, CircleDashed } from "lucide-react";

type FolderTreeProps = {
  nodes: FolderNode[];
};

const statusLabel = {
  present: "Présent",
  manquant: "Manquant",
  optionnel: "Optionnel",
  a_verifier: "À vérifier",
};

export function FolderTree({ nodes }: FolderTreeProps) {
  if (!nodes || nodes.length === 0) {
    return <p className="text-sm text-zinc-500 italic p-4 bg-zinc-50 rounded-xl border border-zinc-100">Aucune arborescence définie.</p>;
  }

  return (
    <div className="flex flex-col gap-1 font-mono text-sm">
      {nodes.map((node) => (
        <FolderTreeNode key={node.name} node={node} level={0} />
      ))}
    </div>
  );
}

function FolderTreeNode({ node, level }: { node: FolderNode; level: number }) {
  return (
    <div className="flex flex-col gap-1">
      <div 
        className="flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors hover:bg-zinc-50"
        style={{ paddingLeft: `${level * 16 + 8}px` }}
      >
        <span className="text-zinc-400 shrink-0">
          {node.type === "folder" ? <Folder size={14} className="text-indigo-400" /> : <File size={14} />}
        </span>
        <strong className={`truncate ${node.type === "folder" ? "text-zinc-900 font-bold" : "text-zinc-700 font-medium"}`}>
          {node.name}
        </strong>
        {node.type !== "folder" && node.status && (
          <span className="ml-auto flex items-center shrink-0">
            {node.status === "present" ? <CheckCircle2 size={14} className="text-emerald-500" /> 
            : node.status === "manquant" ? <AlertCircle size={14} className="text-red-500" />
            : node.status === "optionnel" ? <CircleDashed size={14} className="text-zinc-300" />
            : <AlertCircle size={14} className="text-amber-500" />}
          </span>
        )}
      </div>
      {node.children && node.children.length > 0 && (
        <div className="flex flex-col gap-1 border-l border-zinc-100 ml-4">
          {node.children.map((child) => (
            <FolderTreeNode key={`${node.name}-${child.name}`} node={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
