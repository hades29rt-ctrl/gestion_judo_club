import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Swords } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export function LoginPage() {
  const [identifiant, setIdentifiant] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [code2FA, setCode2FA] = useState("");
  const [tokenTemporaire, setTokenTemporaire] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);
  const { login, verifier2FA } = useAuth();
  const navigate = useNavigate();

  async function handleSubmitIdentifiants(e: FormEvent) {
    e.preventDefault();
    setErreur(null);
    setChargement(true);
    try {
      const resultat = await login(identifiant, motDePasse);
      if (resultat.totpRequis && resultat.tokenTemporaire) {
        setTokenTemporaire(resultat.tokenTemporaire);
      } else {
        navigate("/adherents");
      }
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      setErreur(detail || "Identifiant ou mot de passe incorrect.");
    } finally {
      setChargement(false);
    }
  }

  async function handleSubmit2FA(e: FormEvent) {
    e.preventDefault();
    if (!tokenTemporaire) return;
    setErreur(null);
    setChargement(true);
    try {
      await verifier2FA(tokenTemporaire, code2FA);
      navigate("/adherents");
    } catch {
      setErreur("Code de vérification incorrect.");
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
          <p className="text-white/50 text-sm mt-1">
            {tokenTemporaire ? "Vérification en deux étapes" : "Connexion à l'espace club"}
          </p>
        </div>

        {!tokenTemporaire ? (
          <form
            onSubmit={handleSubmitIdentifiants}
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
              {chargement ? "Connexion..." : "Se connecter"}
            </button>

            <p className="text-center text-sm text-muted pt-1">
              Pas encore de compte ?{" "}
              <Link to="/register" className="text-ink font-medium hover:underline">
                S'inscrire
              </Link>
            </p>
          </form>
        ) : (
          <form
            onSubmit={handleSubmit2FA}
            className="bg-white rounded-lg p-6 shadow-xl space-y-4"
          >
            <p className="text-sm text-muted">
              Ouvre ton application d'authentification (Google Authenticator,
              Authy...) et saisis le code à 6 chiffres affiché.
            </p>

            <div>
              <label className="block text-sm font-medium text-ink_text mb-1.5">
                Code de vérification
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={code2FA}
                onChange={(e) => setCode2FA(e.target.value.replace(/\D/g, ""))}
                className="w-full px-3 py-2 border border-border rounded-md text-sm text-center font-mono text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold"
                autoFocus
                required
              />
            </div>

            {erreur && <p className="text-sm text-danger">{erreur}</p>}

            <button
              type="submit"
              disabled={chargement || code2FA.length !== 6}
              className="w-full bg-ink text-white text-sm font-medium py-2.5 rounded-md hover:bg-ink-light transition-colors disabled:opacity-50"
            >
              {chargement ? "Vérification..." : "Valider"}
            </button>

            <button
              type="button"
              onClick={() => {
                setTokenTemporaire(null);
                setCode2FA("");
                setErreur(null);
              }}
              className="w-full text-center text-sm text-muted hover:text-ink_text"
            >
              Retour
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
