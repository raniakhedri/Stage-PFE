import { useEffect, useState } from 'react'
import { fetchFooterCategories } from '../../api/apiClient'

export function useFooterCategories() {
  const [categories, setCategories] = useState([])
  useEffect(() => {
    fetchFooterCategories().then(setCategories).catch(() => setCategories([]))
  }, [])
  return categories
}
