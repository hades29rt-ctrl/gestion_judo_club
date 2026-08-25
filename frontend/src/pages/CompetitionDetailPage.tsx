import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { api } from "../lib/api";
import type { Competition, Resultat } from "../types";
import { AjouterResultatModal } from "../components/AjouterResultatModal";

export function CompetitionDetailPage() {
  const { competitionId } = useParams();
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [resultats, setResultats] = useState<Resultat[]>([]);
  const [chargement, setChargement] = useState(true);
  const [modalResultat, setModalResultat] = useState(false);

  async function charger() {
    setChargement(true);
    const [{ data: comp }, { data: res }] = await Promise.all([
      api.get<Competition>(`/competitions/${competitionId}`),
      api.get<Resultat[]>(`/competitions/${competitionId}/resultats`),
    ]);
    setCompetition(comp);
    setResultats(res);
    setChargement(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    charger();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [competitionId]);

  async function supprimerResultat(resultatId: number) {
    await api.delete(`/competitions/${competitionId}/resultats/${resultatId}`);
    charger();
  }

  return (
    <div>
      <Link
        to="/competitions"
        className="flex items-center gap-1.5 text-sm text-muted hover:text-ink_text mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour aux compétitions
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold">
            {competition?.nom ?? "..."}
          </h1>
          {competition && (
            <p className="text-muted text-sm mt-1">
              {new Date(competition.date_debut).toLocaleDateString("fr-FR")}
              {competition.lieu && ` — ${competition.lieu}`}
            </p>
          )}
        </div>
        <button
          onClick={() => setModalResultat(true)}
          className="flex items-center gap-2 bg-ink text-white text-sm font-medium px-4 py-2.5 rounded-md hover:bg-ink-light transition-colors"
        >
          <Plus className="w-4 h-4" />
          Ajouter un résultat
        </button>
      </div>

      {chargement && <p className="text-muted text-sm">Chargement...</p>}

      {!chargement && resultats.length === 0 && (
        <div className="border border-dashed border-border rounded-lg p-16 flex flex-col items-center justify-center text-center bg-card">
          <p className="font-medium text-ink_text">Aucun résultat enregistré</p>
          <p className="text-sm text-muted mt-1">
            Ajoute le premier résultat avec le bouton ci-dessus.
          </p>
        </div>
      )}

      {!chargement && resultats.length > 0 && (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs font-medium text-muted uppercase tracking-wide">
                <th className="px-4 py-3">Judoka</th>
                <th className="px-4 py-3">Catégorie</th>
                <th className="px-4 py-3">Rang</th>
                <th className="px-4 py-3">V / D</th>
                <th className="px-4 py-3 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {resultats.map((r) => (
                <tr key={r.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium">
                    {r.judoka_nom} {r.judoka_prenom}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {r.categorie_poids || "—"}
                  </td>
                  <td className="px-4 py-3">
                    {r.rang ? (
                      <span className="text-xs font-medium bg-gold/15 text-gold-dark px-2 py-1 rounded-full">
                        {r.rang}
                        {r.rang === 1 ? "er" : "e"}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">
                    {r.victoires} / {r.defaites}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => supprimerResultat(r.id)}
                      className="text-muted hover:text-danger"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalResultat && competitionId && (
        <AjouterResultatModal
          competitionId={Number(competitionId)}
          onClose={() => setModalResultat(false)}
          onCreated={charger}
        />
      )}
    </div>
  );
}
