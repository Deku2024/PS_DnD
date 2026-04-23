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
  query,
  where,
  getDocs,
  Unsubscribe
} from 'firebase/firestore';
import { FirebaseService } from './firebase.service';

export interface Session {
  id?: string;
  code: string;
  name: string;
  masterId: string;
  players: string[];
  playerEmails: { [uid: string]: string };
  status: 'waiting' | 'active' | 'closed';
  password?: string;
  createdAt?: any;
}

@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly sessionsCol = 'sessions';
  private currentSessionId: string | null = null;

  constructor(private firebase: FirebaseService) {}

  setCurrentSessionId(id: string | null): void {
    this.currentSessionId = id;
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
    const code = await this.generateUniqueCode();
    const ref = collection(this.firebase.db, this.sessionsCol);
    await addDoc(ref, {
      code,
      name,
      masterId,
      players: [masterId],
      playerEmails: { [masterId]: masterEmail },
      status: 'waiting',
      password,
      createdAt: serverTimestamp()
    });
    return code;
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
    if (session.players.includes(userId)) return;
    if (session.password !== password) throw new Error('Contraseña incorrecta.');

    await updateDoc(doc(this.firebase.db, this.sessionsCol, docSnap.id), {
      players: arrayUnion(userId),
      [`playerEmails.${userId}`]: userEmail
    });
  }

  listenSessionByCode(code: string, callback: (session: Session | null) => void): Unsubscribe {
    const ref = collection(this.firebase.db, this.sessionsCol);
    const q = query(ref, where('code', '==', code.toUpperCase()));
    return onSnapshot(q, (snap) => {
      if (snap.empty) {
        callback(null);
        return;
      }
      const docSnap = snap.docs[0];
      const { password, ...sessionWithoutPassword } = docSnap.data() as Session;
      callback({ id: docSnap.id, ...sessionWithoutPassword } as Session);
    });
  }

  async updateStatus(code: string, status: Session['status']): Promise<void> {
    const ref = collection(this.firebase.db, this.sessionsCol);
    const q = query(ref, where('code', '==', code.toUpperCase()));
    const snap = await getDocs(q);
    if (snap.empty) throw new Error('La sesión no existe.');
    await updateDoc(doc(this.firebase.db, this.sessionsCol, snap.docs[0].id), { status });
  }
}
