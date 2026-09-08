import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Users, Award, TrendingUp } from "lucide-react";
import { api } from "../lib/api";
import type { StatistiquesGlobales } from "../types";
import { LABELS_CATEGORIE_AGE, LABELS_GRADE, LABELS_LICENCE_STATUT } from "../lib/labels";

const COULEURS = ["#14213D", "#C9A15A", "#6B6B65", "#B3261E", "#1F3A63", "#DDC08A", "#0D1628"];

export function StatistiquesPage() {
  const [stats, setStats] = useState<StatistiquesGlobales | null>(null);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    async function charger() {
      const { data } = await api.get<StatistiquesGlobales>("/statistiques");
      setStats(data);
      setChargement(false);
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    charger();
  }, []);

  if (chargement) {
    return <p className="text-muted text-sm">Chargement...</p>;
  }

  if (!stats) {
    return <p className="text-muted text-sm">Impossible de charger les statistiques.</p>;
  }

  const dataPresence = stats.taux_presence_par_cours.map((c) => ({
    nom: c.cours_nom,
    taux: c.taux_pourcentage,
  }));

  const dataCategorieAge = stats.repartition_categorie_age.map((r) => ({
    name: LABELS_CATEGORIE_AGE[r.categorie] ?? r.categorie,
    value: r.effectif,
  }));

  const dataGrade = stats.repartition_grade.map((r) => ({
    name: LABELS_GRADE[r.grade] ?? r.grade,
    value: r.effectif,
  }));

  const dataLicence = stats.repartition_licence_statut.map((r) => ({
    name: LABELS_LICENCE_STATUT[r.statut]?.label ?? r.statut,
    value: r.effectif,
  }));

  const dataPodiums = stats.podiums_par_judoka.slice(0, 10).map((p) => ({
    nom: `${p.nom} ${p.prenom}`,
    "1ère place": p.premieres_places,
    "2ème place": p.deuxiemes_places,
    "3ème place": p.troisiemes_places,
  }));

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold mb-1">Statistiques</h1>
      <p className="text-muted text-sm mb-8">Vue d'ensemble du club</p>

      {/* Cartes résumé */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-card border border-border rounded-lg p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-gold/15 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5 text-gold-dark" />
          </div>
          <div>
            <p className="text-2xl font-display font-semibold">{stats.total_adherents_actifs}</p>
            <p className="text-sm text-muted">Adhérents actifs</p>
          </div>
        </div>
        <div className="bg-card border border-border rounded-lg p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-gold/15 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5 text-gold-dark" />
          </div>
          <div>
            <p className="text-2xl font-display font-semibold">{stats.total_judokas}</p>
            <p className="text-sm text-muted">Judokas licenciés</p>
          </div>
        </div>
        <div className="bg-card border border-border rounded-lg p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-gold/15 flex items-center justify-center shrink-0">
            <Award className="w-5 h-5 text-gold-dark" />
          </div>
          <div>
            <p className="text-2xl font-display font-semibold">
              {stats.podiums_par_judoka.reduce((acc, p) => acc + p.total_podiums, 0)}
            </p>
            <p className="text-sm text-muted">Podiums cumulés</p>
          </div>
        </div>
      </div>

      {/* Taux de présence par cours */}
      <div className="bg-card border border-border rounded-lg p-6 mb-6">
        <h2 className="font-display font-semibold text-base mb-4">
          Taux de présence par cours
        </h2>
        {dataPresence.length === 0 ? (
          <p className="text-sm text-muted">Aucune donnée de présence pour l'instant.</p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={dataPresence}>
              <XAxis dataKey="nom" tick={{ fontSize: 12 }} />
              <YAxis unit="%" tick={{ fontSize: 12 }} domain={[0, 100]} />
              <Tooltip formatter={(v) => `${v}%`} />
              <Bar dataKey="taux" fill="#14213D" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Podiums par judoka */}
      <div className="bg-card border border-border rounded-lg p-6 mb-6">
        <h2 className="font-display font-semibold text-base mb-4">
          Podiums par judoka (top 10)
        </h2>
        {dataPodiums.length === 0 ? (
          <p className="text-sm text-muted">Aucun résultat de compétition pour l'instant.</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dataPodiums} layout="vertical" margin={{ left: 20 }}>
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
              <YAxis dataKey="nom" type="category" width={120} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="1ère place" stackId="a" fill="#C9A15A" />
              <Bar dataKey="2ème place" stackId="a" fill="#6B6B65" />
              <Bar dataKey="3ème place" stackId="a" fill="#B3261E" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Répartitions en camemberts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="font-display font-semibold text-sm mb-4">Catégories d'âge</h2>
          {dataCategorieAge.length === 0 ? (
            <p className="text-sm text-muted">Aucune donnée.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={dataCategorieAge} dataKey="value" nameKey="name" outerRadius={80}>
                  {dataCategorieAge.map((_, i) => (
                    <Cell key={i} fill={COULEURS[i % COULEURS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="font-display font-semibold text-sm mb-4">Grades</h2>
          {dataGrade.length === 0 ? (
            <p className="text-sm text-muted">Aucune donnée.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={dataGrade} dataKey="value" nameKey="name" outerRadius={80}>
                  {dataGrade.map((_, i) => (
                    <Cell key={i} fill={COULEURS[i % COULEURS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="font-display font-semibold text-sm mb-4">Licences FFJ</h2>
          {dataLicence.length === 0 ? (
            <p className="text-sm text-muted">Aucune donnée.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={dataLicence} dataKey="value" nameKey="name" outerRadius={80}>
                  {dataLicence.map((_, i) => (
                    <Cell key={i} fill={COULEURS[i % COULEURS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
