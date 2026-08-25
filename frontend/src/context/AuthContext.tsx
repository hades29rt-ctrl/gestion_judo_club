import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";
import { api } from "../lib/api";

interface Utilisateur {
  id: number;
  identifiant: string;
  nom: string | null;
  role: string;
}

interface AuthContextValue {
  utilisateur: Utilisateur | null;
  isAuthenticated: boolean;
  login: (identifiant: string, mot_de_passe: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [utilisateur, setUtilisateur] = useState<Utilisateur | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!localStorage.getItem("gestion_judo_token")
  );

  async function login(identifiant: string, mot_de_passe: string) {
    const response = await api.post("/auth/login", { identifiant, mot_de_passe });
    const { access_token } = response.data;
    localStorage.setItem("gestion_judo_token", access_token);
    setIsAuthenticated(true);

    const me = await api.get("/auth/me");
    setUtilisateur(me.data);
  }

  function logout() {
    localStorage.removeItem("gestion_judo_token");
    setUtilisateur(null);
    setIsAuthenticated(false);
  }

  return (
    <AuthContext.Provider value={{ utilisateur, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit être utilisé dans un AuthProvider");
  return ctx;
}
