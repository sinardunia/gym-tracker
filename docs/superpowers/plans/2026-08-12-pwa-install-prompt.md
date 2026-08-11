# PWA Install Prompt Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a dismissible, non-intrusive PWA Install Banner on `HomeScreen` following industry best practices.

**Architecture:** A standalone component `InstallPwaBanner.tsx` that listens to `beforeinstallprompt`, detects iOS Safari, verifies `standalone` mode, and tracks dismiss state in `localStorage`.

**Tech Stack:** React 19, TypeScript, Tailwind CSS / Custom CSS.

## Global Constraints
- Only show when NOT running in standalone mode.
- Respect dismiss choice stored in `localStorage` (`gym-tracker.pwa-dismissed`).

---

### Task 1: Create `InstallPwaBanner` Component

**Files:**
- Create: `src/components/InstallPwaBanner.tsx`
- Modify: `src/i18n.tsx`
- Modify: `src/App.css`

**Interfaces:**
- Produces: `<InstallPwaBanner />` component

- [ ] **Step 1: Add i18n translation keys in `src/i18n.tsx`**

Add keys:
```ts
// ID
'pwa.installTitle': 'Install Gym Tracker',
'pwa.installDesc': 'Akses cepat & 100% offline dari layar utama HP kamu.',
'pwa.installBtn': 'Install',
'pwa.iosGuide': 'Tekan ikon Bagikan (Share) lalu pilih "Tambah ke Layar Utama".',

// EN
'pwa.installTitle': 'Install Gym Tracker',
'pwa.installDesc': 'Fast access & 100% offline right from your home screen.',
'pwa.installBtn': 'Install',
'pwa.iosGuide': 'Tap the Share button then select "Add to Home Screen".',
```

- [ ] **Step 2: Create `src/components/InstallPwaBanner.tsx`**

```tsx
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
          <p>{tr('pwa.installDesc')}</p>
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
```

- [ ] **Step 3: Add CSS styling in `src/App.css`**

Add CSS for `.pwa-banner`, `.pwa-banner-content`, `.pwa-banner-actions`, `.ios-guide-text`.

- [ ] **Step 4: Commit changes**

```bash
git add src/i18n.tsx src/components/InstallPwaBanner.tsx src/App.css
git commit -m "feat: create InstallPwaBanner component with PWA detection"
```

---

### Task 2: Mount `InstallPwaBanner` on HomeScreen

**Files:**
- Modify: `src/screens/HomeScreen.tsx`

- [ ] **Step 1: Import and render `InstallPwaBanner` in `HomeScreen.tsx`**

Place `<InstallPwaBanner />` at the top of `<main className="screen">` right above the header row or active workout banner.

- [ ] **Step 2: Verify build & linting**

Run: `npx oxlint && npx tsc -b && npm run build`
Expected: PASS with 0 errors.

- [ ] **Step 3: Commit changes**

```bash
git add src/screens/HomeScreen.tsx
git commit -m "feat: display InstallPwaBanner on HomeScreen"
```
