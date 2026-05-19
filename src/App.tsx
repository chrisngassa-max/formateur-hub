import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { AdminRoute } from "./components/auth/AdminRoute";
import { CandidateDetail } from "./pages/CandidateDetail";
import { CandidateEdit } from "./pages/CandidateEdit";
import { CandidateNew } from "./pages/CandidateNew";
import { AideSoldeCpf } from "./pages/AideSoldeCpf";
import { Dashboard } from "./pages/Dashboard";
import { Documents } from "./pages/Documents";
import { GuidedIntake } from "./pages/GuidedIntake";
import { Login } from "./pages/Login";
import { Settings } from "./pages/Settings";
import { Trainings } from "./pages/Trainings";
import { UsersManagement } from "./pages/admin/UsersManagement";
import { Reporting } from "./pages/admin/Reporting";
import { LeadsList } from "./pages/admin/LeadsList";
import { LeadDetail } from "./pages/admin/LeadDetail";
import { PartnersList } from "./pages/admin/PartnersList";
import { PartnerNew } from "./pages/admin/PartnerNew";
import { GestionnaireRoute } from "./components/auth/GestionnaireRoute";
import { PartenaireRoute } from "./components/auth/PartenaireRoute";
import { PartnerDashboard } from "./pages/partenaire/Dashboard";
import { PartnerDossierDetail } from "./pages/partenaire/DossierDetail";
import { InscritRoute } from "./components/auth/InscritRoute";
import { InscritDashboard } from "./routes/inscrit/index";
import { InscritDossier } from "./routes/inscrit/dossier";
import { InscritDocuments } from "./routes/inscrit/documents";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/aide/solde-cpf" element={<AideSoldeCpf />} />
      <Route
        path="*"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/saisie-guidee" element={<GuidedIntake />} />
                <Route path="/saisie-guidee/:id" element={<GuidedIntake />} />
                <Route path="/candidats/nouveau" element={<CandidateNew />} />
                <Route path="/candidats/:id" element={<CandidateDetail />} />
                <Route path="/candidats/:id/edit" element={<CandidateEdit />} />
                <Route path="/formations" element={<Trainings />} />
                <Route path="/documents" element={<Documents />} />
                <Route path="/parametres" element={<Settings />} />
                {/* Routes Admin — protégées par AdminRoute */}
                <Route path="/admin/utilisateurs" element={
                  <AdminRoute>
                    <UsersManagement />
                  </AdminRoute>
                } />
                <Route path="/admin/partenaires" element={
                  <AdminRoute>
                    <PartnersList />
                  </AdminRoute>
                } />
                <Route path="/admin/partenaires/new" element={
                  <AdminRoute>
                    <PartnerNew />
                  </AdminRoute>
                } />
                <Route path="/admin/reporting" element={
                  <AdminRoute>
                    <Reporting />
                  </AdminRoute>
                } />
                <Route path="/admin/leads" element={
                  <GestionnaireRoute>
                    <LeadsList />
                  </GestionnaireRoute>
                } />
                <Route path="/admin/leads/:id" element={
                  <GestionnaireRoute>
                    <LeadDetail />
                  </GestionnaireRoute>
                } />
                {/* Espace Partenaire Sécurisé */}
                <Route path="/partenaire" element={
                  <PartenaireRoute>
                    <PartnerDashboard />
                  </PartenaireRoute>
                } />
                <Route path="/partenaire/dossiers/:id" element={
                  <PartenaireRoute>
                    <PartnerDossierDetail />
                  </PartenaireRoute>
                } />
                {/* Espace Candidat Inscrit Sécurisé */}
                <Route path="/mon-espace" element={
                  <InscritRoute>
                    <InscritDashboard />
                  </InscritRoute>
                } />
                <Route path="/mon-espace/dossier" element={
                  <InscritRoute>
                    <InscritDossier />
                  </InscritRoute>
                } />
                <Route path="/mon-espace/documents" element={
                  <InscritRoute>
                    <InscritDocuments />
                  </InscritRoute>
                } />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </AppLayout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
