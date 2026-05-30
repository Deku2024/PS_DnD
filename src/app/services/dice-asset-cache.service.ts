import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class DiceAssetCacheService {
  private readonly dicePath = '/dice.png';
  private readonly cacheName = 'ps-dnd-dice-assets-v1';
  private preloadPromise: Promise<void> | null = null;
  private objectUrl: string | null = null;

  readonly diceImageUrl = signal<string>(this.dicePath);

  preloadDiceImage(): Promise<void> {
    if (this.preloadPromise) return this.preloadPromise;

    this.preloadPromise = this.loadDiceImage().catch(() => {
      this.diceImageUrl.set(this.dicePath);
    });

    return this.preloadPromise;
  }

  private async loadDiceImage(): Promise<void> {
    if (typeof window === 'undefined') return;

    const response = await this.getCachedResponse();
    const blob = await response.blob();
    const nextObjectUrl = URL.createObjectURL(blob);

    await this.decodeImage(nextObjectUrl);

    if (this.objectUrl) URL.revokeObjectURL(this.objectUrl);
    this.objectUrl = nextObjectUrl;
    this.diceImageUrl.set(nextObjectUrl);
  }

  private async getCachedResponse(): Promise<Response> {
    if (!('caches' in window)) {
      return fetch(this.dicePath, { cache: 'force-cache' });
    }

    const cache = await caches.open(this.cacheName);
    const cached = await cache.match(this.dicePath);
    if (cached) return cached;

    const response = await fetch(this.dicePath, { cache: 'force-cache' });
    if (response.ok) {
      await cache.put(this.dicePath, response.clone());
    }

    return response;
  }

  private decodeImage(src: string): Promise<void> {
    return new Promise(resolve => {
      const image = new Image();
      image.onload = () => resolve();
      image.onerror = () => resolve();
      image.src = src;
    });
  }
}
