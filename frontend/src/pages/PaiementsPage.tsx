import { useEffect, useState } from "react";
import { Plus, RefreshCw } from "lucide-react";
import { api } from "../lib/api";
import type { Paiement } from "../types";
import { LABELS_TYPE_PAIEMENT, LABELS_STATUT_PAIEMENT } from "../lib/labels";
import { NouveauPaiementModal } from "../components/NouveauPaiementModal";

function formaterMontant(centimes: number) {
  return (centimes / 100).toLocaleString("fr-FR", {
    style: "currency",
    currency: "EUR",
  });
}

export function PaiementsPage() {
  const [paiements, setPaiements] = useState<Paiement[]>([]);
  const [chargement, setChargement] = useState(true);
  const [modalNouveau, setModalNouveau] = useState(false);
  const [verificationId, setVerificationId] = useState<number | null>(null);

  async function charger() {
    setChargement(true);
    const { data } = await api.get<Paiement[]>("/paiements");
    setPaiements(data);
    setChargement(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    charger();
  }, []);

  async function verifierStatut(id: number) {
    setVerificationId(id);
    try {
      await api.post(`/paiements/${id}/verifier`);
      charger();
    } finally {
      setVerificationId(null);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold">Paiements</h1>
          <p className="text-muted text-sm mt-1">
            Cotisations et inscriptions payées en ligne via HelloAsso
          </p>
        </div>
        <button
          onClick={() => setModalNouveau(true)}
          className="flex items-center gap-2 bg-ink text-white text-sm font-medium px-4 py-2.5 rounded-md hover:bg-ink-light transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nouveau paiement
        </button>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs font-medium text-muted uppercase tracking-wide">
              <th className="px-4 py-3">Judoka</th>
              <th className="px-4 py-3">Libellé</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Montant</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {chargement && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted">
                  Chargement...
                </td>
              </tr>
            )}
            {!chargement && paiements.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted">
                  Aucun paiement enregistré.
                </td>
              </tr>
            )}
            {paiements.map((p) => {
              const statut = LABELS_STATUT_PAIEMENT[p.statut];
              return (
                <tr key={p.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium">
                    {p.judoka_nom} {p.judoka_prenom}
                  </td>
                  <td className="px-4 py-3 text-muted">{p.libelle}</td>
                  <td className="px-4 py-3 text-muted">
                    {LABELS_TYPE_PAIEMENT[p.type]}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">
                    {formaterMontant(p.montant_centimes)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded-full ${statut?.classe ?? ""}`}
                    >
                      {statut?.label ?? p.statut}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {p.statut === "en_attente" && (
                      <button
                        onClick={() => verifierStatut(p.id)}
                        disabled={verificationId === p.id}
                        title="Vérifier le statut auprès de HelloAsso"
                        className="text-muted hover:text-ink_text disabled:opacity-50"
                      >
                        <RefreshCw
                          className={`w-4 h-4 ${verificationId === p.id ? "animate-spin" : ""}`}
                        />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {modalNouveau && (
        <NouveauPaiementModal
          onClose={() => setModalNouveau(false)}
          onCreated={charger}
        />
      )}
    </div>
  );
}
