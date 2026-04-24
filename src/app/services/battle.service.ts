import {Injectable} from '@angular/core';
import {SessionService} from './sessions.service';
import {CharacterService, CharacterWithId} from './character.service';
import {SheetInterface} from '../interfaces/SheetInterface';

@Injectable({
  providedIn: 'root',
})
export class BattleService {
  status: 'not-combat' | 'preparing' | 'in-combat' | 'ended';

  private combatOrder: { [name: string]: number } = {};
  private combatEntities: (CharacterWithId | null)[] = []; // array para tener los datos de los objetos de manera centralizada para el combate

  constructor(private sessionService: SessionService, private characterService: CharacterService) {
    this.status = 'not-combat';
  }

  public async startPreparingCombat(): Promise<void> {
    this.combatOrder = {};

    let selectedCharacters = (await this.sessionService.getSession(this.sessionService.getCurrentSessionId()!))?.selectedCharacters;

    if (!selectedCharacters) {
      console.error('No hay personajes creados');
      return;
    }

    for (let [uid, cid] of Object.entries(selectedCharacters)) {
      let entity = await this.characterService.getCharacterById(<string>cid);
      this.combatEntities.push(entity);
    }
  }

  public removeFromCombat(name: string): void {
    delete this.combatOrder[name];
  }

  public addToCombat(name: string): void {
    this.combatOrder[name] = 0;
  }

}
