import { useEffect } from 'react'
import { useI18n } from '../i18n'
import { usePwaUpdate } from '../lib/pwa'

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
    <div className={`update-banner${needRefresh ? ' update-banner-refresh' : ' update-banner-toast'}`}>
      {needRefresh ? (
        <>
          <span className="update-banner-text">{tr('pwa.updateAvailable')}</span>
          <div className="update-banner-actions">
            <button type="button" className="btn-sm primary" onClick={reload}>
              {tr('pwa.updateReload')}
            </button>
            <button
              type="button"
              className="icon-btn"
              onClick={dismissRefresh}
              aria-label={tr('common.cancel')}
            >
              ✕
            </button>
          </div>
        </>
      ) : (
        <>
          <span className="update-banner-text">{tr('pwa.offlineReady')}</span>
          <button
            type="button"
            className="icon-btn"
            onClick={dismissOfflineReady}
            aria-label={tr('common.cancel')}
          >
            ✕
          </button>
        </>
      )}
    </div>
  )
}