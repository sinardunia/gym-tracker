import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { useI18n } from '../i18n'
import { Button } from './ui'

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
    <div className="mb-4 px-4 py-3.5 rounded-xl bg-brand-card border border-brand-accent shadow-[0_4px_16px_rgba(124,58,237,0.12)]">
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col gap-0.5 [&_strong]:text-[15px] [&_strong]:text-brand-heading [&_p]:text-[13px]">
          <strong>{tr('pwa.installTitle')}</strong>
          <p className="text-brand-text">{tr('pwa.installDesc')}</p>
          {showIosGuide && <p className="font-semibold text-brand-accent mt-1">{tr('pwa.iosGuide')}</p>}
        </div>
        <div className="flex items-center gap-2">
          <Button sm type="button" onClick={handleInstall}>
            {tr('pwa.installBtn')}
          </Button>
          <button
            type="button"
            className="inline-flex items-center justify-center p-1.5 border-none rounded-lg bg-transparent text-brand-text cursor-pointer hover:bg-brand-row"
            onClick={handleDismiss}
            aria-label="Dismiss"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  )
}