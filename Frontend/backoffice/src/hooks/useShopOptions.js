import { useEffect, useState } from 'react'
import { PRESETS } from '../data/catalogOptions'

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1'

// One shared copy for every picker on the page.
let custom = null
let loading = null
const listeners = new Set()

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('accessToken') || ''}`,
  }
}

function parse(raw) {
  try {
    const value = JSON.parse(raw || '{}')
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {}
  } catch {
    return {}
  }
}

function publish(next) {
  custom = next
  listeners.forEach((fn) => fn(next))
}

function load() {
  if (custom) return Promise.resolve(custom)
  if (!loading) {
    loading = fetch(`${API}/auth/my-shop`, { headers: authHeaders() })
      .then((r) => (r.ok ? r.json() : null))
      .then((shop) => publish(parse(shop?.customOptions)))
      .catch(() => publish({}))
      .finally(() => { loading = null })
  }
  return loading
}

async function save(next) {
  const previous = custom
  publish(next)
  const res = await fetch(`${API}/auth/my-shop`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify({ customOptions: JSON.stringify(next) }),
  })
  if (!res.ok) {
    publish(previous)
    throw new Error('Enregistrement impossible.')
  }
}

/**
 * Merchant-defined options merged with the presets.
 * `options(key)` → presets + custom values, `customFor(key)` → custom values only.
 */
export function useShopOptions() {
  const [state, setState] = useState(custom || {})

  useEffect(() => {
    listeners.add(setState)
    load()
    return () => listeners.delete(setState)
  }, [])

  const customFor = (key) => (Array.isArray(state[key]) ? state[key] : [])

  const options = (key) => {
    const merged = [...(PRESETS[key] || [])]
    customFor(key).forEach((v) => {
      if (!merged.some((m) => m.toLowerCase() === v.toLowerCase())) merged.push(v)
    })
    return merged
  }

  const addOption = async (key, value) => {
    const clean = String(value || '').trim()
    if (!clean) return
    const exists = options(key).some((v) => v.toLowerCase() === clean.toLowerCase())
    if (exists) return
    await save({ ...(custom || {}), [key]: [...customFor(key), clean] })
  }

  const removeOption = async (key, value) => {
    await save({ ...(custom || {}), [key]: customFor(key).filter((v) => v !== value) })
  }

  return { options, customFor, addOption, removeOption }
}
