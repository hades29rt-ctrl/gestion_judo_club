import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Users } from "lucide-react";
import { api } from "../lib/api";
import type { FamilleAvecEffectif, Famille } from "../types";
import { NouvelleFamilleModal } from "../components/NouvelleFamilleModal";
import { ConfirmationSuppressionModal } from "../components/ConfirmationSuppressionModal";

export function FamillesPage() {
  const [familles, setFamilles] = useState<FamilleAvecEffectif[]>([]);
  const [chargement, setChargement] = useState(true);
  const [modalNouvelle, setModalNouvelle] = useState(false);
  const [familleAModifier, setFamilleAModifier] = useState<Famille | null>(null);
  const [familleASupprimer, setFamilleASupprimer] = useState<FamilleAvecEffectif | null>(null);
  const [suppressionEnCours, setSuppressionEnCours] = useState(false);

  async function charger() {
    setChargement(true);
    const { data } = await api.get<FamilleAvecEffectif[]>("/familles");
    setFamilles(data);
    setChargement(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    charger();
  }, []);

  async function confirmerSuppression() {
    if (!familleASupprimer) return;
    setSuppressionEnCours(true);
    try {
      await api.delete(`/familles/${familleASupprimer.id}`);
      setFamilleASupprimer(null);
      charger();
    } finally {
      setSuppressionEnCours(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold">Familles</h1>
          <p className="text-muted text-sm mt-1">
            Regroupe plusieurs adhérents (fratrie) sous un même contact.
          </p>
        </div>
        <button
          onClick={() => setModalNouvelle(true)}
          className="flex items-center gap-2 bg-ink text-white text-sm font-medium px-4 py-2.5 rounded-md hover:bg-ink-light transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nouvelle famille
        </button>
      </div>

      {chargement && <p className="text-muted text-sm">Chargement...</p>}

      {!chargement && familles.length === 0 && (
        <div className="border border-dashed border-border rounded-lg p-16 flex flex-col items-center justify-center text-center bg-card">
          <p className="font-medium text-ink_text">Aucune famille enregistrée</p>
          <p className="text-sm text-muted mt-1">
            Crée une première famille avant d'ajouter des adhérents.
          </p>
        </div>
      )}

      {!chargement && familles.length > 0 && (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs font-medium text-muted uppercase tracking-wide">
                <th className="px-4 py-3">Nom de famille</th>
                <th className="px-4 py-3">Téléphone</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Adhérents</th>
                <th className="px-4 py-3 w-20"></th>
              </tr>
            </thead>
            <tbody>
              {familles.map((f) => (
                <tr key={f.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium">{f.nom_famille}</td>
                  <td className="px-4 py-3 text-muted">{f.telephone || "—"}</td>
                  <td className="px-4 py-3 text-muted">{f.email || "—"}</td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1.5 text-xs font-medium bg-gold/15 text-gold-dark px-2 py-1 rounded-full w-fit">
                      <Users className="w-3.5 h-3.5" />
                      {f.nombre_adherents}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setFamilleAModifier(f)}
                        className="text-muted hover:text-ink_text"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setFamilleASupprimer(f)}
                        className="text-muted hover:text-danger"
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
      )}

      {modalNouvelle && (
        <NouvelleFamilleModal onClose={() => setModalNouvelle(false)} onSaved={charger} />
      )}

      {familleAModifier && (
        <NouvelleFamilleModal
          familleExistante={familleAModifier}
          onClose={() => setFamilleAModifier(null)}
          onSaved={charger}
        />
      )}

      {familleASupprimer && (
        <ConfirmationSuppressionModal
          titre="Supprimer cette famille ?"
          message={`"${familleASupprimer.nom_famille}" sera supprimée. Les adhérents rattachés ne seront pas supprimés, mais perdront leur lien à cette famille.`}
          enCours={suppressionEnCours}
          onConfirm={confirmerSuppression}
          onClose={() => setFamilleASupprimer(null)}
        />
      )}
    </div>
  );
}
