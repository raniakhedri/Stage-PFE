import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Camera, Loader2, X } from 'lucide-react'
import { createDecartClient, models } from '@decartai/sdk'
import { createTryOnToken } from '../api/apiClient'

const GENERATION_SECONDS = 45

function resolveImageUrl(src) {
  if (!src) return ''
  if (/^https?:\/\//i.test(src) || src.startsWith('data:') || src.startsWith('blob:')) return src
  const path = src.startsWith('/') ? src : `/${src}`
  return `http://localhost:8080${path}`
}

function buildPrompt(product) {
  const name = (product?.name || 'cashmere wool pullover').replace(/\s+/g, ' ').trim()
  return `Substitute the current top with a ${name}, matching the color, knit, round neck and long sleeves of the reference garment image`
}

function explain(reason) {
  const text = String(reason || '')
  if (/insufficient_credits|credit/i.test(text)) {
    return 'Crédits Decart épuisés. Rechargez le compte sur platform.decart.ai.'
  }
  if (/moderation/i.test(text)) return 'Decart a refusé cette image (modération).'
  if (/policy_violation/i.test(text)) return 'Decart a coupé la session (politique du compte).'
  return text
}

async function fetchGarmentBlob(src) {
  const url = resolveImageUrl(src)
  if (!url) throw new Error('Ce produit n’a pas d’image.')
  const res = await fetch(url)
  if (!res.ok) throw new Error('Impossible de charger l’image du produit.')
  const blob = await res.blob()
  if (!blob.size) throw new Error('L’image du produit est vide.')
  const typed = /^image\//.test(blob.type) ? blob : new Blob([await blob.arrayBuffer()], { type: 'image/jpeg' })
  const bitmap = await createImageBitmap(typed)
  const scale = Math.min(1, 768 / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(bitmap.width * scale))
  canvas.height = Math.max(1, Math.round(bitmap.height * scale))
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  const compressed = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85))
  return compressed || typed
}

function modelFps(model) {
  if (typeof model.fps === 'number') return model.fps
  if (model.fps && typeof model.fps.ideal === 'number') return model.fps.ideal
  return 20
}

async function openCamera(model) {
  const width = model.width || 1280
  const height = model.height || 720
  const fps = modelFps(model)
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: false,
    video: {
      facingMode: 'user',
      width: { ideal: width },
      height: { ideal: height },
      frameRate: { ideal: fps, max: fps },
    },
  })
  const track = stream.getVideoTracks()[0]
  await track.applyConstraints({
    width: { ideal: width },
    height: { ideal: height },
    frameRate: { ideal: fps, max: fps },
  }).catch(() => {})

  const probe = document.createElement('video')
  probe.muted = true
  probe.playsInline = true
  probe.srcObject = stream
  await probe.play()
  const started = Date.now()
  while (Date.now() - started < 4000) {
    const settings = track.getSettings()
    if ((settings.width || probe.videoWidth || 0) > 0 && (settings.height || probe.videoHeight || 0) > 0) break
    await new Promise((resolve) => setTimeout(resolve, 40))
  }

  const settings = track.getSettings()
  if (settings.width && settings.height) {
    probe.srcObject = null
    return stream
  }

  // LiveKit only reads getSettings(). Chrome often leaves that at 0×0, then Decart drops the session.
  const canvas = document.createElement('canvas')
  canvas.width = probe.videoWidth || width
  canvas.height = probe.videoHeight || height
  const ctx = canvas.getContext('2d')
  let raf = 0
  const draw = () => {
    if (probe.videoWidth) ctx.drawImage(probe, 0, 0, canvas.width, canvas.height)
    raf = requestAnimationFrame(draw)
  }
  draw()
  const painted = canvas.captureStream(fps)
  const out = painted.getVideoTracks()[0]
  const stop = out.stop.bind(out)
  out.stop = () => {
    cancelAnimationFrame(raf)
    probe.srcObject = null
    stop()
    stream.getTracks().forEach((item) => item.stop())
  }
  return painted
}

function playVideo(video, stream) {
  if (!video || !stream) return
  if (video.srcObject !== stream) video.srcObject = stream
  video.muted = true
  video.playsInline = true
  const start = () => video.play().catch(() => {})
  start()
  video.onloadedmetadata = start
}

export default function TryOnModal({ product, onClose }) {
  const localRef = useRef(null)
  const remoteRef = useRef(null)
  const remoteStreamRef = useRef(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose
  const [status, setStatus] = useState('Préparation…')
  const [error, setError] = useState('')
  const [secondsLeft, setSecondsLeft] = useState(null)
  const [live, setLive] = useState(false)

  const bindRemote = useCallback((el) => {
    remoteRef.current = el
    if (el && remoteStreamRef.current) playVideo(el, remoteStreamRef.current)
  }, [])

  useEffect(() => {
    let cancelled = false
    const session = { stream: null, realtime: null, timer: null, waitTimer: null, billed: false }

    function showRemote(stream) {
      if (cancelled || !stream) return
      remoteStreamRef.current = stream
      playVideo(remoteRef.current, stream)
      setLive(true)
    }

    function startBilling() {
      if (session.billed || cancelled) return
      session.billed = true
      if (session.waitTimer) window.clearTimeout(session.waitTimer)
      setSecondsLeft(GENERATION_SECONDS)
      session.timer = window.setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev == null || prev <= 1) {
            window.clearInterval(session.timer)
            window.setTimeout(() => onCloseRef.current?.(), 0)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }

    async function start() {
      try {
        setError('')
        setLive(false)
        setStatus('Jeton Decart…')
        const token = await createTryOnToken()
        if (cancelled) return
        if (!token?.apiKey) throw new Error('Jeton Decart manquant. Vérifiez DECART_API_KEY.')

        const model = models.realtime('lucy-vton-latest')
        setStatus('Caméra 1280×720…')
        const stream = await openCamera(model)
        session.stream = stream
        playVideo(localRef.current, stream)
        if (cancelled) return

        setStatus('Image du pull…')
        const garmentBlob = await fetchGarmentBlob(product.image)
        if (cancelled) return

        setStatus('Connexion au modèle…')
        const client = createDecartClient({ apiKey: token.apiKey })
        const realtime = await client.realtime.connect(stream, {
          model,
          mirror: false,
          onRemoteStream: showRemote,
        })
        session.realtime = realtime
        if (cancelled) {
          realtime.disconnect()
          return
        }

        realtime.on('connectionChange', (state) => {
          if (cancelled) return
          if (state === 'generating') {
            setStatus('Essayage en direct')
            setLive(true)
            startBilling()
          } else if (state === 'connected') {
            setStatus('Connecté. En attente de la première image…')
          } else if (state === 'reconnecting') {
            setStatus('Reconnexion…')
          }
        })
        realtime.on('generationTick', () => {
          if (cancelled) return
          setStatus('Essayage en direct')
          setLive(true)
          startBilling()
        })
        realtime.on('error', (err) => {
          if (!cancelled) setError(explain(err?.message) || 'Erreur Decart.')
        })
        realtime.on('generationEnded', (ended) => {
          if (!cancelled && ended?.reason) setError(explain(ended.reason))
        })
        realtime.on('sessionEnded', (ended) => {
          if (!cancelled) setError(explain(ended?.reason) || 'Session Decart terminée.')
        })

        setStatus('Envoi du vêtement…')
        await realtime.set({
          prompt: buildPrompt(product),
          image: garmentBlob,
          enhance: false,
        })
        if (cancelled) return
        setStatus('Le modèle applique le pull…')

        session.waitTimer = window.setTimeout(() => {
          if (cancelled || remoteStreamRef.current || session.billed) return
          setError('Decart est connecté mais n’envoie aucune vidéo. Désactivez le VPN (WebRTC a besoin d’UDP), puis réessayez. Si ça continue, les crédits du compte Decart sont vides.')
        }, 20000)
      } catch (err) {
        if (cancelled) return
        const message = err?.message || String(err)
        if (/NotAllowedError|Permission denied/i.test(message)) {
          setError('Caméra refusée. Autorisez-la dans le navigateur, puis réessayez.')
        } else {
          setError(explain(message) || message)
        }
        setStatus('')
      }
    }

    start()
    return () => {
      cancelled = true
      if (session.timer) window.clearInterval(session.timer)
      if (session.waitTimer) window.clearTimeout(session.waitTimer)
      try { session.realtime?.disconnect() } catch { /* ignore */ }
      session.stream?.getTracks().forEach((t) => t.stop())
    }
  }, [product.id, product.image, product.name])

  return createPortal(
    <div className="fixed inset-0 z-[320] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant/20">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-secondary">Essayage en direct</p>
            <h3 className="text-lg font-headline font-bold text-primary">{product.name}</h3>
          </div>
          <div className="flex items-center gap-3">
            {secondsLeft != null && (
              <span className="text-xs font-bold text-on-surface-variant">{secondsLeft}s</span>
            )}
            <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-surface-container-low">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 bg-black">
          <div className="relative aspect-[3/4] md:aspect-auto md:min-h-[420px]">
            <video ref={localRef} autoPlay muted playsInline className="w-full h-full object-cover -scale-x-100" />
            <span className="absolute left-3 top-3 text-[10px] font-bold uppercase tracking-wider bg-black/50 text-white px-2 py-1 rounded-full">Vous</span>
          </div>
          <div className="relative aspect-[3/4] md:aspect-auto md:min-h-[420px] bg-neutral-900">
            <video ref={bindRemote} autoPlay muted playsInline className="w-full h-full object-cover" />
            <span className="absolute left-3 top-3 text-[10px] font-bold uppercase tracking-wider bg-black/50 text-white px-2 py-1 rounded-full">Essayage</span>
            {!error && !live && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white text-sm bg-black/50 p-6 text-center">
                <Loader2 size={22} className="animate-spin" />
                <p>{status}</p>
              </div>
            )}
          </div>
        </div>

        {error && <div className="px-5 py-4 text-sm text-error bg-error/5">{error}</div>}
        {!error && <p className="px-5 py-3 text-[11px] text-on-surface-variant">{status}</p>}
      </div>
    </div>,
    document.body
  )
}

export function TryOnButton({ product, className = '' }) {
  const [open, setOpen] = useState(false)
  const close = useCallback(() => setOpen(false), [])
  if (!product?.image) return null
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        <Camera size={18} />
        Essayer
      </button>
      {open && <TryOnModal product={product} onClose={close} />}
    </>
  )
}
