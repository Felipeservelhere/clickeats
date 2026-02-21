import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download, CheckCircle, Smartphone, Monitor, Info } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;

// Capture the event globally
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
  });
}

const AppInstall = () => {
  const [canInstall, setCanInstall] = useState(!!deferredPrompt);
  const [isInstalled, setIsInstalled] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      deferredPrompt = e as BeforeInstallPromptEvent;
      setCanInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setCanInstall(false);
      deferredPrompt = null;
    });

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    setInstalling(true);
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setCanInstall(false);
      }
    } catch (err) {
      console.error('Install error:', err);
    }
    setInstalling(false);
    deferredPrompt = null;
  };

  return (
    <div className="p-4 max-w-lg mx-auto space-y-6">
      <h1 className="font-heading font-bold text-2xl">Instalar Aplicativo</h1>

      {isInstalled ? (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/10 border border-primary/20">
          <CheckCircle className="h-8 w-8 text-primary shrink-0" />
          <div>
            <p className="font-semibold text-primary">Aplicativo instalado!</p>
            <p className="text-sm text-muted-foreground">O Clickeats já está instalado no seu dispositivo.</p>
          </div>
        </div>
      ) : canInstall ? (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 rounded-xl bg-secondary/50 border border-border">
            <Download className="h-8 w-8 text-primary shrink-0" />
            <div>
              <p className="font-semibold">Pronto para instalar</p>
              <p className="text-sm text-muted-foreground">Instale o Clickeats para acesso rápido direto da sua tela inicial.</p>
            </div>
          </div>
          <Button onClick={handleInstall} disabled={installing} className="w-full h-12 text-base font-semibold gap-2">
            <Download className="h-5 w-5" />
            {installing ? 'Instalando...' : 'Instalar Aplicativo'}
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-secondary/50 border border-border">
          <Info className="h-8 w-8 text-muted-foreground shrink-0" />
          <div>
            <p className="font-semibold">Instalação não disponível</p>
            <p className="text-sm text-muted-foreground">Use o Chrome ou Edge para instalar o app.</p>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <h2 className="font-heading font-semibold text-lg">Como instalar manualmente</h2>

        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30 border border-border">
            <Smartphone className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm">No celular (Chrome)</p>
              <ol className="text-xs text-muted-foreground space-y-1 mt-1 list-decimal list-inside">
                <li>Toque no menu (⋮) do Chrome</li>
                <li>Toque em "Instalar aplicativo" ou "Adicionar à tela inicial"</li>
                <li>Confirme a instalação</li>
              </ol>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30 border border-border">
            <Monitor className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm">No computador (Chrome/Edge)</p>
              <ol className="text-xs text-muted-foreground space-y-1 mt-1 list-decimal list-inside">
                <li>Clique no ícone de instalação (⊕) na barra de endereço</li>
                <li>Ou vá em Menu → "Instalar Clickeats..."</li>
                <li>Confirme a instalação</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppInstall;
