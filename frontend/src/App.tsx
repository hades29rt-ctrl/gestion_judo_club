import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { AppLayout } from "./components/AppLayout";
import { RouteProtegee } from "./components/RouteProtegee";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { AdherentsPage } from "./pages/AdherentsPage";
import { CoursPage } from "./pages/CoursPage";
import { AppelPage } from "./pages/AppelPage";
import { LicencesPage } from "./pages/LicencesPage";
import { CompetitionsPage } from "./pages/CompetitionsPage";
import { CompetitionDetailPage } from "./pages/CompetitionDetailPage";
import { PaiementsPage } from "./pages/PaiementsPage";
import { CommunicationPage } from "./pages/CommunicationPage";
import { SecuritePage } from "./pages/SecuritePage";
import { UtilisateursPage } from "./pages/UtilisateursPage";
import { StatistiquesPage } from "./pages/StatistiquesPage";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            element={
              <RouteProtegee>
                <AppLayout />
              </RouteProtegee>
            }
          >
            <Route path="/adherents" element={<AdherentsPage />} />
            <Route path="/cours" element={<CoursPage />} />
            <Route path="/cours/:coursId/appel" element={<AppelPage />} />
            <Route path="/licences" element={<LicencesPage />} />
            <Route path="/competitions" element={<CompetitionsPage />} />
            <Route path="/competitions/:competitionId" element={<CompetitionDetailPage />} />
            <Route path="/paiements" element={<PaiementsPage />} />
            <Route path="/communication" element={<CommunicationPage />} />
            <Route path="/securite" element={<SecuritePage />} />
            <Route path="/utilisateurs" element={<UtilisateursPage />} />
            <Route path="/statistiques" element={<StatistiquesPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/adherents" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
