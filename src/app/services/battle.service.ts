import {inject, Injectable} from '@angular/core';
import {Session, SessionService} from './sessions.service';
import {CharacterService, CharacterWithId} from './character.service';
import {SheetInterface} from '../interfaces/SheetInterface';
import {DiceRollerService} from './roll-dice.service';

export interface Combatant {
  uid: string;
  email: string;
  character: SheetInterface | null;
  inCombat: boolean;
  intiative: number;
}

@Injectable({
  providedIn: 'root',
})
export class BattleService {
  status: 'not-combat' | 'preparing' | 'in-combat' | 'ended';
  combatants: Combatant[] = [];

  private combatOrder = new Map<string, number>();
  private combatEntities: (SheetInterface | null)[] = []; // array para tener los datos de los objetos de manera centralizada para el combate

  rollerService = inject(DiceRollerService);

  constructor(private sessionService: SessionService, private characterService: CharacterService) {
    this.status = 'not-combat';
  }

  public async startPreparingCombat(): Promise<void> {
    this.combatOrder = new Map<string, number>();
    this.combatants = [];

    const session = await this.sessionService.getSession(this.sessionService.getCurrentSessionId()!);
    if (!session) {
      console.error('No se encontró la sesión');
      return;
    }
    await this.autoStartCombatOrder(session).then(() => this.autoOrder());
  }

  private async autoStartCombatOrder(session: Session) {
    const players = session.players.filter(uid => uid !== session.masterId);
    for (const uid of players) {
      const charId = session.selectedCharacters?.[uid];
      if (!charId) continue;
      await this.addPlayerToCombat(session, uid, charId);
    }
    console.log(this.combatOrder)
  }

  private async addPlayerToCombat(session: Session, uid: string, charId: string) {
    const email = session.playerEmails[uid] || uid;
    const character = await this.characterService.getCharacterById(<string>charId);
    this.combatants.push(
      {uid, email, character, inCombat: true, intiative: this.combatOrder.get(character?.name || '') || 0}
    );
    this.addToCombat(character as SheetInterface);
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
    this.combatOrder.delete(name);
  }

  public addToCombat(character: SheetInterface): void {
    this.combatOrder.set(character.name, this.rollerService.rollAD20(this.characterService.calculateBonus(character.attributes.dexterity)).result);
  }

  private autoOrder(): void {
    this.combatants.sort((a, b) => {
      const initiativeA = this.combatOrder.get(a.character?.name || '') || 0;
      const initiativeB = this.combatOrder.get(b.character?.name || '') || 0;
      return initiativeB - initiativeA;
    });
  }
}

