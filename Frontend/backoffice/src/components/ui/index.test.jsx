import { describe, it, expect } from 'vitest'
import * as ui from './index'

describe('ui index', () => {
  it('re-exports the shared controls', () => {
    expect(ui.Button).toBeTypeOf('function')
    expect(ui.Card).toBeTypeOf('function')
    expect(ui.Badge).toBeTypeOf('function')
    expect(ui.Spinner).toBeTypeOf('function')
    expect(ui.CustomSelect).toBeTypeOf('function')
    expect(ui.KpiCard).toBeTypeOf('function')
    expect(ui.PageHeader).toBeTypeOf('function')
  })
})
