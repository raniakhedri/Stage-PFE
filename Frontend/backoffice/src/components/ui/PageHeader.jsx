/**
 * PageHeader — en-tête standard pour toutes les pages du Back Office.
 *
 * Props:
 *   title    {string}   — titre de la page
 *   subtitle {string}   — sous-titre descriptif (optionnel)
 *   children {ReactNode} — boutons d'action alignés à droite
 */
export default function PageHeader({ title, subtitle, children }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 font-heading">{title}</h2>
        {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
      </div>
      {children && (
        <div className="flex items-center gap-3">
          {children}
        </div>
      )}
    </div>
  )
}

/**
 * PageHeader.SecondaryBtn — bouton secondaire standard (Importer / Exporter…)
 */
PageHeader.SecondaryBtn = function SecondaryBtn({ icon, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className="px-4 py-2.5 bg-slate-100 text-slate-700 font-semibold rounded-xl text-sm flex items-center gap-2 hover:bg-slate-200 transition-all border border-slate-200 font-button"
    >
      {icon && <span className="material-symbols-outlined text-lg">{icon}</span>}
      {children}
    </button>
  )
}

/**
 * PageHeader.PrimaryBtn — bouton primaire standard (Ajouter / Nouveau…)
 */
PageHeader.PrimaryBtn = function PrimaryBtn({ icon, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className="px-6 py-2.5 bg-btn text-white font-bold rounded-xl text-sm flex items-center gap-2 shadow-lg shadow-btn/20 hover:bg-btn-dark transition-all font-button"
    >
      {icon && <span className="material-symbols-outlined text-lg">{icon}</span>}
      {children}
    </button>
  )
}

/**
 * PageHeader.DangerBtn — bouton destructif (Supprimer…)
 */
PageHeader.DangerBtn = function DangerBtn({ icon, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className="px-4 py-2.5 border border-red-200 text-red-600 font-semibold rounded-xl text-sm flex items-center gap-2 hover:bg-red-50 transition-all font-button"
    >
      {icon && <span className="material-symbols-outlined text-lg">{icon}</span>}
      {children}
    </button>
  )
}
