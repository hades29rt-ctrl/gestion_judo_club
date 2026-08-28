import { useState } from "react";
import type { FormEvent } from "react";
import { ShieldCheck, ShieldOff } from "lucide-react";
import { api } from "../lib/api";

export function SecuritePage() {
  const [etape, setEtape] = useState<"repos" | "scan" | "actif">("repos");
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);

  async function demarrerActivation() {
    setErreur(null);
    setChargement(true);
    try {
      const { data } = await api.post("/auth/2fa/activer");
      setQrCode(data.qr_code_base64);
      setSecret(data.secret);
      setEtape("scan");
    } catch {
      setErreur("Impossible de démarrer l'activation du 2FA.");
    } finally {
      setChargement(false);
    }
  }

  async function confirmerActivation(e: FormEvent) {
    e.preventDefault();
    setErreur(null);
    setChargement(true);
    try {
      await api.post("/auth/2fa/confirmer", { code });
      setEtape("actif");
    } catch {
      setErreur("Code incorrect, réessaie.");
    } finally {
      setChargement(false);
    }
  }

  async function desactiver() {
    setChargement(true);
    try {
      await api.post("/auth/2fa/desactiver");
      setEtape("repos");
      setQrCode(null);
      setSecret(null);
      setCode("");
    } finally {
      setChargement(false);
    }
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold mb-1">Sécurité</h1>
      <p className="text-muted text-sm mb-8">
        Protège ton compte avec une double authentification (2FA).
      </p>

      <div className="bg-card border border-border rounded-lg p-6 max-w-lg">
        {etape === "repos" && (
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-border flex items-center justify-center shrink-0">
              <ShieldOff className="w-5 h-5 text-muted" />
            </div>
            <div className="flex-1">
              <h2 className="font-medium mb-1">2FA non activé</h2>
              <p className="text-sm text-muted mb-4">
                Ajoute une couche de sécurité supplémentaire : un code à 6
                chiffres généré par une application (Google Authenticator,
                Authy...) sera demandé à chaque connexion.
              </p>
              <button
                onClick={demarrerActivation}
                disabled={chargement}
                className="bg-ink text-white text-sm font-medium px-4 py-2.5 rounded-md hover:bg-ink-light transition-colors disabled:opacity-50"
              >
                {chargement ? "Chargement..." : "Activer le 2FA"}
              </button>
            </div>
          </div>
        )}

        {etape === "scan" && qrCode && (
          <div>
            <h2 className="font-medium mb-3">
              Scanne ce QR code avec ton application d'authentification
            </h2>
            <div className="flex justify-center mb-4">
              <img
                src={`data:image/png;base64,${qrCode}`}
                alt="QR code 2FA"
                className="w-48 h-48 border border-border rounded-md"
              />
            </div>
            {secret && (
              <p className="text-xs text-muted text-center mb-4 font-mono break-all">
                Ou saisis ce code manuellement : {secret}
              </p>
            )}

            <form onSubmit={confirmerActivation} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Code affiché par l'application
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  className="w-full px-3 py-2 border border-border rounded-md text-sm text-center font-mono text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-gold/40"
                  autoFocus
                  required
                />
              </div>

              {erreur && <p className="text-sm text-danger">{erreur}</p>}

              <button
                type="submit"
                disabled={chargement || code.length !== 6}
                className="w-full bg-ink text-white text-sm font-medium py-2.5 rounded-md hover:bg-ink-light transition-colors disabled:opacity-50"
              >
                {chargement ? "Vérification..." : "Confirmer l'activation"}
              </button>
            </form>
          </div>
        )}

        {etape === "actif" && (
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-emerald-700" />
            </div>
            <div className="flex-1">
              <h2 className="font-medium mb-1">2FA activé</h2>
              <p className="text-sm text-muted mb-4">
                Un code à 6 chiffres te sera désormais demandé à chaque
                connexion.
              </p>
              <button
                onClick={desactiver}
                disabled={chargement}
                className="text-sm font-medium text-danger hover:underline disabled:opacity-50"
              >
                {chargement ? "Désactivation..." : "Désactiver le 2FA"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
