function Badge({ children, color = 'blue' }) {
  const colors = {
    blue:   'bg-blue-100 text-blue-800',
    green:  'bg-badge/10 text-badge',
    red:    'bg-red-100 text-red-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    gray:   'bg-gray-100 text-gray-800',
  }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium font-badge ${colors[color]}`}>
      {children}
    </span>
  )
}

export default Badge
