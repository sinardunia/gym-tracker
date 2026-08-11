# PWA Install Prompt Design Spec

## Overview
Add a non-intrusive, dismissible PWA install banner at the top of `HomeScreen` (Option A) following PWA best practices:
1. Hide automatically when already running in `standalone` mode or if dismissed by user (persisted in `localStorage`).
2. Listen for native browser `beforeinstallprompt` event (Android / Desktop Chrome / Edge) for 1-click install.
3. Show iOS Safari step-by-step instructions ("Tap Share button -> Add to Home Screen") on iOS devices.

## Requirements & Behavior

- **Standalone Check**: `window.matchMedia('(display-mode: standalone)').matches` or `navigator.standalone === true`.
- **Dismiss Storage**: If dismissed, set `gym-tracker.pwa-dismissed = 'true'`.
- **Native Prompt Handler**:
  - Intercept `beforeinstallprompt`, call `preventDefault()`, save `deferredPrompt`.
  - When user clicks "Install", invoke `deferredPrompt.prompt()` and clear `deferredPrompt`.
- **iOS Detection**: `/iPhone|iPad|iPod/.test(navigator.userAgent) && !window.MSStream`.
- **UI Location**: Top of `HomeScreen.tsx`, right above or below the header row.

## Verification
- Clean build using `npx oxlint && npx tsc -b && npm run build`.
