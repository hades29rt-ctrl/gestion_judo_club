import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Save, Home, Users } from "lucide-react";
import { api } from "../lib/api";
import { LABELS_GRADE, LABELS_LICENCE_STATUT } from "../lib/labels";

interface AdherentFamille {
  id: number;
  nom: string;
  prenom: string;
  adresse: string | null;
  code_postal: string | null;
  ville: string | null;
  actif: boolean;
  grade_actuel: string | null;
  licence_statut: string | null;
}

interface Famille {
  id: number;
  nom_famille: string;
  telephone: string | null;
  email: string | null;
}

export function MonComptePage() {
  const [famille, setFamille] = useState<Famille | null>(null);
  const [adherents, setAdherents] = useState<AdherentFamille[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreurChargement, setErreurChargement] = useState<string | null>(null);

  const [telephone, setTelephone] = useState("");
  const [email, setEmail] = useState("");
  const [enregistrementFamille, setEnregistrementFamille] = useState(false);
  const [messageFamille, setMessageFamille] = useState<string | null>(null);

  const [adressesModifiees, setAdressesModifiees] = useState<Record<number, {
    adresse: string;
    code_postal: string;
    ville: string;
  }>>({});
  const [enregistrementAdherentId, setEnregistrementAdherentId] = useState<number | null>(null);

  async function charger() {
    setChargement(true);
    setErreurChargement(null);
    try {
      const { data } = await api.get("/moi/famille");
      setFamille(data.famille);
      setAdherents(data.adherents);
      setTelephone(data.famille.telephone ?? "");
      setEmail(data.famille.email ?? "");
      const init: typeof adressesModifiees = {};
      for (const a of data.adherents) {
        init[a.id] = {
          adresse: a.adresse ?? "",
          code_postal: a.code_postal ?? "",
          ville: a.ville ?? "",
        };
      }
      setAdressesModifiees(init);
    } catch (err: any) {
      setErreurChargement(
        err?.response?.data?.detail ||
          "Impossible de charger les informations de ta famille."
      );
    } finally {
      setChargement(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    charger();
  }, []);

  async function enregistrerFamille(e: FormEvent) {
    e.preventDefault();
    setEnregistrementFamille(true);
    setMessageFamille(null);
    try {
      await api.put("/moi/famille", {
        telephone: telephone || null,
        email: email || null,
      });
      setMessageFamille("Coordonnées enregistrées.");
    } finally {
      setEnregistrementFamille(false);
    }
  }

  async function enregistrerAdresse(adherentId: number) {
    setEnregistrementAdherentId(adherentId);
    try {
      const valeurs = adressesModifiees[adherentId];
      await api.put(
        `/moi/adherents/${adherentId}`,
        null,
        {
          params: {
            adresse: valeurs.adresse || undefined,
            code_postal: valeurs.code_postal || undefined,
            ville: valeurs.ville || undefined,
          },
        }
      );
      charger();
    } finally {
      setEnregistrementAdherentId(null);
    }
  }

  if (chargement) {
    return <p className="text-muted text-sm">Chargement...</p>;
  }

  if (erreurChargement) {
    return (
      <div className="border border-dashed border-border rounded-lg p-16 flex flex-col items-center justify-center text-center bg-card">
        <p className="font-medium text-ink_text">Compte non relié</p>
        <p className="text-sm text-muted mt-1">{erreurChargement}</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold mb-1">Mon compte</h1>
      <p className="text-muted text-sm mb-8">
        Coordonnées de la famille et adresse de tes enfants inscrits.
      </p>

      <div className="bg-card border border-border rounded-lg p-6 mb-6 max-w-lg">
        <div className="flex items-center gap-2 mb-4">
          <Home className="w-4 h-4 text-gold-dark" />
          <h2 className="font-display font-semibold text-base">
            Famille {famille?.nom_famille}
          </h2>
        </div>

        <form onSubmit={enregistrerFamille} className="space-y-4">
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

          {messageFamille && (
            <p className="text-sm text-emerald-700">{messageFamille}</p>
          )}

          <button
            type="submit"
            disabled={enregistrementFamille}
            className="flex items-center gap-2 bg-ink text-white text-sm font-medium px-4 py-2.5 rounded-md hover:bg-ink-light transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {enregistrementFamille ? "Enregistrement..." : "Enregistrer"}
          </button>
        </form>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <Users className="w-4 h-4 text-gold-dark" />
        <h2 className="font-display font-semibold text-base">Mes enfants inscrits</h2>
      </div>

      <div className="space-y-4">
        {adherents.map((a) => {
          const valeurs = adressesModifiees[a.id] ?? { adresse: "", code_postal: "", ville: "" };
          return (
            <div key={a.id} className="bg-card border border-border rounded-lg p-6 max-w-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium">
                  {a.nom} {a.prenom}
                </h3>
                <div className="flex gap-2">
                  {a.grade_actuel && (
                    <span className="text-xs font-medium bg-gold/15 text-gold-dark px-2 py-1 rounded-full">
                      {LABELS_GRADE[a.grade_actuel] ?? a.grade_actuel}
                    </span>
                  )}
                  {a.licence_statut && (
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded-full ${
                        LABELS_LICENCE_STATUT[a.licence_statut]?.classe ?? ""
                      }`}
                    >
                      {LABELS_LICENCE_STATUT[a.licence_statut]?.label ?? a.licence_statut}
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Adresse</label>
                  <input
                    value={valeurs.adresse}
                    onChange={(e) =>
                      setAdressesModifiees((prev) => ({
                        ...prev,
                        [a.id]: { ...valeurs, adresse: e.target.value },
                      }))
                    }
                    className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gold/40"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Code postal</label>
                    <input
                      value={valeurs.code_postal}
                      onChange={(e) =>
                        setAdressesModifiees((prev) => ({
                          ...prev,
                          [a.id]: { ...valeurs, code_postal: e.target.value },
                        }))
                      }
                      className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gold/40"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Ville</label>
                    <input
                      value={valeurs.ville}
                      onChange={(e) =>
                        setAdressesModifiees((prev) => ({
                          ...prev,
                          [a.id]: { ...valeurs, ville: e.target.value },
                        }))
                      }
                      className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gold/40"
                    />
                  </div>
                </div>

                <button
                  onClick={() => enregistrerAdresse(a.id)}
                  disabled={enregistrementAdherentId === a.id}
                  className="flex items-center gap-2 bg-ink text-white text-sm font-medium px-4 py-2.5 rounded-md hover:bg-ink-light transition-colors disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {enregistrementAdherentId === a.id ? "Enregistrement..." : "Enregistrer"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
