// Same registry as the storefront (Frontend/src/templates/shared/sectionRegistry.js). Keep both files in sync.


export const TEMPLATE_SECTIONS = {
  minimal: ['hero', 'categories', 'products', 'selection', 'recommendations', 'editorial', 'promises', 'newsletter'],
  bold: ['hero', 'marquee', 'categories', 'products', 'selection', 'recommendations', 'statement', 'bestsellers', 'promises', 'newsletter'],
  editorial: ['hero', 'categories', 'products', 'selection', 'recommendations', 'editorial', 'newsletter'],
  luxury: ['hero', 'statement', 'categories', 'products', 'selection', 'recommendations', 'editorial', 'bestsellers', 'promises', 'newsletter'],
  artisan: ['hero', 'categories', 'products', 'selection', 'recommendations', 'editorial', 'promises', 'newsletter'],
  pop: ['hero', 'categories', 'products', 'selection', 'recommendations', 'statement', 'promises', 'newsletter'],
  sport: ['hero', 'categories', 'marquee', 'products', 'selection', 'recommendations', 'statement', 'promises', 'newsletter'],
  tech: ['hero', 'categories', 'products', 'selection', 'recommendations', 'promises', 'newsletter'],
}

/** Shown only once the merchant turns them on. */
export const OFF_BY_DEFAULT = new Set(['selection'])

/**
 * Section ids to render, in order. Saved entries come first (unknown ids dropped), then the template's
 * other sections in their default order, so a template change never loses a section.
 */
export function sectionOrder(layout, saved) {
  const available = TEMPLATE_SECTIONS[layout] || TEMPLATE_SECTIONS.minimal
  const list = Array.isArray(saved) ? saved.filter((s) => s && available.includes(s.id)) : []
  const seen = new Set(list.map((s) => s.id))
  const merged = [...list, ...available.filter((id) => !seen.has(id)).map((id) => ({ id, enabled: !OFF_BY_DEFAULT.has(id) }))]
  return merged.filter((s) => s.enabled !== false).map((s) => s.id)
}

/** Editable state: every section of the template with its visibility, in the saved order. */
export function sectionList(layout, saved) {
  const available = TEMPLATE_SECTIONS[layout] || TEMPLATE_SECTIONS.minimal
  const list = Array.isArray(saved) ? saved.filter((s) => s && available.includes(s.id)) : []
  const seen = new Set(list.map((s) => s.id))
  return [...list.map((s) => ({ id: s.id, enabled: s.enabled !== false })),
    ...available.filter((id) => !seen.has(id)).map((id) => ({ id, enabled: !OFF_BY_DEFAULT.has(id) }))]
}

/** What each section is, and which texts the merchant can change in it. */
export const SECTION_INFO = {
  hero: { label: 'Bannière principale', icon: 'view_carousel', help: 'Image ou vidéo : gérées dans Bannières. Ces textes s’affichent quand aucune bannière n’en a.', texts: [['heroEyebrow', 'Sur-titre'], ['heroTitle', 'Titre', 'long'], ['heroText', 'Texte', 'area'], ['cta', 'Bouton']] },
  marquee: { label: 'Bandeau défilant', icon: 'text_rotation_none', texts: [['marquee', 'Mots du bandeau (un par ligne)', 'area']] },
  categories: { label: 'Catégories', icon: 'category', help: 'Les catégories cochées « Page d’accueil » dans Catégories.', texts: [['categoriesTitle', 'Titre']] },
  products: { label: 'Produits mis en avant', icon: 'grid_view', help: 'Les nouveautés, ou votre choix (ci-dessous).', texts: [['newTitle', 'Titre']] },
  bestsellers: { label: 'Seconde sélection', icon: 'workspace_premium', texts: [['bestTitle', 'Titre']] },
  selection: { label: 'Sélection personnalisée', icon: 'playlist_add_check', help: 'Un bloc de produits choisis par vous, avec son propre titre.' },
  recommendations: { label: 'Recommandé pour vous (IA)', icon: 'auto_awesome', help: 'Produits recommandés à chaque visiteur selon son comportement.', texts: [['recoEyebrow', 'Sur-titre'], ['recoTitle', 'Titre']] },
  statement: { label: 'Manifeste / citation', icon: 'format_quote', texts: [['statement', 'Grand texte (une ligne par ligne affichée)', 'area'], ['quote', 'Citation', 'long']] },
  editorial: { label: 'Bloc éditorial', icon: 'article', texts: [['editorialEyebrow', 'Sur-titre'], ['editorialTitle', 'Titre', 'long'], ['editorialText', 'Texte', 'area'], ['editorialCta', 'Lien'], ['quote', 'Citation', 'long']] },
  promises: { label: 'Engagements', icon: 'verified', texts: [], promises: true },
  newsletter: { label: 'Newsletter', icon: 'mail', texts: [['newsletterTitle', 'Titre'], ['newsletterText', 'Texte', 'long']] },
}
