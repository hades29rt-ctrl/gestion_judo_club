import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { X } from "lucide-react";
import { api } from "../lib/api";
import type { AdherentJudoka, PaiementInitie } from "../types";

interface Props {
  onClose: () => void;
  onCreated: () => void;
}

export function NouveauPaiementModal({ onClose, onCreated }: Props) {
  const [adherents, setAdherents] = useState<AdherentJudoka[]>([]);
  const [judokaId, setJudokaId] = useState("");
  const [type, setType] = useState("cotisation");
  const [libelle, setLibelle] = useState("");
  const [montant, setMontant] = useState("");
  const [saison, setSaison] = useState("2025-2026");
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);
  const [lienGenere, setLienGenere] = useState<string | null>(null);

  useEffect(() => {
    api.get<AdherentJudoka[]>("/adherents").then(({ data }) => {
      setAdherents(data.filter((a) => a.judoka !== null));
    });
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!judokaId) {
      setErreur("Sélectionnez un judoka.");
      return;
    }
    setErreur(null);
    setEnvoi(true);
    try {
      const { data } = await api.post<PaiementInitie>("/paiements", {
        judoka_id: Number(judokaId),
        type,
        libelle,
        montant_centimes: Math.round(Number(montant) * 100),
        saison: saison || null,
      });
      setLienGenere(data.redirect_url);
      onCreated();
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      setErreur(
        detail ||
          "Impossible de générer le paiement. Vérifie que les identifiants HelloAsso sont configurés côté serveur."
      );
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-ink/40 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-display font-semibold text-lg">
            {lienGenere ? "Lien de paiement généré" : "Nouveau paiement"}
          </h2>
          <button onClick={onClose} className="text-muted hover:text-ink_text">
            <X className="w-5 h-5" />
          </button>
        </div>

        {lienGenere ? (
          <div className="p-6 space-y-4">
            <p className="text-sm text-muted">
              Partage ce lien avec l'adhérent pour qu'il procède au paiement en
              ligne sécurisé via HelloAsso.
            </p>
            <a
              href={lienGenere}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center bg-ink text-white text-sm font-medium py-2.5 rounded-md hover:bg-ink-light transition-colors"
            >
              Ouvrir la page de paiement
            </a>
            <button
              onClick={() => navigator.clipboard.writeText(lienGenere)}
              className="block w-full text-center border border-border text-sm font-medium py-2.5 rounded-md hover:bg-surface transition-colors"
            >
              Copier le lien
            </button>
            <button
              onClick={onClose}
              className="block w-full text-center text-sm font-medium text-muted hover:text-ink_text pt-1"
            >
              Fermer
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Judoka</label>
              <select
                value={judokaId}
                onChange={(e) => setJudokaId(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gold/40"
                required
              >
                <option value="">Sélectionner...</option>
                {adherents.map(({ adherent, judoka }) => (
                  <option key={judoka!.id} value={judoka!.id}>
                    {adherent.nom} {adherent.prenom}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gold/40"
              >
                <option value="cotisation">Cotisation</option>
                <option value="stage">Stage</option>
                <option value="tournoi">Tournoi</option>
                <option value="autre">Autre</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Libellé</label>
              <input
                value={libelle}
                onChange={(e) => setLibelle(e.target.value)}
                placeholder="ex : Cotisation 2025-2026"
                className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gold/40"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Montant (€)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={montant}
                  onChange={(e) => setMontant(e.target.value)}
                  placeholder="ex : 120"
                  className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gold/40"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Saison</label>
                <input
                  value={saison}
                  onChange={(e) => setSaison(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gold/40"
                />
              </div>
            </div>

            {erreur && <p className="text-sm text-danger">{erreur}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-muted hover:text-ink_text"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={envoi}
                className="px-4 py-2 bg-ink text-white text-sm font-medium rounded-md hover:bg-ink-light disabled:opacity-50"
              >
                {envoi ? "Génération..." : "Générer le lien de paiement"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
