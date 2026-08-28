import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";
import { api } from "../lib/api";

interface Utilisateur {
  id: number;
  identifiant: string;
  nom: string | null;
  role: string;
}

interface LoginResult {
  totpRequis: boolean;
  tokenTemporaire?: string;
}

interface AuthContextValue {
  utilisateur: Utilisateur | null;
  isAuthenticated: boolean;
  login: (identifiant: string, mot_de_passe: string) => Promise<LoginResult>;
  verifier2FA: (tokenTemporaire: string, code: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [utilisateur, setUtilisateur] = useState<Utilisateur | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!localStorage.getItem("gestion_judo_token")
  );

  async function chargerProfil() {
    const me = await api.get("/auth/me");
    setUtilisateur(me.data);
  }

  async function login(identifiant: string, mot_de_passe: string): Promise<LoginResult> {
    const response = await api.post("/auth/login", { identifiant, mot_de_passe });
    const { totp_requis, token_temporaire, access_token } = response.data;

    if (totp_requis) {
      return { totpRequis: true, tokenTemporaire: token_temporaire };
    }

    localStorage.setItem("gestion_judo_token", access_token);
    setIsAuthenticated(true);
    await chargerProfil();
    return { totpRequis: false };
  }

  async function verifier2FA(tokenTemporaire: string, code: string) {
    const response = await api.post("/auth/login/2fa", {
      token_temporaire: tokenTemporaire,
      code,
    });
    localStorage.setItem("gestion_judo_token", response.data.access_token);
    setIsAuthenticated(true);
    await chargerProfil();
  }

  function logout() {
    localStorage.removeItem("gestion_judo_token");
    setUtilisateur(null);
    setIsAuthenticated(false);
  }

  return (
    <AuthContext.Provider
      value={{ utilisateur, isAuthenticated, login, verifier2FA, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit être utilisé dans un AuthProvider");
  return ctx;
}
