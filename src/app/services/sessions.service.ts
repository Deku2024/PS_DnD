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

export interface Session {
  id?: string;
  name: string;
  masterId: string;
  players: string[];
  status: 'waiting' | 'active' | 'closed';
  password?: string;
  createdAt?: any;
}

@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly sessionsCol = 'sessions';

  constructor(private firebase: FirebaseService) {}

  /** Crea una nueva sesión con contraseña */
  async createSession(name: string, masterId: string, password: string): Promise<string> {
    const ref = collection(this.firebase.db, this.sessionsCol);
    const docRef = await addDoc(ref, {
      name,
      masterId,
      players: [masterId],
      status: 'waiting',
      password,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  }

  /** Obtiene una sesión por ID (sin exponer la contraseña) */
  async getSession(sessionId: string): Promise<Session | null> {
    const ref = doc(this.firebase.db, this.sessionsCol, sessionId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    const { password, ...sessionWithoutPassword } = snap.data() as Session;
    return { id: snap.id, ...sessionWithoutPassword } as Session;
  }

  /** Un jugador se une verificando la contraseña */
  async joinSession(sessionId: string, userId: string, password: string): Promise<void> {
    const ref = doc(this.firebase.db, this.sessionsCol, sessionId);
    const snap = await getDoc(ref);

    if (!snap.exists()) throw new Error('La sesión no existe.');

    const session = snap.data() as Session;

    if (session.status === 'closed') throw new Error('La sesión está cerrada.');
    if (session.players.includes(userId)) return;
    if (session.password !== password) throw new Error('Contraseña incorrecta.');

    await updateDoc(ref, {
      players: arrayUnion(userId)
    });
  }

  /** Escucha cambios en tiempo real de una sesión */
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

  /** Cambia el estado de la sesión (solo el master) */
  async updateStatus(sessionId: string, status: Session['status']): Promise<void> {
    const ref = doc(this.firebase.db, this.sessionsCol, sessionId);
    await updateDoc(ref, { status });
  }
}
