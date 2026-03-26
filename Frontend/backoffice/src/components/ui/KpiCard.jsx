/**
 * KpiCard — composant réutilisable pour les cartes de statistiques en haut de page.
 *
 * Props:
 *   label      {string}  — libellé affiché en petit uppercase
 *   value      {string|number} — valeur principale (grande)
 *   sub        {string}  — sous-texte (ex: "+12.5%", "Attention")
 *   subColor   {string}  — classe Tailwind de couleur du sous-texte (ex: "text-brand")
 *   icon       {string}  — nom Material Symbol
 *   iconBg     {string}  — classes Tailwind pour le fond + couleur de l'icône (ex: "bg-brand/10 text-brand")
 */
export default function KpiCard({ label, value, sub, subColor = 'text-slate-400', icon, iconBg = 'bg-slate-50 text-slate-400', progress, progressColor = 'bg-slate-300' }) {
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">{label}</span>
        <div className={`p-2 rounded-lg ${iconBg}`}>
          <span className="material-symbols-outlined">{icon}</span>
        </div>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold text-slate-900">{value}</span>
        {sub && <span className={`text-[10px] font-bold ${subColor}`}>{sub}</span>}
      </div>
      {progress != null && (
        <div className="mt-4 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${progressColor}`} style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} />
        </div>
      )}
    </div>
  )
}
