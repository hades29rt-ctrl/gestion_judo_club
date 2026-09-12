import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { X, Plus } from "lucide-react";
import { api } from "../lib/api";
import { GRADES_VALIDES, LABELS_GRADE } from "../lib/labels";
import type { Famille, FamilleAvecEffectif } from "../types";
import { NouvelleFamilleModal } from "./NouvelleFamilleModal";

interface Props {
  onClose: () => void;
  onCreated: () => void;
}

export function NouvelAdherentModal({ onClose, onCreated }: Props) {
  const [familles, setFamilles] = useState<FamilleAvecEffectif[]>([]);
  const [familleId, setFamilleId] = useState("");
  const [modalNouvelleFamille, setModalNouvelleFamille] = useState(false);

  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [dateNaissance, setDateNaissance] = useState("");
  const [sexe, setSexe] = useState<"M" | "F">("M");
  const [gradeActuel, setGradeActuel] = useState("blanche");
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);

  async function chargerFamilles() {
    const { data } = await api.get<FamilleAvecEffectif[]>("/familles");
    setFamilles(data);
  }

  useEffect(() => {
    chargerFamilles();
  }, []);

  function familleCreee(famille: Famille) {
    chargerFamilles();
    setFamilleId(String(famille.id));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!familleId) {
      setErreur("Sélectionnez ou créez une famille.");
      return;
    }
    setErreur(null);
    setEnvoi(true);
    try {
      await api.post("/adherents", {
        adherent: {
          nom,
          prenom,
          famille_id: Number(familleId),
        },
        judoka: {
          date_naissance: dateNaissance,
          sexe,
          grade_actuel: gradeActuel,
        },
      });
      onCreated();
      onClose();
    } catch {
      setErreur("Impossible de créer l'adhérent. Vérifiez les champs saisis.");
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-ink/40 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-display font-semibold text-lg">Nouvel adhérent</h2>
          <button onClick={onClose} className="text-muted hover:text-ink_text">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Famille</label>
            <div className="flex gap-2">
              <select
                value={familleId}
                onChange={(e) => setFamilleId(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gold/40"
                required
              >
                <option value="">Sélectionner...</option>
                {familles.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.nom_famille} ({f.nombre_adherents} adhérent{f.nombre_adherents > 1 ? "s" : ""})
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setModalNouvelleFamille(true)}
                title="Créer une nouvelle famille"
                className="shrink-0 px-3 py-2 border border-border rounded-md text-muted hover:text-ink_text hover:bg-surface"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1.5">Nom</label>
              <input
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gold/40"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Prénom</label>
              <input
                value={prenom}
                onChange={(e) => setPrenom(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gold/40"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Date de naissance
              </label>
              <input
                type="date"
                value={dateNaissance}
                onChange={(e) => setDateNaissance(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gold/40"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Sexe</label>
              <select
                value={sexe}
                onChange={(e) => setSexe(e.target.value as "M" | "F")}
                className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gold/40"
              >
                <option value="M">Masculin</option>
                <option value="F">Féminin</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Grade</label>
            <select
              value={gradeActuel}
              onChange={(e) => setGradeActuel(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gold/40"
            >
              {GRADES_VALIDES.map((g) => (
                <option key={g} value={g}>
                  {LABELS_GRADE[g]}
                </option>
              ))}
            </select>
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
              {envoi ? "Création..." : "Créer"}
            </button>
          </div>
        </form>
      </div>

      {modalNouvelleFamille && (
        <NouvelleFamilleModal
          onClose={() => setModalNouvelleFamille(false)}
          onSaved={familleCreee}
        />
      )}
    </div>
  );
}
