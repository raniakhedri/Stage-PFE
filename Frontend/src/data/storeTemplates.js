export function layoutOf(templateKey) {
  const key = String(templateKey || '').toLowerCase()
  if (key === 'bold' || key === 'noir' || key === 'marin') return 'bold'
  if (key === 'luxury' || key === 'atelier' || key === 'apothicaire' || key === 'botanique') return 'luxury'
  return 'minimal'
}
