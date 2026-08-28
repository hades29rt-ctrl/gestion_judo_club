import { NavLink } from "react-router-dom";
import { Users, BarChart3, LogOut, Swords, CalendarDays, IdCard, Trophy, CreditCard, Mail, ShieldCheck, UserCog } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const NAV_ITEMS = [
  { to: "/adherents", label: "Adhérents", icon: Users },
  { to: "/cours", label: "Cours", icon: CalendarDays },
  { to: "/competitions", label: "Compétitions", icon: Trophy },
  { to: "/licences", label: "Licences FFJ", icon: IdCard },
  { to: "/paiements", label: "Paiements", icon: CreditCard },
  { to: "/communication", label: "Message", icon: Mail },
  { to: "/statistiques", label: "Statistiques", icon: BarChart3 },
  { to: "/securite", label: "Sécurité", icon: ShieldCheck },
];

export function Sidebar() {
  const { utilisateur, logout } = useAuth();

  const items = [...NAV_ITEMS];
  if (utilisateur?.role === "admin") {
    items.push({ to: "/utilisateurs", label: "Utilisateurs", icon: UserCog });
  }

  return (
    <aside className="w-64 shrink-0 bg-ink text-white flex flex-col h-screen sticky top-0">
      <div className="flex items-center gap-2 px-6 py-6">
        <Swords className="w-6 h-6 text-gold" strokeWidth={2} />
        <span className="font-display font-semibold text-lg tracking-tight">
          Gestion Judo
        </span>
      </div>

      <nav className="flex-1 px-3 mt-4 space-y-1">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors border-l-2 ${
                isActive
                  ? "bg-white/5 border-gold text-white"
                  : "border-transparent text-white/70 hover:text-white hover:bg-white/5"
              }`
            }
          >
            <Icon className="w-4 h-4" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-white/10">
        {utilisateur && (
          <div className="px-3 mb-2 text-xs text-white/50 font-mono">
            {utilisateur.nom || utilisateur.identifiant}
          </div>
        )}
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-md text-sm font-medium text-white/70 hover:text-white hover:bg-white/5 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Déconnexion
        </button>
      </div>
    </aside>
  );
}
