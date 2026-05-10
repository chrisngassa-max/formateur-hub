import type { AidProjection } from "../../types/candidate";
import { formatCurrency } from "../../lib/format";
import { CheckCircle2, AlertCircle, XCircle, Info } from "lucide-react";

type AidCardProps = {
  aid: AidProjection;
};

const statusConfig = {
  probable: { label: "Probable", bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-800", icon: CheckCircle2, iconColor: "text-emerald-600" },
  a_verifier: { label: "À vérifier", bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-800", icon: AlertCircle, iconColor: "text-amber-600" },
  exclu: { label: "Exclu", bg: "bg-red-50", border: "border-red-200", text: "text-red-800", icon: XCircle, iconColor: "text-red-600" },
  non_applicable: { label: "Non applicable", bg: "bg-zinc-50", border: "border-zinc-200", text: "text-zinc-600", icon: Info, iconColor: "text-zinc-400" },
};

export function AidCard({ aid }: AidCardProps) {
  const config = statusConfig[aid.status] || statusConfig.non_applicable;
  const Icon = config.icon;

  return (
    <article className={`flex flex-col gap-3 rounded-xl border ${config.border} bg-white p-5 shadow-sm transition-all hover:shadow-md relative overflow-hidden`}>
      <div className={`absolute top-0 inset-x-0 h-1 ${config.bg.replace('50', '500')}`} />
      
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${config.bg} ${config.text}`}>
            <Icon size={12} className={config.iconColor} />
            {config.label}
          </span>
          {typeof aid.estimatedAmount === "number" && (
            <strong className="text-lg font-bold text-zinc-900">{formatCurrency(aid.estimatedAmount)}</strong>
          )}
        </div>
        <h3 className="mt-2 text-base font-bold text-zinc-900 leading-tight">{aid.name}</h3>
      </div>
      
      <p className="text-sm text-zinc-600 leading-relaxed">{aid.reason}</p>
      
      <div className="mt-auto pt-4 flex flex-col gap-3">
        <div className="flex items-center justify-between border-t border-zinc-100 pt-3">
          <span className="text-xs font-medium text-zinc-500">Niveau de confiance</span>
          <span className="text-xs font-bold text-zinc-700 capitalize">{aid.confidence}</span>
        </div>
        
        {aid.requiredChecks.length > 0 && (
          <ul className="flex flex-col gap-1.5 rounded-lg bg-zinc-50 p-3">
            {aid.requiredChecks.map((check) => (
              <li key={check} className="flex items-start gap-2 text-xs text-zinc-700">
                <span className="mt-0.5 shrink-0 text-indigo-400">•</span>
                <span>{check}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
  );
}
