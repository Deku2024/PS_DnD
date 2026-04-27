import {inject, Injectable} from '@angular/core';
import {SessionService} from './sessions.service';
import {CharacterService, CharacterWithId} from './character.service';
import {SheetInterface} from '../interfaces/SheetInterface';
import {DiceRollerService} from './roll-dice.service';

export interface Combatant {
  uid: string;
  email: string;
  character: CharacterWithId | null;
  inCombat: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class BattleService {
  status: 'not-combat' | 'preparing' | 'in-combat' | 'ended';
  combatants: Combatant[] = [];

  private combatOrder: { [name: string]: number } = {};
  private combatEntities: (SheetInterface | null)[] = []; // array para tener los datos de los objetos de manera centralizada para el combate

  rollerService = inject(DiceRollerService);

  constructor(private sessionService: SessionService, private characterService: CharacterService) {
    this.status = 'not-combat';
  }

  public async startPreparingCombat(): Promise<void> {
    this.combatOrder = {};
    this.combatants = [];

    const session = await this.sessionService.getSession(this.sessionService.getCurrentSessionId()!);
    if (!session) {
      console.error('No se encontró la sesión');
      return;
    }

    const players = session.players.filter(uid => uid !== session.masterId);
    for (const uid of players) {
      const charId = session.selectedCharacters?.[uid];
      if (!charId) continue;
      const email = session.playerEmails[uid] || uid;
      const character = await this.characterService.getCharacterById(<string>charId);
      this.combatants.push({ uid, email, character, inCombat: true });
      this.addToCombat(character as SheetInterface);
    }
    console.log(this.combatOrder);
  }

  public toggleCombat(combatant: Combatant): void {
    combatant.inCombat = !combatant.inCombat;
  }

  public moveUp(index: number): void {
    if (index <= 0) return;
    [this.combatants[index - 1], this.combatants[index]] =
      [this.combatants[index], this.combatants[index - 1]];
  }

  public moveDown(index: number): void {
    if (index >= this.combatants.length - 1) return;
    [this.combatants[index], this.combatants[index + 1]] =
      [this.combatants[index + 1], this.combatants[index]];
  }

  public removeFromCombat(name: string): void {
    delete this.combatOrder[name];
  }

  public addToCombat(character: SheetInterface): void {
    this.combatOrder[character.name] = this.rollerService.rollAD20(this.characterService.calculateBonus(character.attributes.dexterity)).result;
  }

}

