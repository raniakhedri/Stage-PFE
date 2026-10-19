import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import CategoryStorefrontPreview from './CategoryStorefrontPreview'

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
    expect(screen.getByText('Huiles')).toBeInTheDocument()
    expect(screen.getByText('Livraison gratuite dès 49 TND d\'achat')).toBeInTheDocument()
  })

  it('uses a fallback name when the field is blank', () => {
    render(<CategoryStorefrontPreview nom="   " visMenu type="Principale" />)
    expect(screen.getByText('Catégorie')).toBeInTheDocument()
  })
})
