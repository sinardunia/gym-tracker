import { useEffect, useState } from 'react'
import { useI18n } from '../i18n'
import { Icon } from './Icon'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISS_KEY = 'gym-tracker.pwa-dismissed'

export function InstallPwaBanner() {
  const { tr } = useI18n()
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isIos, setIsIos] = useState(false)
  const [showIosGuide, setShowIosGuide] = useState(false)
  const [dismissed, setDismissed] = useState(true)

  useEffect(() => {
    // Check if running as installed standalone app
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      ('standalone' in navigator && (navigator as unknown as { standalone: boolean }).standalone === true)

    if (isStandalone) return

    const isAlreadyDismissed = localStorage.getItem(DISMISS_KEY) === 'true'
    if (isAlreadyDismissed) return

    const ios = /iPhone|iPad|iPod/.test(navigator.userAgent) && !('MSStream' in window)
    setIsIos(ios)

    if (ios) {
      setDismissed(false)
      return
    }

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setDismissed(false)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  function handleDismiss() {
    localStorage.setItem(DISMISS_KEY, 'true')
    setDismissed(true)
  }

  async function handleInstall() {
    if (deferredPrompt) {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        handleDismiss()
      }
      setDeferredPrompt(null)
    } else if (isIos) {
      setShowIosGuide((prev) => !prev)
    }
  }

  if (dismissed) return null

  return (
    <div className="pwa-banner">
      <div className="pwa-banner-content">
        <div className="pwa-banner-info">
          <strong>{tr('pwa.installTitle')}</strong>
          <p className="muted">{tr('pwa.installDesc')}</p>
          {showIosGuide && <p className="ios-guide-text">{tr('pwa.iosGuide')}</p>}
        </div>
        <div className="pwa-banner-actions">
          <button type="button" className="btn-sm primary" onClick={handleInstall}>
            {tr('pwa.installBtn')}
          </button>
          <button
            type="button"
            className="icon-btn-sm"
            onClick={handleDismiss}
            aria-label="Dismiss"
          >
            <Icon name="x" size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
