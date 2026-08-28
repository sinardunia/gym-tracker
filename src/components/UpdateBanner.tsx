import { useEffect } from 'react'
import { X } from 'lucide-react'
import { useI18n } from '../i18n'
import { usePwaUpdate } from '../lib/pwa'
import { Button, IconButton } from './ui'

export function UpdateBanner() {
  const { tr } = useI18n()
  const { needRefresh, offlineReady, reload, dismissRefresh, dismissOfflineReady } =
    usePwaUpdate()

  useEffect(() => {
    if (!offlineReady) return
    const timer = setTimeout(dismissOfflineReady, 4000)
    return () => clearTimeout(timer)
  }, [offlineReady, dismissOfflineReady])

  if (!needRefresh && !offlineReady) return null

  return (
    <div
      className={`fixed bottom-[calc(64px+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 w-[calc(100%-32px)] max-w-[608px] flex items-center justify-between gap-3 px-3 py-2.5 bg-brand-card border border-brand-border rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.15)] z-[45] animate-[sheet-in_180ms_ease-out]${needRefresh ? '' : ' justify-center border-brand-accent'}`}
    >
      {needRefresh ? (
        <>
          <span className="text-sm text-brand-heading">{tr('pwa.updateAvailable')}</span>
          <div className="flex items-center gap-1.5 shrink-0">
            <Button sm type="button" onClick={reload}>
              {tr('pwa.updateReload')}
            </Button>
            <IconButton
              type="button"
              onClick={dismissRefresh}
              aria-label={tr('common.cancel')}
            >
              <X size={16} aria-hidden="true" />
            </IconButton>
          </div>
        </>
      ) : (
        <>
          <span className="text-sm text-brand-heading">{tr('pwa.offlineReady')}</span>
          <IconButton
            type="button"
            onClick={dismissOfflineReady}
            aria-label={tr('common.cancel')}
          >
            <X size={16} aria-hidden="true" />
          </IconButton>
        </>
      )}
    </div>
  )
}