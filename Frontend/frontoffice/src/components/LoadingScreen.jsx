import { useEffect, useState } from 'react'
import { useFoAppearance } from '../context/AppearanceContext'

const DURATION = 3500 // ms

const CSS = `
  @keyframes ls-fade-in-zoom {
    0%   { opacity: 0; transform: scale(0.78); }
    60%  { opacity: 1; transform: scale(1.03); }
    100% { opacity: 1; transform: scale(1); }
  }
  @keyframes ls-spin-cw {
    to { transform: rotate(360deg); }
  }
  @keyframes ls-spin-ccw {
    to { transform: rotate(-360deg); }
  }
  @keyframes ls-slide-up {
    0%   { opacity: 0; transform: translateY(16px); }
    100% { opacity: 1; transform: translateY(0); }
  }
  @keyframes ls-flicker {
    0%, 100% { opacity: 1; }
    92%       { opacity: 1; }
    93%       { opacity: 0.6; }
    94%       { opacity: 1; }
    96%       { opacity: 0.7; }
    97%       { opacity: 1; }
  }
  @keyframes ls-dot-pulse {
    0%, 100% { opacity: 0.25; }
    50%       { opacity: 1; }
  }

  .ls-overlay {
    position: fixed;
    inset: 0;
    z-index: 9999;
    background: #ffffff;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    transition: opacity 0.75s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .ls-overlay.fade-out {
    opacity: 0;
    pointer-events: none;
  }

  /* Corner decorations */
  .ls-corner {
    position: absolute;
    width: 56px;
    height: 56px;
    opacity: 0.25;
  }
  .ls-corner-tl { top: 36px; left: 36px; border-top: 1px solid #c9a84c; border-left: 1px solid #c9a84c; }
  .ls-corner-tr { top: 36px; right: 36px; border-top: 1px solid #c9a84c; border-right: 1px solid #c9a84c; }
  .ls-corner-bl { bottom: 72px; left: 36px; border-bottom: 1px solid #c9a84c; border-left: 1px solid #c9a84c; }
  .ls-corner-br { bottom: 72px; right: 36px; border-bottom: 1px solid #c9a84c; border-right: 1px solid #c9a84c; }

  /* Logo zone */
  .ls-logo-zone {
    position: relative;
    width: 200px;
    height: 200px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 36px;
  }
  .ls-ring-outer {
    position: absolute;
    inset: -28px;
    border-radius: 50%;
    border: 1.5px solid transparent;
    border-top-color: #c9a84c;
    border-right-color: rgba(201,168,76,0.18);
    animation: ls-spin-cw 2.4s linear infinite;
  }
  .ls-ring-inner {
    position: absolute;
    inset: -10px;
    border-radius: 50%;
    border: 1px solid transparent;
    border-bottom-color: rgba(201,168,76,0.55);
    border-left-color: rgba(201,168,76,0.14);
    animation: ls-spin-ccw 1.7s ease-in-out infinite;
  }
  .ls-ring-dot {
    position: absolute;
    inset: -28px;
    border-radius: 50%;
    animation: ls-spin-cw 2.4s linear infinite;
  }
  .ls-ring-dot::after {
    content: '';
    position: absolute;
    top: 4px;
    left: 50%;
    transform: translateX(-50%);
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #c9a84c;
    box-shadow: 0 0 10px 3px rgba(201,168,76,0.55);
  }

  .ls-logo-content {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    animation: ls-fade-in-zoom 1.1s cubic-bezier(0.34, 1.4, 0.64, 1) forwards;
  }
  .ls-logo-img {
    max-width: 140px;
    max-height: 140px;
    object-fit: contain;
  }
  .ls-logo-text-name {
    font-family: 'Cormorant Garamond', Garamond, Georgia, serif;
    font-size: 44px;
    font-weight: 300;
    letter-spacing: 0.38em;
    color: #111111;
    line-height: 1;
    text-align: center;
    text-transform: uppercase;
    animation: ls-flicker 5s ease infinite;
  }
  .ls-logo-text-slogan {
    font-family: 'Cormorant Garamond', Garamond, Georgia, serif;
    font-size: 12px;
    font-weight: 400;
    letter-spacing: 0.6em;
    color: #c9a84c;
    margin-top: 10px;
    text-align: center;
    text-transform: uppercase;
  }

  /* Brand below logo */
  .ls-brand {
    text-align: center;
    animation: ls-slide-up 0.9s ease 0.45s both;
    margin-bottom: 14px;
  }
  .ls-brand-name {
    font-family: 'Cormorant Garamond', Garamond, Georgia, serif;
    font-size: 28px;
    font-weight: 300;
    letter-spacing: 0.44em;
    color: #111111;
    text-transform: uppercase;
  }
  .ls-brand-slogan {
    font-family: 'Cormorant Garamond', Garamond, Georgia, serif;
    font-size: 11px;
    font-weight: 400;
    letter-spacing: 0.65em;
    color: #c9a84c;
    margin-top: 8px;
    text-transform: uppercase;
  }

  /* Divider */
  .ls-divider {
    display: flex;
    align-items: center;
    gap: 14px;
    animation: ls-slide-up 0.9s ease 0.65s both;
    margin-bottom: 22px;
    opacity: 0.45;
  }
  .ls-divider-line {
    width: 64px;
    height: 1px;
    background: linear-gradient(90deg, transparent, #c9a84c);
  }
  .ls-divider-line.right {
    background: linear-gradient(90deg, #c9a84c, transparent);
  }
  .ls-divider-diamond {
    width: 5px;
    height: 5px;
    background: #c9a84c;
    transform: rotate(45deg);
  }

  /* Welcome message */
  .ls-welcome {
    animation: ls-slide-up 0.9s ease 0.8s both;
    margin-bottom: 52px;
    text-align: center;
    padding: 0 32px;
  }
  .ls-welcome-text {
    font-family: 'Cormorant Garamond', Garamond, Georgia, serif;
    font-size: 14px;
    font-weight: 300;
    font-style: italic;
    letter-spacing: 0.18em;
    color: rgba(0,0,0,0.42);
    margin: 0;
    text-transform: uppercase;
  }

  /* Progress zone */
  .ls-progress-zone {
    width: 100%;
    max-width: 420px;
    padding: 0 32px;
    animation: ls-slide-up 0.9s ease 1s both;
  }
  .ls-progress-track {
    position: relative;
    height: 2px;
    background: rgba(0,0,0,0.08);
    border-radius: 2px;
    overflow: hidden;
    margin-bottom: 16px;
  }
  .ls-progress-bar {
    height: 100%;
    border-radius: 2px;
    background: linear-gradient(90deg, #b8860b 0%, #c9a84c 55%, #e8d08a 100%);
    box-shadow: 0 0 10px 1px rgba(201,168,76,0.45);
    transition: width 0.08s linear;
  }
  .ls-progress-label {
    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
    font-size: 10px;
    font-weight: 400;
    letter-spacing: 0.3em;
    color: rgba(0,0,0,0.32);
    text-align: center;
    text-transform: uppercase;
    margin: 0;
  }
  .ls-dots {
    display: inline-flex;
    gap: 4px;
    vertical-align: middle;
    margin-left: 3px;
  }
  .ls-dot {
    width: 3px;
    height: 3px;
    border-radius: 50%;
    background: rgba(0,0,0,0.28);
    animation: ls-dot-pulse 1.2s ease-in-out infinite;
  }
  .ls-dot:nth-child(2) { animation-delay: 0.2s; }
  .ls-dot:nth-child(3) { animation-delay: 0.4s; }

  /* Responsive */
  @media (max-width: 480px) {
    .ls-corner { width: 36px; height: 36px; }
    .ls-corner-tl, .ls-corner-tr { top: 22px; }
    .ls-corner-tl, .ls-corner-bl { left: 22px; }
    .ls-corner-tr, .ls-corner-br { right: 22px; }
    .ls-corner-bl, .ls-corner-br { bottom: 56px; }
    .ls-logo-zone { width: 150px; height: 150px; }
    .ls-ring-outer { inset: -22px; }
    .ls-ring-inner { inset: -8px; }
    .ls-ring-dot { inset: -22px; }
    .ls-logo-img { max-width: 100px; max-height: 100px; }
    .ls-logo-text-name { font-size: 32px; }
    .ls-logo-text-slogan { font-size: 10px; }
    .ls-brand-name { font-size: 22px; }
    .ls-brand-slogan { font-size: 9px; }
    .ls-welcome-text { font-size: 12px; }
    .ls-progress-zone { max-width: 320px; }
    .ls-progress-label { font-size: 9px; }
  }
`

export default function LoadingScreen({ onComplete }) {
  const { brandName, slogan, logoMain, logoLight, logoNavbar, loaded } = useFoAppearance()
  const [progress, setProgress] = useState(0)
  const [fadeOut, setFadeOut] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    const startTime = Date.now()
    let rafId

    const tick = () => {
      const elapsed = Date.now() - startTime
      const p = Math.min(100, (elapsed / DURATION) * 100)
      setProgress(p)
      if (p < 100) {
        rafId = requestAnimationFrame(tick)
      } else {
        setDone(true)
        setTimeout(() => {
          setFadeOut(true)
          setTimeout(() => onComplete?.(), 750)
        }, 350)
      }
    }

    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [onComplete])

  // Fond blanc → préférer logoMain ou logoNavbar (logoLight = logo blanc, invisible sur blanc)
  const logo = logoMain || logoNavbar || logoLight
  const hasLogo = Boolean(logo)

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <div className={`ls-overlay${fadeOut ? ' fade-out' : ''}`}>
        {/* Corner decorations */}
        <div className="ls-corner ls-corner-tl" aria-hidden="true" />
        <div className="ls-corner ls-corner-tr" aria-hidden="true" />
        <div className="ls-corner ls-corner-bl" aria-hidden="true" />
        <div className="ls-corner ls-corner-br" aria-hidden="true" />

        {/* Logo + spinner */}
        <div className="ls-logo-zone">
          <div className="ls-ring-outer" aria-hidden="true" />
          <div className="ls-ring-inner" aria-hidden="true" />
          <div className="ls-ring-dot" aria-hidden="true" />

          <div className="ls-logo-content">
            {hasLogo ? (
              <img
                src={logo}
                alt={brandName || 'Logo'}
                className="ls-logo-img"
              />
            ) : (
              <div>
                {brandName && <div className="ls-logo-text-name">{brandName}</div>}
                {slogan && <div className="ls-logo-text-slogan">{slogan}</div>}
              </div>
            )}
          </div>
        </div>

        {/* Brand name (only when logo image shown, to avoid duplication) */}
        {hasLogo && (
          <div className="ls-brand">
            {brandName && <div className="ls-brand-name">{brandName}</div>}
            {slogan && <div className="ls-brand-slogan">{slogan}</div>}
          </div>
        )}

        {/* Decorative divider */}
        <div className="ls-divider" aria-hidden="true">
          <div className="ls-divider-line" />
          <div className="ls-divider-diamond" />
          <div className="ls-divider-line right" />
        </div>

        {/* Welcome message */}
        <div className="ls-welcome">
          <p className="ls-welcome-text">
            {done
              ? 'Bienvenue'
              : 'Préparation de votre expérience de shopping'}
          </p>
        </div>

        {/* Progress bar */}
        <div className="ls-progress-zone">
          <div className="ls-progress-track">
            <div className="ls-progress-bar" style={{ width: `${progress}%` }} />
          </div>
          <p className="ls-progress-label">
            {done ? (
              'Prêt'
            ) : (
              <>
                Chargement en cours
                <span className="ls-dots" aria-hidden="true">
                  <span className="ls-dot" />
                  <span className="ls-dot" />
                  <span className="ls-dot" />
                </span>
              </>
            )}
          </p>
        </div>
      </div>
    </>
  )
}
