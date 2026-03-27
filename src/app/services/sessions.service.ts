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
  Unsubscribe
} from 'firebase/firestore';
import { FirebaseService } from './firebase.service';

export interface Session {
  id?: string;
  name: string;
  masterId: string;
  players: string[];       // array de UIDs
status: 'waiting' | 'active' | 'closed';
  createdAt?: any;
}

@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly sessionsCol = 'sessions';

constructor(private firebase: FirebaseService) {}

  /** Crea una nueva sesión y devuelve su ID */
  async createSession(name: string, masterId: string): Promise<string> {
  const ref = collection(this.firebase.db, this.sessionsCol);
  const docRef = await addDoc(ref, {
  name,
  masterId,
  players: [masterId],   // el master ya es jugador
  status: 'waiting',
  createdAt: serverTimestamp()
} as Session);
return docRef.id;
}

  /** Obtiene una sesión por ID (lectura puntual) */
  async getSession(sessionId: string): Promise<Session | null> {
  const ref = doc(this.firebase.db, this.sessionsCol, sessionId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Session;
}

  /** Un jugador se une a la sesión por ID */
  async joinSession(sessionId: string, userId: string): Promise<void> {
  const ref = doc(this.firebase.db, this.sessionsCol, sessionId);
  const snap = await getDoc(ref);

  if (!snap.exists()) throw new Error('La sesión no existe.');

  const session = snap.data() as Session;
  if (session.status === 'closed') throw new Error('La sesión está cerrada.');
  if (session.players.includes(userId)) return; // ya está en la sesión

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
callback({ id: snap.id, ...snap.data() } as Session);
});
}

  /** Cambia el estado de la sesión (solo el master debería llamar esto) */
  async updateStatus(sessionId: string, status: Session['status']): Promise<void> {
  const ref = doc(this.firebase.db, this.sessionsCol, sessionId);
  await updateDoc(ref, { status });
}
}
