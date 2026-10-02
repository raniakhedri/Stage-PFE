import { useMemo } from 'react'
import { useStore } from '../../context/StoreContext'
import { copyFor } from './content'
import { applyTexts } from './copyTexts'

/** Storefront copy of the current shop: sector defaults + the merchant's texts. */
export function useCopy() {
  const { businessType, settings } = useStore()
  return useMemo(() => applyTexts(copyFor(businessType), settings?.home?.texts), [businessType, settings])
}
