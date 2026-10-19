import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import CategoryStorefrontPreview from './CategoryStorefrontPreview'

function menuBar() {
  return within(screen.getByText('NaturEssence').parentElement)
}

describe('CategoryStorefrontPreview', () => {
  it('inserts the current category into the menu at the chosen position', () => {
    render(
      <CategoryStorefrontPreview
        nom="Huiles"
        slug="huiles"
        type="Principale"
        visMenu
        menuPosition={1}
        currentId={9}
        allCats={[
          { id: 1, nom: 'Soins', visMenu: true, menuPosition: 1 },
          { id: 2, nom: 'Corps', parentId: 1, menuPosition: 1 },
        ]}
      />,
    )
    expect(screen.getByText('Aperçu Front Office')).toBeInTheDocument()
    expect(menuBar().getAllByText(/Huiles|Soins/).map((el) => el.textContent)).toEqual(['Huiles', 'Soins'])
    expect(screen.getAllByText('Huiles')).toHaveLength(2)
    expect(screen.getByText('Livraison gratuite dès 49 TND d\'achat')).toBeInTheDocument()
  })

  it('uses a fallback name when the field is blank', () => {
    render(<CategoryStorefrontPreview nom="   " visMenu type="Principale" />)
    expect(menuBar().getByText('Catégorie')).toBeInTheDocument()
    expect(screen.getAllByText('Catégorie')).toHaveLength(2)
  })
})
