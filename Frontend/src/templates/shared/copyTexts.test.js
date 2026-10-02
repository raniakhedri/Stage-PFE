import { describe, expect, it } from 'vitest'
import { copyFor } from './content'
import { applyTexts } from './copyTexts'

const base = copyFor('JEWELRY')

describe('applyTexts', () => {
  it('returns the sector copy when the merchant wrote nothing', () => {
    expect(applyTexts(base, undefined)).toBe(base)
    expect(applyTexts(base, {}).newTitle).toBe(base.newTitle)
  })

  it('replaces the hero of every template', () => {
    const copy = applyTexts(base, { heroTitle: 'Mon titre' })
    Object.values(copy.hero).forEach((hero) => expect(hero.title).toBe('Mon titre'))
    expect(copy.hero.luxury.text).toBe(base.hero.luxury.text)
  })

  it('keeps defaults for blank fields and trims text', () => {
    const copy = applyTexts(base, { newTitle: '   ', cta: '  Acheter  ' })
    expect(copy.newTitle).toBe(base.newTitle)
    expect(copy.cta).toBe('Acheter')
  })

  it('splits multi-line fields and stats', () => {
    const copy = applyTexts(base, { marquee: 'Un\n\nDeux\n', stats: '925 | argent\n18 ct | or' })
    expect(copy.marquee).toEqual(['Un', 'Deux'])
    expect(copy.stats).toEqual([['925', 'argent'], ['18 ct', 'or']])
  })

  it('overrides promises one by one', () => {
    const copy = applyTexts(base, { promises: [{}, { title: 'Retour gratuit' }] })
    expect(copy.promises[0]).toEqual(base.promises[0])
    expect(copy.promises[1].title).toBe('Retour gratuit')
    expect(copy.promises[1].icon).toBe(base.promises[1].icon)
  })
})
