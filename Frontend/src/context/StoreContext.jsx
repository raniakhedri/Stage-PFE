import { createContext, useContext, useEffect, useState } from 'react'

const StoreContext = createContext({
  businessType: 'COSMETICS',
  templateKey: 'botanique',
  onboarded: true,
  storeName: '',
  isClothes: false,
  ready: false,
})

export function StoreProvider({ children }) {
  const [store, setStore] = useState({
    businessType: 'COSMETICS',
    templateKey: 'botanique',
    onboarded: true,
    storeName: '',
    ready: false,
  })

  useEffect(() => {
    fetch('http://localhost:8080/api/v1/public/store')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data) {
          setStore((prev) => ({ ...prev, ready: true }))
          return
        }
        setStore({
          businessType: data.businessType || 'COSMETICS',
          templateKey: data.templateKey || 'botanique',
          onboarded: Boolean(data.onboarded),
          storeName: data.storeName || '',
          ready: true,
        })
      })
      .catch(() => setStore((prev) => ({ ...prev, ready: true })))
  }, [])

  useEffect(() => {
    const root = document.documentElement
    root.dataset.template = store.templateKey || 'botanique'
    root.dataset.business = store.businessType || 'COSMETICS'
    if (store.storeName) document.title = store.storeName
  }, [store.templateKey, store.businessType, store.storeName])

  return (
    <StoreContext.Provider value={{ ...store, isClothes: store.businessType === 'CLOTHES' }}>
      {children}
    </StoreContext.Provider>
  )
}

export function useStore() {
  return useContext(StoreContext)
}
