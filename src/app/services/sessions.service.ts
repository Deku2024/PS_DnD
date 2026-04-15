import { Injectable } from '@angular/core';
import {
  collection,
  addDoc,
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  onSnapshot,
  serverTimestamp,
  Unsubscribe
} from 'firebase/firestore';
import { FirebaseService } from './firebase.service';
import { AuthService } from './auth.service';
import { PresenceService } from './presence.service';
import { Subscription } from 'rxjs';

export interface Session {
  id?: string;
  name: string;
  masterId: string;
  players: string[];
  playerEmails: { [uid: string]: string };
  status: 'waiting' | 'active' | 'paused' | 'closed';
  password?: string;
  createdAt?: any;
}

@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly sessionsCol = 'sessions';
  private currentSessionId: string | null = null;
  private authSub: Subscription | null = null;
  private currentUserId: string | null = null;

  constructor(
    private firebase: FirebaseService,
    private authService: AuthService,
    private presenceService: PresenceService
  ) {
    // Keep track of auth state to start/stop presence when user signs in/out
    this.authSub = this.authService.onAuthState().subscribe((user) => {
      const uid = user ? user.uid : null;
      // user signed out: stop presence for previous uid
      if (!uid && this.currentUserId && this.currentSessionId) {
        this.presenceService.stopPresence(this.currentSessionId, this.currentUserId).catch(() => {});
      }
      this.currentUserId = uid;
      // user signed in: if we already have a session id, announce presence
      if (uid && this.currentSessionId) {
        this.presenceService.startPresence(this.currentSessionId, uid);
      }
    });
  }

  setCurrentSessionId(id: string | null): void {
    const prev = this.currentSessionId;
    this.currentSessionId = id;
    // If we left a previous session, stop presence for current user
    if (prev && prev !== id && this.currentUserId) {
      this.presenceService.stopPresence(prev, this.currentUserId).catch(() => {});
    }
    // If we joined a new session, start presence for current user
    if (id && this.currentUserId) {
      this.presenceService.startPresence(id, this.currentUserId);
    }
  }

  getCurrentSessionId(): string | null {
    return this.currentSessionId;
  }

  async createSession(name: string, masterId: string, masterEmail: string, password: string): Promise<string> {
    const ref = collection(this.firebase.db, this.sessionsCol);
    const docRef = await addDoc(ref, {
      name,
      masterId,
      players: [masterId],
      playerEmails: { [masterId]: masterEmail },
      status: 'waiting',
      password,
      createdAt: serverTimestamp()
    });
    this.setCurrentSessionId(docRef.id);
    return docRef.id;
  }

  async getSession(sessionId: string): Promise<Session | null> {
    const ref = doc(this.firebase.db, this.sessionsCol, sessionId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    this.setCurrentSessionId(snap.id);
    const { password, ...sessionWithoutPassword } = snap.data() as Session;
    return { id: snap.id, ...sessionWithoutPassword } as Session;
  }

  async joinSession(sessionId: string, userId: string, userEmail: string, password: string): Promise<void> {
    const ref = doc(this.firebase.db, this.sessionsCol, sessionId);
    const snap = await getDoc(ref);

    if (!snap.exists()) throw new Error('La sesión no existe.');

    const session = snap.data() as Session;

    if (session.status === 'closed') throw new Error('La sesión está cerrada.');
    if (session.players.includes(userId)) return;
    if (session.password !== password) throw new Error('Contraseña incorrecta.');

    await updateDoc(ref, {
      players: arrayUnion(userId),
      [`playerEmails.${userId}`]: userEmail
    });
  }

  listenSession(sessionId: string, callback: (session: Session | null) => void): Unsubscribe {
    const ref = doc(this.firebase.db, this.sessionsCol, sessionId);
    return onSnapshot(ref, (snap) => {
      if (!snap.exists()) {
        callback(null);
        return;
      }
      this.setCurrentSessionId(snap.id);
      const { password, ...sessionWithoutPassword } = snap.data() as Session;
      callback({ id: snap.id, ...sessionWithoutPassword } as Session);
    });
  }

  async updateStatus(sessionId: string, status: Session['status']): Promise<void> {
    const ref = doc(this.firebase.db, this.sessionsCol, sessionId);
    await updateDoc(ref, { status });
  }
}
