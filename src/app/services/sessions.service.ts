import {Injectable} from '@angular/core';
import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  arrayRemove,
  onSnapshot,
  query,
  serverTimestamp,
  Unsubscribe,
  updateDoc,
  where
} from 'firebase/firestore';
import * as bcrypt from 'bcryptjs';
import { FirebaseService } from './firebase.service';
import { AuthService } from './auth.service';
import { PresenceService } from './presence.service';
import { Subscription } from 'rxjs';
import {UsernameService} from './username.service';

export interface Session {
  id?: string;
  code: string;
  name: string;
  masterId: string;
  players: string[];
  playerEmails: { [uid: string]: string };
  playersUsernames: { [uid: string]: string };
  selectedCharacters?: { [uid: string]: string | null };
  combatOrder?: string[];
  status: 'waiting' | 'active' | 'paused' | 'closed' | 'in-battle';
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
    private presenceService: PresenceService,
    private usernameService: UsernameService,
  ) {
    this.authSub = this.authService.onAuthState().subscribe((user) => {
      const uid = user ? user.uid : null;
      if (!uid && this.currentUserId && this.currentSessionId) {
        this.presenceService.stopPresence(this.currentSessionId, this.currentUserId).catch(() => {});
      }
      this.currentUserId = uid;
      if (uid && this.currentSessionId) {
        this.presenceService.startPresence(this.currentSessionId, uid);
      }
    });
  }

  setCurrentSessionId(id: string | null): void {
    const prev = this.currentSessionId;
    this.currentSessionId = id;
    if (prev && prev !== id && this.currentUserId) {
      this.presenceService.stopPresence(prev, this.currentUserId).catch(() => {});
    }
    if (id && this.currentUserId) {
      this.presenceService.startPresence(id, this.currentUserId);
    }
  }

    getCurrentSessionId(): string | null {
    return this.currentSessionId;
  }

  private generateCode(): string {
    const chars = '123456789';
    return Array.from({ length: 6 }, () =>
      chars[Math.floor(Math.random() * chars.length)]
    ).join('');
  }

  private async isCodeTaken(code: string): Promise<boolean> {
    const ref = collection(this.firebase.db, this.sessionsCol);
    const q = query(ref, where('code', '==', code));
    const snap = await getDocs(q);
    return !snap.empty;
  }

  private async generateUniqueCode(): Promise<string> {
    let code = this.generateCode();
    while (await this.isCodeTaken(code)) {
      code = this.generateCode();
    }
    return code;
  }

  async createSession(name: string, masterId: string, masterEmail: string, password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const code = await this.generateUniqueCode();
    const ref = collection(this.firebase.db, this.sessionsCol);
    const masterUsername = await this.usernameService.getUsernameFromEmail(masterEmail);
    const docRef = await addDoc(ref, {
      code,
      name,
      masterId,
      players: [masterId],
      playerEmails: { [masterId]: masterEmail },
      playersUsernames: { [masterId]: masterUsername },
      selectedCharacters: {},
      status: 'waiting',
      password: passwordHash,
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

  async getSessionByCode(code: string): Promise<Session | null> {
    const ref = collection(this.firebase.db, this.sessionsCol);
    const q = query(ref, where('code', '==', code.toUpperCase()));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const docSnap = snap.docs[0];
    const { password, ...sessionWithoutPassword } = docSnap.data() as Session;
    return { id: docSnap.id, ...sessionWithoutPassword } as Session;
  }

  async joinSession(code: string, userId: string, userEmail: string, password: string): Promise<void> {
    const ref = collection(this.firebase.db, this.sessionsCol);
    const q = query(ref, where('code', '==', code.toUpperCase()));
    const snap = await getDocs(q);

    if (snap.empty) throw new Error('La sesión no existe.');

    const docSnap = snap.docs[0];
    const session = docSnap.data() as Session;

    if (session.status === 'closed') throw new Error('La sesión está cerrada.');
    if (session.players.includes(userId)) {
      this.setCurrentSessionId(docSnap.id);
      return;
    }

    const passwordMatch = await bcrypt.compare(password, session.password || '');
    if (!passwordMatch) throw new Error('Contraseña incorrecta.');

    await updateDoc(doc(this.firebase.db, this.sessionsCol, docSnap.id), {
      players: arrayUnion(userId),
      [`playersUsernames.${userId}`]: await this.usernameService.getUsernameFromEmail(userEmail) || "",
      [`playerEmails.${userId}`]: userEmail
    });
    this.setCurrentSessionId(docSnap.id);
  }

  async kickPlayer(sessionId: string, userId: string): Promise<void> {
    const ref = doc(this.firebase.db, this.sessionsCol, sessionId);
    const snap = await getDoc(ref);

    if (!snap.exists()) throw new Error('La sesión no existe.');

    const session = snap.data() as Session;

    if (session.masterId === userId) throw new Error('No puedes expulsar al master.');

    const updates: any = {
      players: arrayRemove(userId),
      [`playerEmails.${userId}`]: null,
    };

    if (session.selectedCharacters?.[userId] !== undefined) {
      updates[`selectedCharacters.${userId}`] = null;
    }

    await updateDoc(ref, updates);
    await this.presenceService.stopPresence(sessionId, userId).catch(() => {});
  }

  listenSession(sessionId: string, callback: (session: Session | null) => void): Unsubscribe {
    const ref = doc(this.firebase.db, this.sessionsCol, sessionId);
    return onSnapshot(ref, (snap) => {
      if (!snap.exists()) {
        callback(null);
        return;
      }
      const { password, ...sessionWithoutPassword } = snap.data() as Session;
      callback({ id: snap.id, ...sessionWithoutPassword } as Session);
    });
  }

  async updateCombatOrder(sessionId: string, order: string[]): Promise<void> {
    const ref = doc(this.firebase.db, this.sessionsCol, sessionId);
    await updateDoc(ref, { combatOrder: order });
  }

  async updateStatus(sessionId: string, status: Session['status']): Promise<void> {
    const ref = doc(this.firebase.db, this.sessionsCol, sessionId);
    await updateDoc(ref, { status });
  }

  async setSelectedCharacter(sessionId: string, userId: string, characterId: string | null): Promise<void> {
    const ref = doc(this.firebase.db, this.sessionsCol, sessionId);
    await updateDoc(ref, { [`selectedCharacters.${userId}`]: characterId });
  }

  async getSessionsByPlayer(userId: string): Promise<Session[]> {
    const ref = collection(this.firebase.db, this.sessionsCol);
    const q = query(ref, where('players', 'array-contains', userId));
    const snap = await getDocs(q);
    return snap.docs.map(d => {
      const { password, ...data } = d.data() as Session;
      return { id: d.id, ...data } as Session;
    });
  }
}
