import { inject, Injectable } from '@angular/core';
import { collection, addDoc, serverTimestamp, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { DiceRollerService, ThrowsResult } from './roll-dice.service';
import { SessionService } from './sessions.service';
import { AuthService } from './auth.service';
import { FirebaseService } from './firebase.service';
import { RollHistoryEntry } from '../models/roll-history.model';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class RollHistoryService {
  private diceService = inject(DiceRollerService);
  private sessionService = inject(SessionService);
  private authService = inject(AuthService);
  private firebase = inject(FirebaseService);

  private rollsBuffer: RollHistoryEntry[] = [];

  constructor() {
    this.diceService.lastResult$.subscribe(result => {
      this.bufferRoll(result);
    });
  }

  private bufferRoll(result: ThrowsResult) {
    const user = this.authService.getCurrentUser();
    const entry: RollHistoryEntry = {
      userId: user?.uid || 'unknown',
      userName: user?.email || 'Anónimo',
      timestamp: Date.now(),
      data: result
    };
    this.rollsBuffer.push(entry);
    console.log('Tirada capturada en el historial temporal:', entry);
  }

  // --- CORREGIDO: Cierre de llaves y paréntesis ---
  getHistoryBySession(sessionId: string): Observable<any[]> {
    const historyRef = collection(this.firebase.db, 'roll_histories');
    const q = query(
      historyRef,
      where('sessionId', '==', sessionId),
      orderBy('finalizedAt', 'desc')
    );

    return new Observable(subscriber => {
      return onSnapshot(q, (snapshot) => {
        const history = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        subscriber.next(history);
      });
    });
  }

  async saveHistoryToFirebase(): Promise<void> {
    const sessionId = this.sessionService.getCurrentSessionId();

    if (this.rollsBuffer.length === 0) {
      console.log('US-34: Histórico vacío. Omitiendo guardado en BD.');
      return;
    }

    if (!sessionId) return;

    try {
      const historyCol = collection(this.firebase.db, 'roll_histories');
      await addDoc(historyCol, {
        sessionId: sessionId,
        rolls: this.rollsBuffer,
        finalizedAt: serverTimestamp()
      });
      console.log('US-34: Historial guardado con éxito.');
      this.rollsBuffer = [];
    } catch (error) {
      console.error('Error al guardar el historial:', error);
    }
  }
}
