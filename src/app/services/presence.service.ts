import { Injectable } from '@angular/core';
import { ref, onValue, set, onDisconnect } from 'firebase/database';
import { FirebaseService } from './firebase.service';

@Injectable({ providedIn: 'root' })
export class PresenceService {
  private heartbeat: any = null;

  constructor(private firebase: FirebaseService) {}

  startPresence(sessionId: string, userId: string): void {
    const db = this.firebase.rtdb;
    if (!db) return;
    const pRef = ref(db, `presence/${sessionId}/${userId}`);
    const now = Date.now();
    set(pRef, { state: 'online', lastChanged: now }).catch(() => {});
    try {
      onDisconnect(pRef).set({ state: 'offline', lastChanged: Date.now() });
    } catch (e) {
      // ignore
    }

    if (this.heartbeat) clearInterval(this.heartbeat);
    this.heartbeat = setInterval(() => {
      set(pRef, { state: 'online', lastChanged: Date.now() }).catch(() => {});
    }, 30000);
  }

  async stopPresence(sessionId: string, userId: string): Promise<void> {
    const db = this.firebase.rtdb;
    if (!db) return;
    const pRef = ref(db, `presence/${sessionId}/${userId}`);
    try {
      await onDisconnect(pRef).cancel();
    } catch (e) {
      // ignore
    }
    try {
      await set(pRef, { state: 'offline', lastChanged: Date.now() });
    } catch (e) {
      // ignore
    }
    if (this.heartbeat) {
      clearInterval(this.heartbeat);
      this.heartbeat = null;
    }
  }

  listenPresence(sessionId: string, cb: (map: { [uid: string]: boolean }) => void): () => void {
    const db = this.firebase.rtdb;
    if (!db) return () => {};
    const pRef = ref(db, `presence/${sessionId}`);
    const unsub = onValue(pRef, (snap) => {
      const val = snap.val();
      const map: { [uid: string]: boolean } = {};
      if (val) {
        Object.keys(val).forEach((uid) => {
          map[uid] = !!(val[uid] && val[uid].state === 'online');
        });
      }
      cb(map);
    });
    return () => unsub();
  }
}
