import { Component, signal, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit, OnDestroy {
  protected readonly title = signal('PS_DnD');

  protected showInstallModal = signal(false);
  private deferredPrompt: any = null;
  private beforeInstallHandler: ((e: Event) => void) | null = null;
  private mobileFallbackTimer: any = null;

  ngOnInit(): void {
    if (typeof window !== 'undefined') {
      this.beforeInstallHandler = (e: Event) => {
        try { e.preventDefault(); } catch {}
        // only show on mobile and if not already installed
        if (this.isDesktop() || this.isInstalled()) return;
        this.deferredPrompt = e;
        this.showInstallModal.set(true);
        try { document.body.classList.add('pwa-modal-open'); } catch {}
      };
      window.addEventListener('beforeinstallprompt', this.beforeInstallHandler as EventListener);

      // Mobile fallback: if beforeinstallprompt doesn't fire, show modal once on mobile (unless dismissed)
      try {
        const dismissed = localStorage.getItem('pwa-install-dismissed');
        this.mobileFallbackTimer = setTimeout(() => {
          if (!this.deferredPrompt && !this.isInstalled() && !dismissed && !this.isDesktop()) {
            this.showInstallModal.set(true);
            try { document.body.classList.add('pwa-modal-open'); } catch {}
          }
        }, 1200);
      } catch {}
    }
  }

  protected hasDeferred(): boolean { return !!this.deferredPrompt; }

  protected isInstalled(): boolean {
    try {
      return (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || (navigator as any).standalone === true;
    } catch { return false; }
  }

  protected isDesktop(): boolean {
    try { return !/Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent); } catch { return true; }
  }

  protected async installPWA(): Promise<void> {
    if (!this.deferredPrompt) return;
    try {
      // @ts-ignore
      this.deferredPrompt.prompt();
      // @ts-ignore
      const choice = await this.deferredPrompt.userChoice;
      this.showInstallModal.set(false);
      try { document.body.classList.remove('pwa-modal-open'); } catch {}
      this.deferredPrompt = null;
    } catch (err) {
      this.showInstallModal.set(false);
      try { document.body.classList.remove('pwa-modal-open'); } catch {}
      this.deferredPrompt = null;
    }
  }

  protected dismissInstall(): void {
    this.showInstallModal.set(false);
    try { document.body.classList.remove('pwa-modal-open'); } catch {}
    try { localStorage.setItem('pwa-install-dismissed', '1'); } catch {}
  }
  ngOnDestroy(): void {
    if (typeof window !== 'undefined' && this.beforeInstallHandler) {
      window.removeEventListener('beforeinstallprompt', this.beforeInstallHandler as EventListener);
    }
    try { if (this.mobileFallbackTimer) clearTimeout(this.mobileFallbackTimer); } catch {}
    try { document.body.classList.remove('pwa-modal-open'); } catch {}
  }
}
