import { Injectable } from '@angular/core';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { FirebaseService } from './firebase.service';
import { Character } from '../models/character.model';

@Injectable({
  providedIn: 'root'
})
export class CharacterService {

  constructor(private firebase: FirebaseService) { }

  /**
   * Genera la ruta exacta donde se guardará la ficha: sessions/{ID}/characters/{USER_ID}
   */
  private getCharacterRef(sessionId: string, userId: string) {
    return doc(this.firebase.db, `sessions/${sessionId}/characters/${userId}`);
  }

  /**
   * Recupera la ficha de la base de datos (Si el jugador ya tenía una creada)
   */
  async getCharacter(sessionId: string, userId: string): Promise<Character | null> {
    const charRef = this.getCharacterRef(sessionId, userId);
    const snap = await getDoc(charRef);

    if (snap.exists()) {
      return snap.data() as Character;
    }
    return null;
  }

  /**
   * Guarda o actualiza la ficha. Con { merge: true } solo sobrescribe los campos que le pasemos, sin borrar el resto.
   */
  async saveCharacter(sessionId: string, userId: string, characterData: Partial<Character>): Promise<void> {
    const charRef = this.getCharacterRef(sessionId, userId);

    try {
      await setDoc(charRef, characterData, { merge: true });
      console.log('Ficha guardada correctamente en Firestore.');
    } catch (error) {
      console.error('Error al guardar la ficha:', error);
      throw error;
    }
  }

  /**
   * Crea una ficha por defecto cuando un jugador entra por primera vez a la sesión
   */
  async createDefaultCharacter(sessionId: string, userId: string): Promise<Character> {
    const defaultCharacter: Character = {
      name: 'Aventurero Desconocido',
      age: 18,
      experience: 0,
      life: 10,
      maxLife: 10,
      tempLife: 0,
      armourClass: 10,
      race: 'human',
      class: 'fighter',
      alignment: 'NN',
      attributes: {
        strength: 10, dexterity: 10, constitution: 10,
        intelligence: 10, wisdom: 10, charisma: 10
      },
      inventory: '',
      classHabilities: ''
    };

    await this.saveCharacter(sessionId, userId, defaultCharacter);
    return defaultCharacter;
  }
}
