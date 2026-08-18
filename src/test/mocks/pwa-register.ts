export function registerSW(_options?: {
  immediate?: boolean
  onNeedRefresh?: () => void
  onOfflineReady?: () => void
  onRegisteredSW?: (
    _swUrl: string,
    _registration?: ServiceWorkerRegistration | undefined,
  ) => void
}): (reloadPage?: boolean) => Promise<void> {
  return () => Promise.resolve()
}