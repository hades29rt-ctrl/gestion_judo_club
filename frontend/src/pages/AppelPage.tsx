import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Check, X as XIcon, Save } from "lucide-react";
import { api } from "../lib/api";
import type { Inscription, Presence } from "../types";

const SAISON_PAR_DEFAUT = "2025-2026";

export function AppelPage() {
  const { coursId } = useParams();
  const [inscriptions, setInscriptions] = useState<Inscription[]>([]);
  const [presencesParJudoka, setPresencesParJudoka] = useState<Record<number, boolean>>({});
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [chargement, setChargement] = useState(true);
  const [enregistrement, setEnregistrement] = useState(false);
  const [messageSucces, setMessageSucces] = useState(false);

  async function charger() {
    setChargement(true);
    const { data: inscrits } = await api.get<Inscription[]>(
      `/cours/${coursId}/inscriptions`,
      { params: { saison: SAISON_PAR_DEFAUT } }
    );
    setInscriptions(inscrits);

    try {
      const { data: appelExistant } = await api.get<Presence[]>(
        `/cours/${coursId}/appel`,
        { params: { date_seance: date } }
      );
      const map: Record<number, boolean> = {};
      appelExistant.forEach((p) => {
        map[p.judoka_id] = p.present;
      });
      setPresencesParJudoka(map);
    } catch {
      setPresencesParJudoka({});
    }

    setChargement(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    charger();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coursId, date]);

  function togglePresence(judokaId: number, present: boolean) {
    setPresencesParJudoka((prev) => ({ ...prev, [judokaId]: present }));
    setMessageSucces(false);
  }

  async function enregistrerAppel() {
    setEnregistrement(true);
    try {
      await api.post(`/cours/${coursId}/appel`, {
        cours_id: Number(coursId),
        date_seance: date,
        presences: inscriptions.map((i) => ({
          judoka_id: i.judoka_id,
          present: presencesParJudoka[i.judoka_id] ?? false,
        })),
      });
      setMessageSucces(true);
    } finally {
      setEnregistrement(false);
    }
  }

  return (
    <div>
      <Link
        to="/cours"
        className="flex items-center gap-1.5 text-sm text-muted hover:text-ink_text mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour aux cours
      </Link>

      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-semibold">Appel numérique</h1>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="px-3 py-2 border border-border rounded-md text-sm bg-card focus:outline-none focus:ring-2 focus:ring-gold/40"
        />
      </div>

      {chargement && <p className="text-muted text-sm">Chargement...</p>}

      {!chargement && inscriptions.length === 0 && (
        <div className="border border-dashed border-border rounded-lg p-16 flex flex-col items-center justify-center text-center bg-card">
          <p className="font-medium text-ink_text">Aucun judoka inscrit à ce cours</p>
          <p className="text-sm text-muted mt-1">
            Inscris des judokas depuis la page Cours avant de faire l'appel.
          </p>
        </div>
      )}

      {!chargement && inscriptions.length > 0 && (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs font-medium text-muted uppercase tracking-wide">
                <th className="px-4 py-3">Judoka</th>
                <th className="px-4 py-3 w-40">Présence</th>
              </tr>
            </thead>
            <tbody>
              {inscriptions.map((i) => {
                const present = presencesParJudoka[i.judoka_id];
                return (
                  <tr
                    key={i.id}
                    className="border-b border-border last:border-0"
                  >
                    <td className="px-4 py-3 font-medium">
                      {i.judoka_nom} {i.judoka_prenom}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => togglePresence(i.judoka_id, true)}
                          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                            present === true
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-surface text-muted hover:bg-border"
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                          Présent
                        </button>
                        <button
                          onClick={() => togglePresence(i.judoka_id, false)}
                          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                            present === false
                              ? "bg-danger/10 text-danger"
                              : "bg-surface text-muted hover:bg-border"
                          }`}
                        >
                          <XIcon className="w-3.5 h-3.5" />
                          Absent
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-surface">
            {messageSucces ? (
              <p className="text-sm text-emerald-700 font-medium">
                Appel enregistré avec succès.
              </p>
            ) : (
              <span />
            )}
            <button
              onClick={enregistrerAppel}
              disabled={enregistrement}
              className="flex items-center gap-2 bg-ink text-white text-sm font-medium px-4 py-2.5 rounded-md hover:bg-ink-light transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {enregistrement ? "Enregistrement..." : "Enregistrer l'appel"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
