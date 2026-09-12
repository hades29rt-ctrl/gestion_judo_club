import { useState } from "react";
import type { FormEvent } from "react";
import { X } from "lucide-react";
import { api } from "../lib/api";
import type { Famille } from "../types";

interface Props {
  familleExistante?: Famille;
  onClose: () => void;
  onSaved: (famille: Famille) => void;
}

export function NouvelleFamilleModal({ familleExistante, onClose, onSaved }: Props) {
  const modeEdition = familleExistante !== undefined;

  const [nomFamille, setNomFamille] = useState(familleExistante?.nom_famille ?? "");
  const [telephone, setTelephone] = useState(familleExistante?.telephone ?? "");
  const [email, setEmail] = useState(familleExistante?.email ?? "");
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErreur(null);
    setEnvoi(true);
    const payload = {
      nom_famille: nomFamille,
      telephone: telephone || null,
      email: email || null,
    };
    try {
      const { data } = modeEdition
        ? await api.put<Famille>(`/familles/${familleExistante!.id}`, payload)
        : await api.post<Famille>("/familles", payload);
      onSaved(data);
      onClose();
    } catch {
      setErreur("Impossible d'enregistrer la famille. Vérifiez les champs saisis.");
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-ink/40 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-display font-semibold text-lg">
            {modeEdition ? "Modifier la famille" : "Nouvelle famille"}
          </h2>
          <button onClick={onClose} className="text-muted hover:text-ink_text">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Nom de famille</label>
            <input
              value={nomFamille}
              onChange={(e) => setNomFamille(e.target.value)}
              placeholder="ex : Durand"
              className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gold/40"
              autoFocus
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Téléphone</label>
            <input
              value={telephone}
              onChange={(e) => setTelephone(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gold/40"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
