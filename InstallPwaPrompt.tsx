import React, { useState, useEffect } from "react"
import { Download, X } from "lucide-react"

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>
}

export const InstallPwaPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isDismissed, setIsDismissed] = useState<boolean>(() => {
    return sessionStorage.getItem("kiranatrack_pwa_dismissed") === "true"
  })

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }

    window.addEventListener("beforeinstallprompt", handler)

    // Check if app is already running in standalone mode
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setDeferredPrompt(null)
    }

    return () => window.removeEventListener("beforeinstallprompt", handler)
  }, [])

  if (!deferredPrompt || isDismissed) {
    return null
  }

  const handleInstallClick = async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === "accepted") {
      setDeferredPrompt(null)
    }
  }

  const handleDismiss = () => {
    setIsDismissed(true)
    sessionStorage.setItem("kiranatrack_pwa_dismissed", "true")
  }

  return (
    <div className="flex items-center gap-1.5 bg-primary/10 text-primary border border-primary/20 px-2.5 py-1 rounded-lg text-xs font-semibold animate-in fade-in slide-in-from-top-1 duration-200">
      <button
        type="button"
        onClick={handleInstallClick}
        className="flex items-center gap-1.5 hover:underline"
        title="Install KiranaTrack to your desktop or mobile device"
      >
        <Download className="w-3.5 h-3.5 shrink-0" />
        <span>Install App</span>
      </button>
      <button
        type="button"
        onClick={handleDismiss}
        className="text-primary/70 hover:text-primary p-0.5 rounded ml-1"
        aria-label="Dismiss install prompt"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  )
}
