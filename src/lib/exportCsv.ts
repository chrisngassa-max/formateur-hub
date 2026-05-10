import type { Candidate, ProjectionResult } from "../types/candidate";
import type { UserProfile } from "./profilesRepo";
import { formatCurrency } from "./format";

export function downloadCandidatesCsv(
  candidates: Candidate[],
  projections: ProjectionResult[],
  profiles: UserProfile[]
) {
  // Columns for the CSV
  const headers = [
    "Nom",
    "Prénom",
    "Email",
    "Téléphone",
    "Formation",
    "Statut pipeline",
    "Statut dossier",
    "Conseiller assigné",
    "Mon dossier",
    "Score financement",
    "Score complétude",
    "Reste à charge",
    "CA prudent",
    "CA optimiste",
    "Financeur recommandé",
    "Relance due",
    "Date relance",
    "Prochaine action recommandée",
    "Date création",
    "Date mise à jour"
  ];

  // Helper to format dates correctly for Excel FR (DD/MM/YYYY)
  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";
    return date.toLocaleDateString("fr-FR");
  };

  // Helper to escape CSV fields (in case of semicolons or quotes)
  const escapeCsv = (str: string | number | undefined | null | boolean) => {
    if (str === null || str === undefined) return "";
    const stringified = String(str);
    if (stringified.includes(";") || stringified.includes('"') || stringified.includes("\n")) {
      return `"${stringified.replace(/"/g, '""')}"`;
    }
    return stringified;
  };

  // Generate rows
  const rows = candidates.map((candidate, index) => {
    const proj = projections[index];
    const profile = profiles.find((p) => p.id === candidate.assignedTo);
    const assignedName = profile 
      ? (profile.firstName ? `${profile.firstName} ${profile.lastName}` : profile.email) 
      : "Non assigné";

    return [
      candidate.lastName,
      candidate.firstName,
      candidate.email,
      candidate.phone,
      candidate.trainingName,
      candidate.pipelineStatus || "nouveau",
      candidate.dossierStatus,
      assignedName,
      candidate.ownerId === candidate.assignedTo ? "Oui" : "Non", // Approximate 'mon dossier' logic 
      proj.financingScore,
      proj.completionScore,
      proj.estimatedRemainingCost, // keeping raw numbers for calculation
      proj.businessForecast.prudentRevenue,
      proj.businessForecast.optimisticRevenue,
      proj.diagnostic.primaryPath,
      proj.businessForecast.followUpDue ? "Oui" : "Non",
      formatDate(proj.businessForecast.followUpAt),
      proj.diagnostic.recommendedNextStep,
      formatDate(candidate.createdAt),
      formatDate(candidate.updatedAt),
    ];
  });

  // Assemble CSV string
  const csvContent = [
    headers.map(escapeCsv).join(";"),
    ...rows.map((row) => row.map(escapeCsv).join(";"))
  ].join("\n");

  // Create Blob and trigger download
  // Use UTF-8 with BOM to ensure Excel opens special characters properly
  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.href = url;
  const timestamp = new Date().toISOString().slice(0, 10);
  link.setAttribute("download", `export-candidats-${timestamp}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
