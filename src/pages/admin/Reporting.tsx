import { useMemo } from "react";
import { useCandidates } from "../../hooks/useCandidates";
import { projectCandidate } from "../../lib/projectionEngine";
import { BarChart3, TrendingUp, DollarSign, Target, Clock, AlertTriangle } from "lucide-react";
import { formatCurrency } from "../../lib/format";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from "recharts";

export function Reporting() {
  const { candidates, loading } = useCandidates();

  const metrics = useMemo(() => {
    if (!candidates.length) return null;

    const projections = candidates.map(projectCandidate);

    const total = candidates.length;
    const gagne = candidates.filter(c => c.pipelineStatus === "gagne").length;
    const perduAbandonne = candidates.filter(c => c.pipelineStatus === "perdu" || c.pipelineStatus === "abandonne").length;
    const enCours = total - gagne - perduAbandonne;

    const conversionRate = total > 0 ? (gagne / (total - enCours || 1)) * 100 : 0;

    // CA Gagné
    const caGagne = projections
      .filter((p, i) => candidates[i].pipelineStatus === "gagne")
      .reduce((sum, p) => sum + p.businessForecast.prudentRevenue, 0);

    // CA Potentiel (En cours)
    const caPotentiel = projections
      .filter((p, i) => {
        const s = candidates[i].pipelineStatus;
        return s !== "gagne" && s !== "perdu" && s !== "abandonne" && s !== "archive";
      })
      .reduce((sum, p) => sum + (p.businessForecast.prudentRevenue * (p.financingScore / 100)), 0);

    // Temps de conversion moyen (simplifié basé sur created_at et updated_at des gagnés)
    const timeToCloseArr = candidates
      .filter(c => c.pipelineStatus === "gagne")
      .map(c => {
        const d1 = new Date(c.createdAt).getTime();
        const d2 = new Date(c.updatedAt).getTime(); // assuming updatedAt is when it was won
        return (d2 - d1) / (1000 * 3600 * 24); // in days
      });
    const avgTimeToClose = timeToCloseArr.length 
      ? timeToCloseArr.reduce((a, b) => a + b, 0) / timeToCloseArr.length 
      : 0;

    return {
      total,
      gagne,
      perduAbandonne,
      enCours,
      conversionRate,
      caGagne,
      caPotentiel,
      avgTimeToClose
    };
  }, [candidates]);

  if (loading) {
    return <div className="animate-pulse p-8">Chargement des statistiques...</div>;
  }

  if (!metrics) {
    return <div className="p-8">Aucune donnée disponible pour le reporting.</div>;
  }

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
            <BarChart3 size={24} className="text-indigo-600" />
            Reporting Global
          </h2>
          <p className="mt-2 text-sm text-zinc-500">
            Statistiques de performance du cabinet sur l'ensemble du pipeline.
          </p>
        </div>
      </header>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3 text-emerald-600 mb-2">
            <DollarSign size={20} />
            <h3 className="font-bold text-xs uppercase tracking-wider">CA Sécurisé (Gagné)</h3>
          </div>
          <p className="text-3xl font-bold text-zinc-900">{formatCurrency(metrics.caGagne)}</p>
          <p className="text-sm text-zinc-500 mt-1">{metrics.gagne} dossiers clôturés</p>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3 text-indigo-600 mb-2">
            <TrendingUp size={20} />
            <h3 className="font-bold text-xs uppercase tracking-wider">CA Potentiel Pondéré</h3>
          </div>
          <p className="text-3xl font-bold text-zinc-900">{formatCurrency(metrics.caPotentiel)}</p>
          <p className="text-sm text-zinc-500 mt-1">Sur {metrics.enCours} dossiers en cours</p>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3 text-blue-600 mb-2">
            <Target size={20} />
            <h3 className="font-bold text-xs uppercase tracking-wider">Taux de conversion</h3>
          </div>
          <p className="text-3xl font-bold text-zinc-900">{metrics.conversionRate.toFixed(1)}%</p>
          <p className="text-sm text-zinc-500 mt-1">Hors dossiers en cours</p>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3 text-amber-600 mb-2">
            <Clock size={20} />
            <h3 className="font-bold text-xs uppercase tracking-wider">Délai moyen (Clôture)</h3>
          </div>
          <p className="text-3xl font-bold text-zinc-900">
            {metrics.avgTimeToClose > 0 ? `${Math.round(metrics.avgTimeToClose)} jours` : "-"}
          </p>
          <p className="text-sm text-zinc-500 mt-1">Création à statut Gagné</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Entonnoir / Statuts avec Recharts */}
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-zinc-900 mb-4 border-b border-zinc-100 pb-2">Répartition du Pipeline</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  { name: 'En cours', count: metrics.enCours, color: '#6366f1' },
                  { name: 'Gagnés', count: metrics.gagne, color: '#10b981' },
                  { name: 'Perdus/Aband.', count: metrics.perduAbandonne, color: '#ef4444' }
                ]}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <RechartsTooltip cursor={{ fill: '#f4f4f5' }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={60}>
                  {
                    [
                      { name: 'En cours', count: metrics.enCours, color: '#6366f1' },
                      { name: 'Gagnés', count: metrics.gagne, color: '#10b981' },
                      { name: 'Perdus/Aband.', count: metrics.perduAbandonne, color: '#ef4444' }
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))
                  }
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 text-center text-sm font-semibold text-zinc-600">
            Total dossiers : {metrics.total}
          </div>
        </div>

        {/* Recommandations */}
        <div className="rounded-xl border border-zinc-200 bg-zinc-900 p-6 shadow-sm text-white">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <AlertTriangle className="text-amber-400" /> Insights & Actions
          </h3>
          <ul className="flex flex-col gap-4 text-sm text-zinc-300">
            {metrics.conversionRate < 30 && metrics.total > 10 ? (
              <li className="flex items-start gap-2">
                <span className="text-red-400 font-bold mt-0.5">•</span>
                Le taux de conversion est faible. Vérifiez la qualification des leads (diagnostics).
              </li>
            ) : (
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold mt-0.5">•</span>
                Taux de conversion sain. Continuez de prioriser les dossiers à fort potentiel.
              </li>
            )}
            
            {metrics.caPotentiel > metrics.caGagne * 2 ? (
              <li className="flex items-start gap-2">
                <span className="text-amber-400 font-bold mt-0.5">•</span>
                Gros volume de CA en attente. Focalisez l'équipe sur la clôture des dossiers "Prêt à déposer".
              </li>
            ) : null}

            <li className="flex items-start gap-2">
              <span className="text-indigo-400 font-bold mt-0.5">•</span>
              Veillez à bien maintenir les "Prochaines actions" à jour pour réduire le délai moyen de clôture ({Math.round(metrics.avgTimeToClose)}j).
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
