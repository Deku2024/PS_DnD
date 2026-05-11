import { Component, signal, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd, NavigationStart, NavigationCancel, NavigationError } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Header } from './components/header/header';
import { Footer } from './components/footer/footer';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule, Header, Footer],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit, OnDestroy {
  protected readonly title = signal('Sheets & Notes');
  protected isAuthPage = signal(false);
  protected routeLoading = signal(false);
  protected loadingProgress = signal(0);

  protected showInstallModal = signal(false);
  private deferredPrompt: any = null;
  private beforeInstallHandler: ((e: Event) => void) | null = null;
  private mobileFallbackTimer: any = null;
  private progressInterval: any = null;

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.isAuthPage.set(this.router.url.startsWith('/auth'));
    this.router.events.subscribe(e => {
      if (e instanceof NavigationStart) {
        this.loadingProgress.set(0);
        this.routeLoading.set(true);
        this.startProgressSimulation();
      } else if (e instanceof NavigationEnd) {
        this.isAuthPage.set(e.urlAfterRedirects.startsWith('/auth'));
        this.finishProgress();
      } else if (e instanceof NavigationCancel || e instanceof NavigationError) {
        this.finishProgress();
      }
    });
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
    try {
      const ua = typeof navigator !== 'undefined' && navigator.userAgent ? navigator.userAgent : '';
      const isMobileUA = /Mobi|Android|iPhone|iPad|iPod/i.test(ua);
      const isTouch = typeof window !== 'undefined' && ('ontouchstart' in window || (window.matchMedia && window.matchMedia('(pointer: coarse)').matches));
      return !(isMobileUA || isTouch);
    } catch { return true; }
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

  private startProgressSimulation(): void {
    if (this.progressInterval) clearInterval(this.progressInterval);
    this.progressInterval = setInterval(() => {
      const current = this.loadingProgress();
      if (current < 80) {
        this.loadingProgress.set(Math.min(80, current + Math.random() * 4 + 1));
      } else {
        clearInterval(this.progressInterval);
        this.progressInterval = null;
      }
    }, 80);
  }

  private finishProgress(): void {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
    this.loadingProgress.set(100);
    setTimeout(() => this.routeLoading.set(false), 400);
  }

  ngOnDestroy(): void {
    if (typeof window !== 'undefined' && this.beforeInstallHandler) {
      window.removeEventListener('beforeinstallprompt', this.beforeInstallHandler as EventListener);
    }
    try { if (this.mobileFallbackTimer) clearTimeout(this.mobileFallbackTimer); } catch {}
    try { if (this.progressInterval) clearInterval(this.progressInterval); } catch {}
    try { document.body.classList.remove('pwa-modal-open'); } catch {}
  }
}
