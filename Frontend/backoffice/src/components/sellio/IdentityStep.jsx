import { useEffect, useRef, useState } from 'react'

/** Reads an image file, downsizes it and returns a JPEG data URL (keeps uploads light). */
export function compressImage(file, maxSide = 1600, quality = 0.85) {
  return new Promise((resolve, reject) => {
    if (!file?.type?.startsWith('image/')) {
      reject(new Error('Le fichier doit être une image (JPG, PNG…).'))
      return
    }
    if (file.size > 15 * 1024 * 1024) {
      reject(new Error('Image trop lourde (15 Mo maximum).'))
      return
    }
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Lecture du fichier impossible.'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('Image illisible.'))
      img.onload = () => {
        const scale = Math.min(1, maxSide / Math.max(img.width, img.height))
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width * scale)
        canvas.height = Math.round(img.height * scale)
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.src = String(reader.result)
    }
    reader.readAsDataURL(file)
  })
}

export const emptyIdentity = { documentType: 'CIN', documentNumber: '', documentFront: '', documentBack: '', selfie: '' }

export function identityError(v) {
  const number = (v.documentNumber || '').replace(/\s/g, '')
  if (v.documentType === 'CIN' && !/^\d{8}$/.test(number)) return 'Le numéro de CIN doit contenir 8 chiffres.'
  if (v.documentType === 'PASSPORT' && !/^[A-Za-z0-9]{6,12}$/.test(number)) return 'Numéro de passeport invalide (6 à 12 lettres/chiffres).'
  if (!v.documentFront) return v.documentType === 'CIN' ? 'Ajoutez la photo du recto de votre CIN.' : 'Ajoutez la photo de la page d’identité de votre passeport.'
  if (v.documentType === 'CIN' && !v.documentBack) return 'Ajoutez la photo du verso de votre CIN.'
  if (!v.selfie) return 'Prenez un selfie.'
  return ''
}

function DropImage({ label, hint, value, onChange, onError, theme, aspect = 'aspect-[16/10]' }) {
  const [drag, setDrag] = useState(false)
  const inputRef = useRef(null)
  const take = async (file) => {
    if (!file) return
    try {
      onChange(await compressImage(file))
    } catch (err) {
      onError(err.message)
    }
  }
  return (
    <div>
      <p className="text-sm font-medium mb-2">{label}</p>
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); take(e.dataTransfer.files?.[0]) }}
        className={`relative ${aspect} rounded-xl border-2 border-dashed overflow-hidden cursor-pointer transition-colors flex items-center justify-center ${
          drag ? 'border-violet-400 bg-violet-500/10' : theme.dark ? 'border-white/15 hover:border-white/30 bg-white/[0.02]' : 'border-slate-300 hover:border-slate-400 bg-slate-50'
        }`}
      >
        {value ? (
          <>
            <img src={value} alt={label} className="absolute inset-0 w-full h-full object-cover" />
            <span className="absolute bottom-2 right-2 px-2.5 py-1 rounded-md bg-black/70 text-white text-xs">Remplacer</span>
          </>
        ) : (
          <div className={`text-center px-4 ${theme.t.muted}`}>
            <span className="material-symbols-outlined text-3xl">add_photo_alternate</span>
            <p className="text-xs mt-1">{hint || 'Cliquez ou déposez une image'}</p>
          </div>
        )}
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { take(e.target.files?.[0]); e.target.value = '' }} />
      </div>
    </div>
  )
}

/** Webcam selfie with a file-upload fallback (phones open the front camera). */
function SelfieCapture({ value, onChange, onError, theme }) {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const fileRef = useRef(null)
  const [live, setLive] = useState(false)

  const stop = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    setLive(false)
  }
  useEffect(() => stop, [])

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 1280, height: 960 } })
      streamRef.current = stream
      setLive(true)
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play()
        }
      }, 0)
    } catch {
      onError('Caméra indisponible : autorisez l’accès ou importez une photo.')
    }
  }

  const capture = () => {
    const video = videoRef.current
    if (!video?.videoWidth) return
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    ctx.translate(canvas.width, 0)
    ctx.scale(-1, 1)
    ctx.drawImage(video, 0, 0)
    onChange(canvas.toDataURL('image/jpeg', 0.85))
    stop()
  }

  return (
    <div>
      <p className="text-sm font-medium mb-2">Selfie</p>
      <div className={`relative aspect-[4/3] rounded-xl overflow-hidden flex items-center justify-center ${theme.dark ? 'bg-white/[0.03] border border-white/10' : 'bg-slate-100 border border-slate-200'}`}>
        {live ? (
          <>
            <video ref={videoRef} playsInline muted className="absolute inset-0 w-full h-full object-cover -scale-x-100" />
            <div className="absolute inset-[18%_22%] rounded-[50%] border-2 border-white/70 pointer-events-none" />
          </>
        ) : value ? (
          <img src={value} alt="Selfie" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className={`text-center px-6 ${theme.t.muted}`}>
            <span className="material-symbols-outlined text-4xl">face</span>
            <p className="text-xs mt-1">Visage bien éclairé, sans lunettes de soleil, face à la caméra.</p>
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-2 mt-3">
        {live ? (
          <>
            <button type="button" onClick={capture} className="px-4 py-2 rounded-lg bg-violet-500 text-white text-sm font-semibold hover:bg-violet-400">Prendre la photo</button>
            <button type="button" onClick={stop} className={`px-4 py-2 rounded-lg text-sm ${theme.t.secondaryBtn}`}>Annuler</button>
          </>
        ) : (
          <>
            <button type="button" onClick={start} className={`px-4 py-2 rounded-lg text-sm font-semibold inline-flex items-center gap-2 ${theme.t.primaryBtn}`}>
              <span className="material-symbols-outlined text-base">photo_camera</span>
              {value ? 'Reprendre' : 'Ouvrir la caméra'}
            </button>
            <button type="button" onClick={() => fileRef.current?.click()} className={`px-4 py-2 rounded-lg text-sm ${theme.t.secondaryBtn}`}>Importer une photo</button>
          </>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="user"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0]
            e.target.value = ''
            if (!file) return
            try { onChange(await compressImage(file, 1280)) } catch (err) { onError(err.message) }
          }}
        />
      </div>
      <p className={`text-[11px] mt-2 ${theme.t.faint}`}>La reconnaissance faciale automatique sera ajoutée plus tard ; pour l’instant l’équipe Sellio compare le selfie à la pièce d’identité.</p>
    </div>
  )
}

export default function IdentityStep({ value, onChange, onError, theme }) {
  const set = (key) => (v) => onChange({ ...value, [key]: v })
  const isCin = value.documentType === 'CIN'
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3">
        {[['CIN', 'Carte d’identité (CIN)', 'badge'], ['PASSPORT', 'Passeport', 'travel_explore']].map(([id, label, icon]) => (
          <button
            key={id}
            type="button"
            onClick={() => onChange({ ...value, documentType: id, documentBack: id === 'CIN' ? value.documentBack : '' })}
            className={`rounded-xl border p-4 text-left transition-all ${value.documentType === id ? theme.t.selected : theme.t.unselected}`}
          >
            <span className="material-symbols-outlined text-xl">{icon}</span>
            <p className="text-sm font-medium mt-2">{label}</p>
          </button>
        ))}
      </div>
      <label className="block">
        <span className="text-sm font-medium">{isCin ? 'Numéro de CIN' : 'Numéro de passeport'}</span>
        <input
          value={value.documentNumber}
          onChange={(e) => set('documentNumber')(isCin ? e.target.value.replace(/\D/g, '').slice(0, 8) : e.target.value.toUpperCase().slice(0, 12))}
          inputMode={isCin ? 'numeric' : 'text'}
          placeholder={isCin ? '12345678' : 'A1234567'}
          className={`mt-1.5 w-full rounded-xl px-4 py-3 text-sm outline-none transition-all font-mono tracking-wider ${theme.t.input}`}
        />
      </label>
      <div className={`grid gap-4 ${isCin ? 'sm:grid-cols-2' : ''}`}>
        <DropImage label={isCin ? 'Recto de la CIN' : 'Page d’identité du passeport'} value={value.documentFront} onChange={set('documentFront')} onError={onError} theme={theme} />
        {isCin && <DropImage label="Verso de la CIN" value={value.documentBack} onChange={set('documentBack')} onError={onError} theme={theme} />}
      </div>
      <SelfieCapture value={value.selfie} onChange={set('selfie')} onError={onError} theme={theme} />
      <p className={`text-xs flex items-start gap-2 ${theme.t.faint}`}>
        <span className="material-symbols-outlined text-sm">lock</span>
        Vos documents servent uniquement à vérifier votre identité et ne sont visibles que par l’équipe Sellio.
      </p>
    </div>
  )
}
