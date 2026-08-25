import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { X } from "lucide-react";
import { api } from "../lib/api";
import type { AdherentJudoka } from "../types";

interface Props {
  coursId: number;
  onClose: () => void;
  onCreated: () => void;
}

const SAISON_PAR_DEFAUT = "2025-2026";

export function InscrireJudokaModal({ coursId, onClose, onCreated }: Props) {
  const [adherents, setAdherents] = useState<AdherentJudoka[]>([]);
  const [judokaId, setJudokaId] = useState("");
  const [saison, setSaison] = useState(SAISON_PAR_DEFAUT);
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);

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
      await api.post(`/cours/${coursId}/inscriptions`, {
        judoka_id: Number(judokaId),
        cours_id: coursId,
        saison,
      });
      onCreated();
      onClose();
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      setErreur(detail || "Impossible d'inscrire ce judoka.");
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-ink/40 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-display font-semibold text-lg">Inscrire un judoka</h2>
          <button onClick={onClose} className="text-muted hover:text-ink_text">
            <X className="w-5 h-5" />
          </button>
        </div>

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
            <label className="block text-sm font-medium mb-1.5">Saison</label>
            <input
              value={saison}
              onChange={(e) => setSaison(e.target.value)}
              placeholder="2025-2026"
              className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gold/40"
              required
            />
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
              {envoi ? "Inscription..." : "Inscrire"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
