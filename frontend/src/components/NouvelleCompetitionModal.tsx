import { useState } from "react";
import type { FormEvent } from "react";
import { X } from "lucide-react";
import { api } from "../lib/api";
import type { Competition } from "../types";

interface Props {
  competitionExistante?: Competition;
  onClose: () => void;
  onSaved: () => void;
}

export function NouvelleCompetitionModal({
  competitionExistante,
  onClose,
  onSaved,
}: Props) {
  const modeEdition = competitionExistante !== undefined;

  const [nom, setNom] = useState(competitionExistante?.nom ?? "");
  const [type, setType] = useState(competitionExistante?.type ?? "tournoi");
  const [dateDebut, setDateDebut] = useState(competitionExistante?.date_debut ?? "");
  const [dateFin, setDateFin] = useState(competitionExistante?.date_fin ?? "");
  const [lieu, setLieu] = useState(competitionExistante?.lieu ?? "");
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErreur(null);
    setEnvoi(true);
    const payload = {
      nom,
      type,
      date_debut: dateDebut,
      date_fin: dateFin || null,
      lieu: lieu || null,
    };
    try {
      if (modeEdition) {
        await api.put(`/competitions/${competitionExistante!.id}`, payload);
      } else {
        await api.post("/competitions", payload);
      }
      onSaved();
      onClose();
    } catch {
      setErreur("Impossible d'enregistrer la compétition. Vérifiez les champs saisis.");
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-ink/40 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-display font-semibold text-lg">
            {modeEdition ? "Modifier la compétition" : "Nouvelle compétition"}
          </h2>
          <button onClick={onClose} className="text-muted hover:text-ink_text">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Nom</label>
            <input
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder="ex : Tournoi de printemps"
              className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gold/40"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as Competition["type"])}
              className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gold/40"
            >
              <option value="tournoi">Tournoi</option>
              <option value="stage">Stage</option>
              <option value="competition_officielle">Compétition officielle</option>
              <option value="animation">Animation</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1.5">Date de début</label>
              <input
                type="date"
                value={dateDebut}
                onChange={(e) => setDateDebut(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gold/40"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Date de fin</label>
              <input
                type="date"
                value={dateFin}
                onChange={(e) => setDateFin(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gold/40"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Lieu</label>
            <input
              value={lieu}
              onChange={(e) => setLieu(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gold/40"
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
              {envoi ? "Enregistrement..." : modeEdition ? "Enregistrer" : "Créer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
