function Button({ children, onClick, type = 'button', variant = 'primary', disabled = false, className = '' }) {
  const variants = {
    primary:   'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800',
    danger:    'bg-red-600 hover:bg-red-700 text-white',
    success:   'bg-btn hover:bg-btn-dark text-white',
    outline:   'border border-blue-600 text-blue-600 hover:bg-blue-50',
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-button ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  )
}

export default Button
