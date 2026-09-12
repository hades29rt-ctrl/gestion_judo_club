import { useEffect, useState } from "react";
import { Plus, Search, UserX, UserCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import type { AdherentJudoka } from "../types";
import { LABELS_CATEGORIE_AGE, LABELS_LICENCE_STATUT, LABELS_GRADE } from "../lib/labels";
import { NouvelAdherentModal } from "../components/NouvelAdherentModal";
import { ConfirmationSuppressionModal } from "../components/ConfirmationSuppressionModal";

export function AdherentsPage() {
  const [adherents, setAdherents] = useState<AdherentJudoka[]>([]);
  const [recherche, setRecherche] = useState("");
  const [modalOuvert, setModalOuvert] = useState(false);
  const [chargement, setChargement] = useState(true);
  const [adherentAAnnuler, setAdherentAAnnuler] = useState<AdherentJudoka | null>(null);
  const [annulationEnCours, setAnnulationEnCours] = useState(false);

  async function charger() {
    setChargement(true);
    const { data } = await api.get<AdherentJudoka[]>("/adherents");
    setAdherents(data);
    setChargement(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    charger();
  }, []);

  async function confirmerAnnulation() {
    if (!adherentAAnnuler) return;
    setAnnulationEnCours(true);
    try {
      await api.put(`/adherents/${adherentAAnnuler.adherent.id}`, { actif: false });
      setAdherentAAnnuler(null);
      charger();
    } finally {
      setAnnulationEnCours(false);
    }
  }

  async function reactiver(adherentId: number) {
    await api.put(`/adherents/${adherentId}`, { actif: true });
    charger();
  }

  const filtres = adherents.filter(({ adherent }) =>
    `${adherent.nom} ${adherent.prenom}`
      .toLowerCase()
      .includes(recherche.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold">Adhérents</h1>
          <p className="text-muted text-sm mt-1">
            {adherents.length} adhérent{adherents.length > 1 ? "s" : ""} enregistré
            {adherents.length > 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/familles"
            className="flex items-center gap-2 bg-card border border-border text-ink_text text-sm font-medium px-4 py-2.5 rounded-md hover:bg-surface transition-colors"
          >
            Familles
          </Link>
          <button
            onClick={() => setModalOuvert(true)}
            className="flex items-center gap-2 bg-ink text-white text-sm font-medium px-4 py-2.5 rounded-md hover:bg-ink-light transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nouvel adhérent
          </button>
        </div>
      </div>

      <div className="relative mb-4 max-w-sm">
        <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          placeholder="Rechercher un adhérent..."
          className="w-full pl-9 pr-3 py-2 border border-border rounded-md text-sm bg-card focus:outline-none focus:ring-2 focus:ring-gold/40"
        />
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs font-medium text-muted uppercase tracking-wide">
              <th className="px-4 py-3">Nom</th>
              <th className="px-4 py-3">Catégorie</th>
              <th className="px-4 py-3">Grade</th>
              <th className="px-4 py-3">Licence FFJ</th>
              <th className="px-4 py-3">Contact famille</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {chargement && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted">
                  Chargement...
                </td>
              </tr>
            )}
            {!chargement && filtres.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted">
                  Aucun adhérent trouvé.
                </td>
              </tr>
            )}
            {filtres.map(({ adherent, judoka, famille_nom, famille_telephone, famille_email }) => {
              const statut = judoka
                ? LABELS_LICENCE_STATUT[judoka.licence_statut]
                : null;
              return (
                <tr
                  key={adherent.id}
                  className={`border-b border-border last:border-0 hover:bg-surface transition-colors ${
                    !adherent.actif ? "opacity-50" : ""
                  }`}
                >
                  <td className="px-4 py-3 font-medium">
                    {adherent.nom} {adherent.prenom}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {judoka?.categorie_age
                      ? LABELS_CATEGORIE_AGE[judoka.categorie_age] ?? judoka.categorie_age
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {judoka?.grade_actuel
                      ? LABELS_GRADE[judoka.grade_actuel] ?? judoka.grade_actuel
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {statut && (
                      <span
                        className={`text-xs font-medium px-2 py-1 rounded-full ${statut.classe}`}
                      >
                        {statut.label}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {famille_nom ? (
                      <span>
                        {famille_nom}
                        {famille_email || famille_telephone
                          ? ` — ${famille_email || famille_telephone}`
                          : ""}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded-full ${
                        adherent.actif
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-border text-muted"
                      }`}
                    >
                      {adherent.actif ? "Actif" : "Inscription annulée"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {adherent.actif ? (
                      <button
                        onClick={() => setAdherentAAnnuler({ adherent, judoka, famille_nom, famille_telephone, famille_email })}
                        title="Annuler l'inscription"
                        className="text-muted hover:text-danger"
                      >
                        <UserX className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={() => reactiver(adherent.id)}
                        title="Réactiver l'inscription"
                        className="text-muted hover:text-emerald-700"
                      >
                        <UserCheck className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {modalOuvert && (
        <NouvelAdherentModal
          onClose={() => setModalOuvert(false)}
          onCreated={charger}
        />
      )}

      {adherentAAnnuler && (
        <ConfirmationSuppressionModal
          titre="Annuler l'inscription ?"
          message={`L'inscription de "${adherentAAnnuler.adherent.nom} ${adherentAAnnuler.adherent.prenom}" sera marquée comme annulée. Son historique (cours, compétitions, paiements) est conservé, et l'inscription pourra être réactivée à tout moment.`}
          libelleConfirmation="Annuler l'inscription"
          enCours={annulationEnCours}
          onConfirm={confirmerAnnulation}
          onClose={() => setAdherentAAnnuler(null)}
        />
      )}
    </div>
  );
}
