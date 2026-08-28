import { useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { Swords } from "lucide-react";
import { api } from "../lib/api";

export function RegisterPage() {
  const [identifiant, setIdentifiant] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [nom, setNom] = useState("");
  const [role, setRole] = useState("lecture_seule");
  const [erreur, setErreur] = useState<string | null>(null);
  const [succes, setSucces] = useState(false);
  const [chargement, setChargement] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErreur(null);
    setChargement(true);
    try {
      await api.post("/auth/register", {
        identifiant,
        mot_de_passe: motDePasse,
        nom: nom || null,
        role,
      });
      setSucces(true);
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      setErreur(detail || "Impossible de créer le compte.");
    } finally {
      setChargement(false);
    }
  }

  return (
    <div className="w-screen h-screen flex items-center justify-center bg-ink">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center mb-4">
            <Swords className="w-6 h-6 text-gold" />
          </div>
          <h1 className="font-display text-2xl font-semibold text-white">
            Gestion Judo
          </h1>
          <p className="text-white/50 text-sm mt-1">Créer un compte</p>
        </div>

        {succes ? (
          <div className="bg-white rounded-lg p-6 shadow-xl text-center space-y-4">
            <p className="text-sm text-ink_text">
              Ton compte a été créé. Un administrateur du club doit maintenant
              l'activer avant que tu puisses te connecter.
            </p>
            <Link
              to="/login"
              className="block w-full bg-ink text-white text-sm font-medium py-2.5 rounded-md hover:bg-ink-light transition-colors"
            >
              Retour à la connexion
            </Link>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-lg p-6 shadow-xl space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-ink_text mb-1.5">
                Identifiant
              </label>
              <input
                type="text"
                value={identifiant}
                onChange={(e) => setIdentifiant(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold"
                autoFocus
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ink_text mb-1.5">
                Nom affiché
              </label>
              <input
                type="text"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ink_text mb-1.5">
                Rôle souhaité
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold"
              >
                <option value="professeur">Professeur</option>
                <option value="secretaire">Secrétaire</option>
                <option value="lecture_seule">Lecture seule</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink_text mb-1.5">
                Mot de passe
              </label>
              <input
                type="password"
                value={motDePasse}
                onChange={(e) => setMotDePasse(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold"
                required
              />
            </div>

            {erreur && <p className="text-sm text-danger">{erreur}</p>}

            <button
              type="submit"
              disabled={chargement}
              className="w-full bg-ink text-white text-sm font-medium py-2.5 rounded-md hover:bg-ink-light transition-colors disabled:opacity-50"
            >
              {chargement ? "Création..." : "Créer le compte"}
            </button>

            <p className="text-center text-sm text-muted pt-1">
              Déjà un compte ?{" "}
              <Link to="/login" className="text-ink font-medium hover:underline">
                Se connecter
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
