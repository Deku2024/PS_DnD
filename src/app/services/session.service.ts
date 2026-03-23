import { Injectable } from '@angular/core';
import { FirebaseService } from './firebase.service';
import { doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SessionService {

  constructor(private firebase: FirebaseService) {}

  /**
   * [US-XX] Función para que el DM pause o reanude la partida.
   * Busca la campaña en Firestore y actualiza el campo isPaused.
   */
  async togglePausaSala(campanaId: string, estadoActual: boolean): Promise<void> {
    // Apuntamos al documento exacto en la base de datos usando el servicio de tus compañeros
    const salaRef = doc(this.firebase.db, 'campanas', campanaId);

    // Cambiamos el estado (de true a false, o de false a true)
    return updateDoc(salaRef, {
      isPaused: !estadoActual
    });
  }

  /**
   * [US-YY] Función para escuchar la sala en tiempo real (jugadores conectados y estado).
   * Devuelve un Observable al que la pantalla se puede suscribir.
   */
  getDatosSala(campanaId: string): Observable<any> {
    // Lo envolvemos en un Observable para mantener el mismo formato que el auth.service.ts
    return new Observable(sub => {
      const salaRef = doc(this.firebase.db, 'campanas', campanaId);

      // onSnapshot es la función de Firebase que se queda "escuchando" cambios en vivo
      const unsub = onSnapshot(salaRef, (docSnap) => {
        if (docSnap.exists()) {
          // Si hay datos, los enviamos a la pantalla
          sub.next({ id: docSnap.id, ...docSnap.data() });
        } else {
          // Si la campaña no existe, enviamos null
          sub.next(null);
        }
      }, (error) => {
        sub.error(error);
      });

      // Cuando el usuario cierre la pantalla, apagamos el "escucha" para no gastar memoria
      return () => unsub();
    });
  }
}
