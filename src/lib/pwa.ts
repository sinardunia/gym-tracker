import { useEffect, useRef, useState } from 'react'
import { registerSW } from 'virtual:pwa-register'

const CHECK_INTERVAL_MS = 30 * 60 * 1000

export type PwaUpdate = {
  needRefresh: boolean
  offlineReady: boolean
  reload: () => void
  dismissRefresh: () => void
  dismissOfflineReady: () => void
}

export function usePwaUpdate(): PwaUpdate {
  const [needRefresh, setNeedRefresh] = useState(false)
  const [offlineReady, setOfflineReady] = useState(false)
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null)
  const updateSWRef = useRef<((reloadPage?: boolean) => Promise<void>) | null>(null)

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    updateSWRef.current = registerSW({
      immediate: true,
      onNeedRefresh: () => setNeedRefresh(true),
      onOfflineReady: () => setOfflineReady(true),
      onRegisteredSW: (_url, registration) => {
        registrationRef.current = registration ?? null
      },
    })

    function checkForUpdates() {
      void registrationRef.current?.update().catch(() => {})
    }

    function onVisibility() {
      if (document.visibilityState === 'visible') checkForUpdates()
    }

    document.addEventListener('visibilitychange', onVisibility)
    const timer = setInterval(checkForUpdates, CHECK_INTERVAL_MS)

    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      clearInterval(timer)
    }
  }, [])

  return {
    needRefresh,
    offlineReady,
    reload: () => void updateSWRef.current?.(true),
    dismissRefresh: () => setNeedRefresh(false),
    dismissOfflineReady: () => setOfflineReady(false),
  }
}