import { BarChart3 } from "lucide-react";

export function StatistiquesPage() {
  return (
    <div>
      <h1 className="font-display text-2xl font-semibold mb-1">Statistiques</h1>
      <p className="text-muted text-sm mb-8">
        Vue d'ensemble du club — les graphiques arriveront ici au fur et à mesure
        des modules (présences, résultats, licences...).
      </p>

      <div className="border border-dashed border-border rounded-lg p-16 flex flex-col items-center justify-center text-center bg-card">
        <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center mb-4">
          <BarChart3 className="w-6 h-6 text-gold-dark" />
        </div>
        <p className="font-medium text-ink_text">Aucune statistique pour le moment</p>
        <p className="text-sm text-muted mt-1 max-w-sm">
          Cette page accueillera les graphiques de présence, de résultats et de
          suivi des licences une fois les modules correspondants construits.
        </p>
      </div>
    </div>
  );
}
