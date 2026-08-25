import { useEffect, useState } from "react";
import { Mail, Users } from "lucide-react";
import { api } from "../lib/api";
import type { Cours, Inscription } from "../types";
import { LABELS_JOUR_SEMAINE } from "../lib/labels";

const SAISON_PAR_DEFAUT = "2025-2026";

export function CommunicationPage() {
  const [cours, setCours] = useState<Cours[]>([]);
  const [chargement, setChargement] = useState(true);
  const [comptesEmails, setComptesEmails] = useState<Record<number, number>>({});

  useEffect(() => {
    async function charger() {
      setChargement(true);
      const { data } = await api.get<Cours[]>("/cours");
      setCours(data);

      // Pré-calcule le nombre de destinataires uniques par cours (aperçu avant envoi).
      const comptes: Record<number, number> = {};
      await Promise.all(
        data.map(async (c) => {
          const { data: inscrits } = await api.get<Inscription[]>(
            `/cours/${c.id}/inscriptions`,
            { params: { saison: SAISON_PAR_DEFAUT } }
          );
          const emails = new Set(
            inscrits.map((i) => i.judoka_email).filter((e): e is string => !!e)
          );
          comptes[c.id] = emails.size;
        })
      );
      setComptesEmails(comptes);
      setChargement(false);
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    charger();
  }, []);

  async function envoyerMessage(coursId: number, nomCours: string) {
    const { data: inscrits } = await api.get<Inscription[]>(
      `/cours/${coursId}/inscriptions`,
      { params: { saison: SAISON_PAR_DEFAUT } }
    );

    // Déduplique les emails (ex : plusieurs enfants d'une même famille dans
    // le même cours) pour éviter d'envoyer le même message plusieurs fois
    // au même destinataire.
    const emailsUniques = Array.from(
      new Set(inscrits.map((i) => i.judoka_email).filter((e): e is string => !!e))
    );

    if (emailsUniques.length === 0) {
      alert("Aucun email disponible pour les inscrits de ce cours.");
      return;
    }

    const sujet = encodeURIComponent(`[Club Judo] ${nomCours}`);
    const corps = encodeURIComponent("Bonjour,\n\n\n\nCordialement,\nLe club");
    const bcc = emailsUniques.join(",");

    window.open(`mailto:?bcc=${bcc}&subject=${sujet}&body=${corps}`, "_self");
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold mb-1">Communication</h1>
      <p className="text-muted text-sm mb-8">
        Envoie un message groupé aux familles d'un cours — ouvre ton client mail
        habituel, destinataires en copie cachée, sans doublon.
      </p>

      {chargement && <p className="text-muted text-sm">Chargement...</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cours.map((c) => (
          <div
            key={c.id}
            className="bg-card border border-border rounded-lg p-5 flex flex-col"
          >
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-display font-semibold text-base">{c.nom}</h3>
              {c.jour_semaine && (
                <span className="text-xs font-medium bg-gold/15 text-gold-dark px-2 py-1 rounded-full">
                  {LABELS_JOUR_SEMAINE[c.jour_semaine]}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 text-sm text-muted mb-4">
              <Users className="w-3.5 h-3.5" />
              {comptesEmails[c.id] ?? 0} destinataire
              {(comptesEmails[c.id] ?? 0) > 1 ? "s" : ""}
            </div>

            <button
              onClick={() => envoyerMessage(c.id, c.nom)}
              disabled={(comptesEmails[c.id] ?? 0) === 0}
              className="flex items-center justify-center gap-2 bg-ink text-white text-sm font-medium px-4 py-2.5 rounded-md hover:bg-ink-light transition-colors mt-auto disabled:opacity-40"
            >
              <Mail className="w-4 h-4" />
              Envoyer un message
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
