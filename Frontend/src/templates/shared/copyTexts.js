// Merges the merchant's texts (backoffice > Page d'accueil) into the sector copy. Pure: unit-tested.

const text = (value, fallback) => (typeof value === 'string' && value.trim() ? value.trim() : fallback)
const lines = (value, fallback) =>
  typeof value === 'string' && value.trim() ? value.split('\n').map((l) => l.trim()).filter(Boolean) : fallback

/**
 * Sector copy with the merchant's own texts on top (backoffice > Page d'accueil). An empty field keeps the
 * default text, so a merchant only writes what they want to change.
 */
export function applyTexts(base, t) {
  if (!t || typeof t !== 'object') return base
  const hero = Object.fromEntries(
    Object.entries(base.hero).map(([layout, h]) => [layout, {
      eyebrow: text(t.heroEyebrow, h.eyebrow),
      title: text(t.heroTitle, h.title),
      text: text(t.heroText, h.text),
    }]),
  )
  const promises = base.promises.map((p, i) => ({
    ...p,
    title: text(t.promises?.[i]?.title, p.title),
    text: text(t.promises?.[i]?.text, p.text),
  }))
  const stats = lines(t.stats, null)?.map((l) => {
    const [value, ...label] = l.split('|')
    return [value.trim(), label.join('|').trim()]
  }) || base.stats
  return {
    ...base,
    hero,
    promises,
    stats,
    cta: text(t.cta, base.cta),
    categoriesTitle: text(t.categoriesTitle, base.categoriesTitle),
    newTitle: text(t.newTitle, base.newTitle),
    bestTitle: text(t.bestTitle, base.bestTitle),
    recoTitle: text(t.recoTitle, ''),
    recoEyebrow: text(t.recoEyebrow, ''),
    editorial: {
      eyebrow: text(t.editorialEyebrow, base.editorial.eyebrow),
      title: text(t.editorialTitle, base.editorial.title),
      text: text(t.editorialText, base.editorial.text),
      cta: text(t.editorialCta, base.editorial.cta),
    },
    quote: text(t.quote, base.quote),
    statement: lines(t.statement, base.statement),
    marquee: lines(t.marquee, base.marquee),
    newsletter: {
      title: text(t.newsletterTitle, base.newsletter.title),
      text: text(t.newsletterText, base.newsletter.text),
    },
    footerBlurb: text(t.footerBlurb, base.footerBlurb),
    menuFeature: text(t.menuFeature, base.menuFeature),
  }
}
