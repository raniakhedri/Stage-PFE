// Sections of each template's home page, in their default order (same registry in the backoffice:
// backoffice/src/data/homeSections.js). The merchant can hide and reorder them; "selection" is a
// product block they compose themselves and is available in every template.

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
const OFF_BY_DEFAULT = new Set(['selection'])

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
