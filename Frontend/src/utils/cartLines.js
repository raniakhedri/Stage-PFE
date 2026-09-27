/** Choosable sizes/volumes for a product: its variants first, then clothing sizes, then its single volume. */
export function sizeOptions(product, isClothes) {
  const variantLabels = [...new Set((product?.variants || []).map((v) => (v.label || '').trim()).filter(Boolean))]
  if (variantLabels.length > 0) return variantLabels
  if (isClothes && product?.tailles?.length > 0) return product.tailles
  return product?.volume ? [product.volume] : []
}

/** A size must be picked by the customer when there is more than one to choose from. */
export function needsSizeChoice(product, isClothes) {
  return sizeOptions(product, isClothes).length > 1
}

/** Cart lines are unique per product and size. */
export function lineKeyOf(item) {
  return item.lineKey || `${item.id}::${item.size || ''}`
}
