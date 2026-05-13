import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Download, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const checkInstalled = window.matchMedia('(display-mode: standalone)').matches;
    setIsInstalled(checkInstalled);

    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as unknown as { MSStream: unknown }).MSStream;
    setIsIOS(isIOSDevice);

    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed);
      if (Date.now() - dismissedTime < 7 * 24 * 60 * 60 * 1000) {
        return;
      }
    }

    // Capture the install prompt event but DON'T show the UI yet — wait until the user
    // has actually used the app (after their first successful calculation).
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const onFirstCalc = () => {
      // Only surface the prompt once the user has gotten value from the app.
      // Android: deferredPrompt will be set by the time this fires (or shortly after).
      // iOS: no native prompt event, but we can still show the "add to home screen" tip.
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('app:first-calculation', onFirstCalc);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('app:first-calculation', onFirstCalc);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  if (!showPrompt || isInstalled) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-slate-800 border border-slate-700 rounded-lg shadow-xl p-4 z-50 animate-in slide-in-from-bottom-4">
      <button 
        onClick={handleDismiss}
        className="absolute top-2 right-2 text-slate-400 hover:text-white"
        data-testid="button-dismiss-install"
      >
        <X className="h-5 w-5" />
      </button>
      
      <div className="flex items-start gap-3">
        <div className="bg-blue-500/20 p-2 rounded-lg">
          <Smartphone className="h-6 w-6 text-blue-400" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-white mb-1">Install EV Speed Optimizer</h3>
          {isIOS ? (
            <p className="text-sm text-slate-300 mb-3">
              Tap the share button <span className="inline-block px-1">⬆️</span> then "Add to Home Screen" to install this app.
            </p>
          ) : (
            <>
              <p className="text-sm text-slate-300 mb-3">
                Add to your home screen for quick access anytime, even offline.
              </p>
              <Button 
                onClick={handleInstall}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700"
                data-testid="button-install-app"
              >
                <Download className="h-4 w-4 mr-2" />
                Install App
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
