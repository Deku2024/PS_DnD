import { Injectable } from '@angular/core';
import { doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { FirebaseService } from './firebase.service';
import { GameSession } from '../models/session.model';

@Injectable({
  providedIn: 'root'
})
export class SessionService {

  private readonly COLLECTION_NAME = 'sessions';

  constructor(private firebase: FirebaseService) { }

  // 1. Función para que el DM pause o reanude la partida
  async toggleSessionPause(sessionId: string, isCurrentlyPaused: boolean): Promise<void> {
    const sessionRef = doc(this.firebase.db, this.COLLECTION_NAME, sessionId);

    try {
      await updateDoc(sessionRef, {
        isPaused: !isCurrentlyPaused
      });
      console.log(`Estado cambiado. ¿Pausada?: ${!isCurrentlyPaused}`);
    } catch (error) {
      console.error('Error al intentar cambiar el estado de la sala:', error);
      throw error;
    }
  }

  // 2. Función para escuchar el estado en tiempo real (bloqueo de jugadores)
  listenToSession(sessionId: string, onUpdate: (session: GameSession) => void) {
    const sessionRef = doc(this.firebase.db, this.COLLECTION_NAME, sessionId);

    const unsubscribe = onSnapshot(sessionRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as GameSession;
        onUpdate({ id: docSnap.id, ...data });
      } else {
        console.warn('El documento de la sesión no existe.');
      }
    });

    return unsubscribe;
  }
}
