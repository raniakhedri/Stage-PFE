import { describe, expect, it } from 'vitest'
import { TEMPLATE_SECTIONS, sectionOrder } from './sectionRegistry'

describe('sectionOrder', () => {
  it('uses the template order, without the custom selection, when nothing is saved', () => {
    expect(sectionOrder('minimal')).toEqual(TEMPLATE_SECTIONS.minimal.filter((id) => id !== 'selection'))
  })

  it('keeps the merchant order and hides disabled sections', () => {
    const order = sectionOrder('minimal', [{ id: 'newsletter', enabled: true }, { id: 'hero', enabled: true }, { id: 'categories', enabled: false }])
    expect(order.slice(0, 2)).toEqual(['newsletter', 'hero'])
    expect(order).not.toContain('categories')
    expect(order).toContain('products')
  })

  it('shows the selection once enabled', () => {
    expect(sectionOrder('sport', [{ id: 'selection', enabled: true }])[0]).toBe('selection')
  })

  it('ignores sections the template does not have (after a template change)', () => {
    const order = sectionOrder('tech', [{ id: 'marquee', enabled: true }, { id: 'hero', enabled: true }])
    expect(order).not.toContain('marquee')
    expect(order[0]).toBe('hero')
  })

  it('falls back to minimal for an unknown template', () => {
    expect(sectionOrder('nope')).toEqual(sectionOrder('minimal'))
  })

  it('every template starts with its hero and offers the custom selection', () => {
    Object.values(TEMPLATE_SECTIONS).forEach((list) => {
      expect(list[0]).toBe('hero')
      expect(list).toContain('selection')
      expect(new Set(list).size).toBe(list.length)
    })
  })
})
