import {Injectable} from '@angular/core';
import {SessionService} from './sessions.service';
import {CharacterService} from './character.service';
import {SheetInterface} from '../interfaces/SheetInterface';

@Injectable({
  providedIn: 'root',
})
export class BattleService {
  status: 'not-combat' | 'preparing' | 'in-combat' | 'ended';

  private combatOrder: { [name: string]: number } = {};
  private combatEntities: SheetInterface[] = []; // array para tener los datos de los objetos de manera centralizada para el combate

  constructor(private sessionService: SessionService, private characterService: CharacterService) {
    this.status = 'not-combat';
  }

  public async startPreparingCombat(): Promise<void> {
    this.combatOrder = {};
    for (let id of (await this.sessionService.getSession(this.sessionService.getCurrentSessionId()!))?.selectedCharacters || []) {
      let entity = (await this.characterService.getCharacterById(id));
      if (entity) {
        this.combatEntities.push(entity);
        this.addToCombat(entity?.name); // aqui se añade cada jugador, que luego se podrá quitar o añadir otra vez
      }
    }
  }

  public removeFromCombat(name: string): void {
    delete this.combatOrder[name];
  }

  public addToCombat(name: string | undefined): void {
    this.combatOrder[name] = 0;
  }

}
