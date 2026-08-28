import { useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import { api } from "../lib/api";

interface UtilisateurAdmin {
  id: number;
  identifiant: string;
  nom: string | null;
  role: string;
  actif: boolean;
  created_at: string;
  last_login_at: string | null;
}

const LABELS_ROLE: Record<string, string> = {
  admin: "Administrateur",
  professeur: "Professeur",
  secretaire: "Secrétaire",
  lecture_seule: "Lecture seule",
};

export function UtilisateursPage() {
  const [utilisateurs, setUtilisateurs] = useState<UtilisateurAdmin[]>([]);
  const [chargement, setChargement] = useState(true);
  const [enCoursId, setEnCoursId] = useState<number | null>(null);

  async function charger() {
    setChargement(true);
    const { data } = await api.get<UtilisateurAdmin[]>("/auth/utilisateurs");
    setUtilisateurs(data);
    setChargement(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    charger();
  }, []);

  async function changerStatut(id: number, actif: boolean) {
    setEnCoursId(id);
    try {
      await api.put(`/auth/utilisateurs/${id}/statut`, { actif });
      charger();
    } finally {
      setEnCoursId(null);
    }
  }

  const enAttente = utilisateurs.filter((u) => !u.actif);
  const actifs = utilisateurs.filter((u) => u.actif);

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold mb-1">Utilisateurs</h1>
      <p className="text-muted text-sm mb-8">
        Gère les comptes ayant accès au logiciel du club.
      </p>

      {chargement && <p className="text-muted text-sm">Chargement...</p>}

      {!chargement && enAttente.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-medium text-muted uppercase tracking-wide mb-3">
            En attente d'activation ({enAttente.length})
          </h2>
          <div className="bg-card border border-gold/30 rounded-lg overflow-hidden">
            {enAttente.map((u) => (
              <div
                key={u.id}
                className="flex items-center justify-between px-4 py-3 border-b border-border last:border-0"
              >
                <div>
                  <p className="font-medium text-sm">{u.nom || u.identifiant}</p>
                  <p className="text-xs text-muted">
                    {u.identifiant} — {LABELS_ROLE[u.role] ?? u.role}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => changerStatut(u.id, true)}
                    disabled={enCoursId === u.id}
                    className="flex items-center gap-1.5 text-xs font-medium bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-md hover:opacity-80 disabled:opacity-50"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Activer
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-sm font-medium text-muted uppercase tracking-wide mb-3">
          Comptes actifs ({actifs.length})
        </h2>
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs font-medium text-muted uppercase tracking-wide">
                <th className="px-4 py-3">Nom</th>
                <th className="px-4 py-3">Identifiant</th>
                <th className="px-4 py-3">Rôle</th>
                <th className="px-4 py-3">Dernière connexion</th>
                <th className="px-4 py-3 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {actifs.map((u) => (
                <tr key={u.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium">{u.nom || "—"}</td>
                  <td className="px-4 py-3 text-muted">{u.identifiant}</td>
                  <td className="px-4 py-3 text-muted">
                    {LABELS_ROLE[u.role] ?? u.role}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {u.last_login_at
                      ? new Date(u.last_login_at).toLocaleString("fr-FR")
                      : "Jamais"}
                  </td>
                  <td className="px-4 py-3">
                    {u.role !== "admin" && (
                      <button
                        onClick={() => changerStatut(u.id, false)}
                        disabled={enCoursId === u.id}
                        title="Désactiver ce compte"
                        className="text-muted hover:text-danger disabled:opacity-50"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
