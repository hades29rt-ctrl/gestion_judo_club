import { useEffect, useState } from "react";
import { Plus, UserPlus, Clock, MapPin, ClipboardList, Pencil, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import type { Cours } from "../types";
import { LABELS_JOUR_SEMAINE } from "../lib/labels";
import { NouveauCoursModal } from "../components/NouveauCoursModal";
import { InscrireJudokaModal } from "../components/InscrireJudokaModal";
import { ConfirmationSuppressionModal } from "../components/ConfirmationSuppressionModal";

export function CoursPage() {
  const [cours, setCours] = useState<Cours[]>([]);
  const [chargement, setChargement] = useState(true);
  const [modalNouveauCours, setModalNouveauCours] = useState(false);
  const [coursAModifier, setCoursAModifier] = useState<Cours | null>(null);
  const [coursASupprimer, setCoursASupprimer] = useState<Cours | null>(null);
  const [suppressionEnCours, setSuppressionEnCours] = useState(false);
  const [coursInscription, setCoursInscription] = useState<number | null>(null);

  async function charger() {
    setChargement(true);
    const { data } = await api.get<Cours[]>("/cours");
    setCours(data);
    setChargement(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    charger();
  }, []);

  async function confirmerSuppression() {
    if (!coursASupprimer) return;
    setSuppressionEnCours(true);
    try {
      await api.delete(`/cours/${coursASupprimer.id}`);
      setCoursASupprimer(null);
      charger();
    } finally {
      setSuppressionEnCours(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold">Cours</h1>
          <p className="text-muted text-sm mt-1">
            {cours.length} créneau{cours.length > 1 ? "x" : ""} enregistré
            {cours.length > 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => setModalNouveauCours(true)}
          className="flex items-center gap-2 bg-ink text-white text-sm font-medium px-4 py-2.5 rounded-md hover:bg-ink-light transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nouveau cours
        </button>
      </div>

      {chargement && <p className="text-muted text-sm">Chargement...</p>}

      {!chargement && cours.length === 0 && (
        <div className="border border-dashed border-border rounded-lg p-16 flex flex-col items-center justify-center text-center bg-card">
          <p className="font-medium text-ink_text">Aucun cours pour le moment</p>
          <p className="text-sm text-muted mt-1">
            Crée ton premier créneau avec le bouton ci-dessus.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cours.map((c) => (
          <div
            key={c.id}
            className="bg-card border border-border rounded-lg p-5 flex flex-col"
          >
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-display font-semibold text-base">{c.nom}</h3>
              {c.jour_semaine && (
                <span className="text-xs font-medium bg-gold/15 text-gold-dark px-2 py-1 rounded-full">
                  {LABELS_JOUR_SEMAINE[c.jour_semaine]}
                </span>
              )}
            </div>

            <div className="space-y-1.5 text-sm text-muted mb-4">
              {c.heure_debut && c.heure_fin && (
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5" />
                  {c.heure_debut.slice(0, 5)} - {c.heure_fin.slice(0, 5)}
                </div>
              )}
              {c.lieu && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5" />
                  {c.lieu}
                </div>
              )}
              {c.professeur && <div>Professeur : {c.professeur}</div>}
            </div>

            <div className="flex gap-2 mt-auto pt-3 border-t border-border">
              <button
                onClick={() => setCoursInscription(c.id)}
                className="flex items-center gap-1.5 text-sm font-medium text-ink hover:text-ink-light"
              >
                <UserPlus className="w-4 h-4" />
                Inscrire
              </button>
              <Link
                to={`/cours/${c.id}/appel`}
                className="flex items-center gap-1.5 text-sm font-medium text-ink hover:text-ink-light ml-auto"
              >
                <ClipboardList className="w-4 h-4" />
                Faire l'appel
              </Link>
            </div>

            <div className="flex gap-3 pt-3 mt-3 border-t border-border">
              <button
                onClick={() => setCoursAModifier(c)}
                className="flex items-center gap-1.5 text-xs font-medium text-muted hover:text-ink_text"
              >
                <Pencil className="w-3.5 h-3.5" />
                Modifier
              </button>
              <button
                onClick={() => setCoursASupprimer(c)}
                className="flex items-center gap-1.5 text-xs font-medium text-muted hover:text-danger"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Supprimer
              </button>
            </div>
          </div>
        ))}
      </div>

      {modalNouveauCours && (
        <NouveauCoursModal
          onClose={() => setModalNouveauCours(false)}
          onSaved={charger}
        />
      )}

      {coursAModifier && (
        <NouveauCoursModal
          coursExistant={coursAModifier}
          onClose={() => setCoursAModifier(null)}
          onSaved={charger}
        />
      )}

      {coursASupprimer && (
        <ConfirmationSuppressionModal
          titre="Supprimer ce cours ?"
          message={`"${coursASupprimer.nom}" sera définitivement supprimé, ainsi que les inscriptions et présences associées.`}
          enCours={suppressionEnCours}
          onConfirm={confirmerSuppression}
          onClose={() => setCoursASupprimer(null)}
        />
      )}

      {coursInscription !== null && (
        <InscrireJudokaModal
          coursId={coursInscription}
          onClose={() => setCoursInscription(null)}
          onCreated={() => {}}
        />
      )}
    </div>
  );
}
