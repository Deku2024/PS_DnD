import { Component, signal, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('PS_DnD');

  protected showInstallModal = signal(false);
  private deferredPrompt: any = null;

  ngOnInit(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeinstallprompt', (e: Event) => {
        e.preventDefault();
        this.deferredPrompt = e;
        this.showInstallModal.set(true);
      });
    }
  }

  protected async installPWA(): Promise<void> {
    if (!this.deferredPrompt) return;
    try {
      // @ts-ignore
      this.deferredPrompt.prompt();
      // @ts-ignore
      const choice = await this.deferredPrompt.userChoice;
      this.showInstallModal.set(false);
      this.deferredPrompt = null;
    } catch (err) {
      this.showInstallModal.set(false);
      this.deferredPrompt = null;
    }
  }

  protected dismissInstall(): void {
    this.showInstallModal.set(false);
  }
}
