import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { X } from "lucide-react";
import { api } from "../lib/api";
import type { AdherentJudoka, Paiement, PaiementInitie } from "../types";

interface Props {
  paiementExistant?: Paiement;
  onClose: () => void;
  onCreated: () => void;
}

const LABELS_MODE: Record<string, string> = {
  helloasso: "HelloAsso (en ligne)",
  cheque: "Chèque",
  especes: "Espèces",
  virement: "Virement",
};

export function NouveauPaiementModal({ paiementExistant, onClose, onCreated }: Props) {
  const modeEdition = paiementExistant !== undefined;

  const [adherents, setAdherents] = useState<AdherentJudoka[]>([]);
  const [judokaId, setJudokaId] = useState(
    paiementExistant ? String(paiementExistant.judoka_id) : ""
  );
  const [type, setType] = useState(paiementExistant?.type ?? "cotisation");
  const [libelle, setLibelle] = useState(paiementExistant?.libelle ?? "");
  const [montant, setMontant] = useState(
    paiementExistant ? String(paiementExistant.montant_centimes / 100) : ""
  );
  const [reduction, setReduction] = useState(
    paiementExistant ? String(paiementExistant.reduction_centimes / 100) : "0"
  );
  const [modePaiement, setModePaiement] = useState(paiementExistant?.mode_paiement ?? "helloasso");
  const [saison, setSaison] = useState(paiementExistant?.saison ?? "2025-2026");
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);
  const [lienGenere, setLienGenere] = useState<string | null>(null);
  const [creeSansLien, setCreeSansLien] = useState(false);

  useEffect(() => {
    if (!modeEdition) {
      api.get<AdherentJudoka[]>("/adherents").then(({ data }) => {
        setAdherents(data.filter((a) => a.judoka !== null));
      });
    }
  }, [modeEdition]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!modeEdition && !judokaId) {
      setErreur("Sélectionnez un judoka.");
      return;
    }
    setErreur(null);
    setEnvoi(true);
    try {
      if (modeEdition) {
        await api.put(`/paiements/${paiementExistant!.id}`, {
          type,
          libelle,
          montant_centimes: Math.round(Number(montant) * 100),
          reduction_centimes: Math.round(Number(reduction) * 100),
          saison: saison || null,
        });
        onCreated();
        onClose();
        return;
      }

      const { data } = await api.post<PaiementInitie>("/paiements", {
        judoka_id: Number(judokaId),
        type,
        libelle,
        montant_centimes: Math.round(Number(montant) * 100),
        reduction_centimes: Math.round(Number(reduction) * 100),
        mode_paiement: modePaiement,
        saison: saison || null,
      });
      onCreated();
      if (data.redirect_url) {
        setLienGenere(data.redirect_url);
      } else {
        setCreeSansLien(true);
      }
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      setErreur(
        detail ||
          "Impossible d'enregistrer le paiement. Vérifie les champs saisis."
      );
    } finally {
      setEnvoi(false);
    }
  }

  const affichageResultat = lienGenere !== null || creeSansLien;

  return (
    <div className="fixed inset-0 bg-ink/40 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-display font-semibold text-lg">
            {affichageResultat
              ? "Paiement enregistré"
              : modeEdition
                ? "Modifier le paiement"
                : "Nouveau paiement"}
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
        ) : creeSansLien ? (
          <div className="p-6 space-y-4">
            <p className="text-sm text-muted">
              Le paiement a été enregistré en attente. Une fois le règlement
              physiquement reçu par le club, valide-le depuis la liste des
              paiements.
            </p>
            <button
              onClick={onClose}
              className="block w-full text-center bg-ink text-white text-sm font-medium py-2.5 rounded-md hover:bg-ink-light transition-colors"
            >
              Fermer
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {!modeEdition && (
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
            )}

            <div className="grid grid-cols-2 gap-3">
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
              {modeEdition ? (
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Mode de paiement
                  </label>
                  <div className="px-3 py-2 border border-border rounded-md text-sm text-muted bg-surface">
                    {LABELS_MODE[modePaiement] ?? modePaiement}
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Mode de paiement
                  </label>
                  <select
                    value={modePaiement}
                    onChange={(e) => setModePaiement(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gold/40"
                  >
                    {Object.entries(LABELS_MODE).map(([valeur, label]) => (
                      <option key={valeur} value={valeur}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
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

            <div className="grid grid-cols-3 gap-3">
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
                  placeholder="ex : 150"
                  className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gold/40"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Réduction (€)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={reduction}
                  onChange={(e) => setReduction(e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gold/40"
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
                {envoi
                  ? "Enregistrement..."
                  : modeEdition
                    ? "Enregistrer les modifications"
                    : modePaiement === "helloasso"
                      ? "Générer le lien de paiement"
                      : "Enregistrer le paiement"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
