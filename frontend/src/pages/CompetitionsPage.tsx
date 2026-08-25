import { useEffect, useState } from "react";
import { Plus, MapPin, Pencil, Trash2, Trophy } from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import type { Competition } from "../types";
import { LABELS_TYPE_COMPETITION } from "../lib/labels";
import { NouvelleCompetitionModal } from "../components/NouvelleCompetitionModal";
import { ConfirmationSuppressionModal } from "../components/ConfirmationSuppressionModal";

export function CompetitionsPage() {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [chargement, setChargement] = useState(true);
  const [modalNouvelle, setModalNouvelle] = useState(false);
  const [competitionAModifier, setCompetitionAModifier] = useState<Competition | null>(null);
  const [competitionASupprimer, setCompetitionASupprimer] = useState<Competition | null>(null);
  const [suppressionEnCours, setSuppressionEnCours] = useState(false);

  async function charger() {
    setChargement(true);
    const { data } = await api.get<Competition[]>("/competitions");
    setCompetitions(data);
    setChargement(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    charger();
  }, []);

  async function confirmerSuppression() {
    if (!competitionASupprimer) return;
    setSuppressionEnCours(true);
    try {
      await api.delete(`/competitions/${competitionASupprimer.id}`);
      setCompetitionASupprimer(null);
      charger();
    } finally {
      setSuppressionEnCours(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold">Compétitions</h1>
          <p className="text-muted text-sm mt-1">
            Tournois, stages et résultats du club
          </p>
        </div>
        <button
          onClick={() => setModalNouvelle(true)}
          className="flex items-center gap-2 bg-ink text-white text-sm font-medium px-4 py-2.5 rounded-md hover:bg-ink-light transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nouvelle compétition
        </button>
      </div>

      {chargement && <p className="text-muted text-sm">Chargement...</p>}

      {!chargement && competitions.length === 0 && (
        <div className="border border-dashed border-border rounded-lg p-16 flex flex-col items-center justify-center text-center bg-card">
          <p className="font-medium text-ink_text">Aucune compétition enregistrée</p>
          <p className="text-sm text-muted mt-1">
            Crée ta première compétition avec le bouton ci-dessus.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {competitions.map((c) => (
          <div
            key={c.id}
            className="bg-card border border-border rounded-lg p-5 flex flex-col"
          >
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-display font-semibold text-base">{c.nom}</h3>
              <span className="text-xs font-medium bg-gold/15 text-gold-dark px-2 py-1 rounded-full whitespace-nowrap">
                {LABELS_TYPE_COMPETITION[c.type]}
              </span>
            </div>

            <div className="space-y-1.5 text-sm text-muted mb-4">
              <div>
                {new Date(c.date_debut).toLocaleDateString("fr-FR")}
                {c.date_fin && ` - ${new Date(c.date_fin).toLocaleDateString("fr-FR")}`}
              </div>
              {c.lieu && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5" />
                  {c.lieu}
                </div>
              )}
            </div>

            <div className="flex gap-2 mt-auto pt-3 border-t border-border">
              <Link
                to={`/competitions/${c.id}`}
                className="flex items-center gap-1.5 text-sm font-medium text-ink hover:text-ink-light"
              >
                <Trophy className="w-4 h-4" />
                Résultats
              </Link>
            </div>

            <div className="flex gap-3 pt-3 mt-3 border-t border-border">
              <button
                onClick={() => setCompetitionAModifier(c)}
                className="flex items-center gap-1.5 text-xs font-medium text-muted hover:text-ink_text"
              >
                <Pencil className="w-3.5 h-3.5" />
                Modifier
              </button>
              <button
                onClick={() => setCompetitionASupprimer(c)}
                className="flex items-center gap-1.5 text-xs font-medium text-muted hover:text-danger"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Supprimer
              </button>
            </div>
          </div>
        ))}
      </div>

      {modalNouvelle && (
        <NouvelleCompetitionModal
          onClose={() => setModalNouvelle(false)}
          onSaved={charger}
        />
      )}

      {competitionAModifier && (
        <NouvelleCompetitionModal
          competitionExistante={competitionAModifier}
          onClose={() => setCompetitionAModifier(null)}
          onSaved={charger}
        />
      )}

      {competitionASupprimer && (
        <ConfirmationSuppressionModal
          titre="Supprimer cette compétition ?"
          message={`"${competitionASupprimer.nom}" sera définitivement supprimée, ainsi que tous les résultats associés.`}
          enCours={suppressionEnCours}
          onConfirm={confirmerSuppression}
          onClose={() => setCompetitionASupprimer(null)}
        />
      )}
    </div>
  );
}
