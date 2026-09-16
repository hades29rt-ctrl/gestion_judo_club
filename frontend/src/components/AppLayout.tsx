import { Outlet, Navigate, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { useAuth } from "../context/AuthContext";

// Pages accessibles au rôle "adherent" (famille) : horaires de cours,
// compétitions, et ses propres paramètres de sécurité.
const CHEMINS_AUTORISES_ADHERENT = ["/mon-compte", "/cours", "/competitions", "/securite"];

export function AppLayout() {
  const { utilisateur } = useAuth();
  const location = useLocation();

  const estAdherent = utilisateur?.role === "adherent";
  const cheminAutorise =
    !estAdherent ||
    CHEMINS_AUTORISES_ADHERENT.some((chemin) => location.pathname.startsWith(chemin));

  if (!cheminAutorise) {
    return <Navigate to="/mon-compte" replace />;
  }

  return (
    <div className="flex w-screen h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 h-screen overflow-y-auto">
        <div className="min-h-full p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
