import { useState } from "react";
import type { FormEvent } from "react";
import { X } from "lucide-react";
import { api } from "../lib/api";
import type { Cours } from "../types";

interface Props {
  coursExistant?: Cours;
  onClose: () => void;
  onSaved: () => void;
}

export function NouveauCoursModal({ coursExistant, onClose, onSaved }: Props) {
  const modeEdition = coursExistant !== undefined;

  const [nom, setNom] = useState(coursExistant?.nom ?? "");
  const [professeur, setProfesseur] = useState(coursExistant?.professeur ?? "");
  const [jourSemaine, setJourSemaine] = useState(
    coursExistant?.jour_semaine ? String(coursExistant.jour_semaine) : "1"
  );
  const [heureDebut, setHeureDebut] = useState(
    coursExistant?.heure_debut?.slice(0, 5) ?? "18:00"
  );
  const [heureFin, setHeureFin] = useState(
    coursExistant?.heure_fin?.slice(0, 5) ?? "19:00"
  );
  const [lieu, setLieu] = useState(coursExistant?.lieu ?? "");
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErreur(null);
    setEnvoi(true);
    const payload = {
      nom,
      professeur: professeur || null,
      jour_semaine: Number(jourSemaine),
      heure_debut: heureDebut,
      heure_fin: heureFin,
      lieu: lieu || null,
    };
    try {
      if (modeEdition) {
        await api.put(`/cours/${coursExistant!.id}`, payload);
      } else {
        await api.post("/cours", payload);
      }
      onSaved();
      onClose();
    } catch {
      setErreur(
        modeEdition
          ? "Impossible de modifier le cours. Vérifiez les champs saisis."
          : "Impossible de créer le cours. Vérifiez les champs saisis."
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
            {modeEdition ? "Modifier le cours" : "Nouveau cours"}
          </h2>
          <button onClick={onClose} className="text-muted hover:text-ink_text">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Nom du créneau</label>
            <input
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder="ex : Ados - Mardi 18h"
              className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gold/40"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Professeur</label>
            <input
              value={professeur}
              onChange={(e) => setProfesseur(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gold/40"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Jour</label>
            <select
              value={jourSemaine}
              onChange={(e) => setJourSemaine(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gold/40"
            >
              <option value="1">Lundi</option>
              <option value="2">Mardi</option>
              <option value="3">Mercredi</option>
              <option value="4">Jeudi</option>
              <option value="5">Vendredi</option>
              <option value="6">Samedi</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1.5">Heure de début</label>
              <input
                type="time"
                value={heureDebut}
                onChange={(e) => setHeureDebut(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gold/40"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Heure de fin</label>
              <input
                type="time"
                value={heureFin}
                onChange={(e) => setHeureFin(e.target.value)}
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
              {envoi
                ? modeEdition
                  ? "Enregistrement..."
                  : "Création..."
                : modeEdition
                  ? "Enregistrer"
                  : "Créer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
