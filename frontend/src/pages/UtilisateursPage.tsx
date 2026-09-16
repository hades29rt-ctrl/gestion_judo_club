import { useEffect, useState } from "react";
import { Check, X, Trash2 } from "lucide-react";
import { api } from "../lib/api";
import { ConfirmationSuppressionModal } from "../components/ConfirmationSuppressionModal";

interface UtilisateurAdmin {
  id: number;
  identifiant: string;
  nom: string | null;
  role: string;
  actif: boolean;
  famille_id: number | null;
  created_at: string;
  last_login_at: string | null;
}

interface FammilleOption {
  id: number;
  nom_famille: string;
}

const LABELS_ROLE: Record<string, string> = {
  admin: "Administrateur",
  president: "Président",
  tresorier: "Trésorier",
  secretaire: "Secrétaire",
  membre: "Membre",
  adherent: "Adhérent",
};

const ROLES_ASSIGNABLES = ["membre", "tresorier", "president", "secretaire", "adherent"];

export function UtilisateursPage() {
  const [utilisateurs, setUtilisateurs] = useState<UtilisateurAdmin[]>([]);
  const [familles, setFamilles] = useState<FammilleOption[]>([]);
  const [chargement, setChargement] = useState(true);
  const [enCoursId, setEnCoursId] = useState<number | null>(null);
  const [utilisateurASupprimer, setUtilisateurASupprimer] = useState<UtilisateurAdmin | null>(null);
  const [suppressionEnCours, setSuppressionEnCours] = useState(false);

  async function charger() {
    setChargement(true);
    const [{ data: users }, { data: fams }] = await Promise.all([
      api.get<UtilisateurAdmin[]>("/auth/utilisateurs"),
      api.get<FammilleOption[]>("/familles"),
    ]);
    setUtilisateurs(users);
    setFamilles(fams);
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

  async function changerRole(id: number, role: string) {
    setEnCoursId(id);
    try {
      await api.put(`/auth/utilisateurs/${id}/role`, { role });
      charger();
    } finally {
      setEnCoursId(null);
    }
  }

  async function changerFamille(id: number, familleId: string) {
    setEnCoursId(id);
    try {
      await api.put(`/auth/utilisateurs/${id}/famille`, {
        famille_id: familleId ? Number(familleId) : null,
      });
      charger();
    } finally {
      setEnCoursId(null);
    }
  }

  async function confirmerSuppression() {
    if (!utilisateurASupprimer) return;
    setSuppressionEnCours(true);
    try {
      await api.delete(`/auth/utilisateurs/${utilisateurASupprimer.id}`);
      setUtilisateurASupprimer(null);
      charger();
    } finally {
      setSuppressionEnCours(false);
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
            Comptes désactivés ({enAttente.length})
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
                    Réactiver
                  </button>
                  <button
                    onClick={() => setUtilisateurASupprimer(u)}
                    disabled={enCoursId === u.id}
                    title="Supprimer définitivement"
                    className="text-muted hover:text-danger disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
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
                <th className="px-4 py-3">Famille liée</th>
                <th className="px-4 py-3">Dernière connexion</th>
                <th className="px-4 py-3 w-20"></th>
              </tr>
            </thead>
            <tbody>
              {actifs.map((u) => (
                <tr key={u.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium">{u.nom || "—"}</td>
                  <td className="px-4 py-3 text-muted">{u.identifiant}</td>
                  <td className="px-4 py-3">
                    {u.role === "admin" ? (
                      <span className="text-muted">{LABELS_ROLE[u.role]}</span>
                    ) : (
                      <select
                        value={u.role}
                        onChange={(e) => changerRole(u.id, e.target.value)}
                        disabled={enCoursId === u.id}
                        className="text-xs border border-border rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-gold/40"
                      >
                        {ROLES_ASSIGNABLES.map((r) => (
                          <option key={r} value={r}>
                            {LABELS_ROLE[r]}
                          </option>
                        ))}
                      </select>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {u.role === "adherent" ? (
                      <select
                        value={u.famille_id ?? ""}
                        onChange={(e) => changerFamille(u.id, e.target.value)}
                        disabled={enCoursId === u.id}
                        className="text-xs border border-border rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-gold/40"
                      >
                        <option value="">Aucune</option>
                        {familles.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.nom_famille}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {u.last_login_at
                      ? new Date(u.last_login_at).toLocaleString("fr-FR")
                      : "Jamais"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
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
                      <button
                        onClick={() => setUtilisateurASupprimer(u)}
                        disabled={enCoursId === u.id}
                        title="Supprimer définitivement"
                        className="text-muted hover:text-danger disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {utilisateurASupprimer && (
        <ConfirmationSuppressionModal
          titre="Supprimer ce compte ?"
          message={`Le compte "${utilisateurASupprimer.nom || utilisateurASupprimer.identifiant}" sera définitivement supprimé. Cette action est irréversible.`}
          enCours={suppressionEnCours}
          onConfirm={confirmerSuppression}
          onClose={() => setUtilisateurASupprimer(null)}
        />
      )}
    </div>
  );
}
