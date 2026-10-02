import { describe, expect, it } from 'vitest'
import { SECTION_INFO, TEMPLATE_SECTIONS, sectionList } from './homeSections'
import { copyFor } from './storefrontCopy'
import { TEMPLATE_SECTIONS as STOREFRONT_SECTIONS } from '../../../src/templates/shared/sectionRegistry'
import { copyFor as storefrontCopyFor } from '../../../src/templates/shared/content'

const SECTORS = ['CLOTHES', 'COSMETICS', 'SPORTS', 'ELECTRONICS', 'HOME', 'FOOD', 'JEWELRY', 'KIDS']

describe('home page editor', () => {
  it('uses exactly the storefront registry and default texts', () => {
    expect(TEMPLATE_SECTIONS).toEqual(STOREFRONT_SECTIONS)
    SECTORS.forEach((sector) => expect(copyFor(sector)).toEqual(storefrontCopyFor(sector)))
  })

  it('describes every section a template can show', () => {
    Object.values(TEMPLATE_SECTIONS).flat().forEach((id) => expect(SECTION_INFO[id], id).toBeTruthy())
  })

  it('lists every section with its visibility, saved ones first', () => {
    const list = sectionList('bold', [{ id: 'promises', enabled: false }])
    expect(list[0]).toEqual({ id: 'promises', enabled: false })
    expect(list).toHaveLength(TEMPLATE_SECTIONS.bold.length)
    expect(list.find((s) => s.id === 'selection').enabled).toBe(false)
    expect(list.find((s) => s.id === 'hero').enabled).toBe(true)
  })
})
