import { useEffect, useState } from "react";
import { Download, ExternalLink } from "lucide-react";
import { api } from "../lib/api";
import type { Licence } from "../types";
import { LABELS_LICENCE_STATUT } from "../lib/labels";

const STATUTS: { value: string; label: string }[] = [
  { value: "non_transmise", label: "Non transmise" },
  { value: "en_attente", label: "En attente" },
  { value: "transmise", label: "Transmise" },
  { value: "validee", label: "Validée" },
  { value: "expiree", label: "Expirée" },
];

export function LicencesPage() {
  const [licences, setLicences] = useState<Licence[]>([]);
  const [chargement, setChargement] = useState(true);
  const [enregistrementId, setEnregistrementId] = useState<number | null>(null);

  async function charger() {
    setChargement(true);
    const { data } = await api.get<Licence[]>("/licences");
    setLicences(data);
    setChargement(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    charger();
  }, []);

  async function changerStatut(judokaId: number, statut: string) {
    setEnregistrementId(judokaId);
    const licence = licences.find((l) => l.judoka_id === judokaId);
    try {
      await api.put(`/licences/${judokaId}`, {
        numero_licence_ffj: licence?.numero_licence_ffj ?? null,
        licence_saison: licence?.licence_saison ?? null,
        licence_statut: statut,
      });
      setLicences((prev) =>
        prev.map((l) =>
          l.judoka_id === judokaId ? { ...l, licence_statut: statut } : l
        )
      );
    } finally {
      setEnregistrementId(null);
    }
  }

  function telechargerExport() {
    const token = localStorage.getItem("gestion_judo_token");
    const url = `${api.defaults.baseURL}/licences/export.csv`;
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.blob())
      .then((blob) => {
        const link = document.createElement("a");
        link.href = window.URL.createObjectURL(blob);
        link.download = "licences_ffj.csv";
        link.click();
      });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold">Licences FFJ</h1>
          <p className="text-muted text-sm mt-1">
            Suivi interne des licences — export prêt pour la saisie manuelle sur
            l'extranet fédéral (aucune API officielle FFJDA disponible).
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <a
            href="https://moncompte.ffjudo.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-card border border-border text-ink_text text-sm font-medium px-4 py-2.5 rounded-md hover:bg-surface transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Extranet FFJ
          </a>
          <button
            onClick={telechargerExport}
            className="flex items-center gap-2 bg-ink text-white text-sm font-medium px-4 py-2.5 rounded-md hover:bg-ink-light transition-colors"
          >
            <Download className="w-4 h-4" />
            Exporter en CSV
          </button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs font-medium text-muted uppercase tracking-wide">
              <th className="px-4 py-3">Judoka</th>
              <th className="px-4 py-3">N° licence</th>
              <th className="px-4 py-3">Saison</th>
              <th className="px-4 py-3">Statut</th>
            </tr>
          </thead>
          <tbody>
            {chargement && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted">
                  Chargement...
                </td>
              </tr>
            )}
            {!chargement && licences.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted">
                  Aucun judoka enregistré.
                </td>
              </tr>
            )}
            {licences.map((l) => {
              const statut = LABELS_LICENCE_STATUT[l.licence_statut];
              return (
                <tr
                  key={l.judoka_id}
                  className="border-b border-border last:border-0"
                >
                  <td className="px-4 py-3 font-medium">
                    {l.adherent_nom} {l.adherent_prenom}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {l.numero_licence_ffj || "—"}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {l.licence_saison || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={l.licence_statut}
                      onChange={(e) => changerStatut(l.judoka_id, e.target.value)}
                      disabled={enregistrementId === l.judoka_id}
                      className={`text-xs font-medium px-2 py-1.5 rounded-md border-0 focus:outline-none focus:ring-2 focus:ring-gold/40 ${
                        statut?.classe ?? ""
                      }`}
                    >
                      {STATUTS.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
