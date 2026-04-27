import {Injectable} from '@angular/core';
import {SessionService} from './sessions.service';
import {CharacterService} from './character.service';
import { SheetInterface } from '../interfaces/SheetInterface';

export interface Combatant {
  uid: string;
  email: string;
  characterId: string;
  character: SheetInterface | null;
  inCombat: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class BattleService {
  status: 'not-combat' | 'preparing' | 'in-combat' | 'ended';
  combatants: Combatant[] = [];

  private combatOrder: { [name: string]: number } = {};

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
      this.combatants.push({ uid, email, characterId: charId, character, inCombat: true });
    }
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

  public async saveOrder(sessionId: string): Promise<void> {
    const activeIds = this.combatants
      .filter(c => c.inCombat)
      .map(c => c.characterId);
    await this.sessionService.updateCombatOrder(sessionId, activeIds);
  }

  public applySavedOrder(savedOrder: string[]): void {
    const active = savedOrder
      .map(id => this.combatants.find(c => c.characterId === id))
      .filter((c): c is Combatant => !!c)
      .map(c => ({ ...c, inCombat: true }));
    const inactive = this.combatants.filter(c => !savedOrder.includes(c.characterId));
    this.combatants = [...active, ...inactive];
  }

  public removeFromCombat(name: string): void {
    delete this.combatOrder[name];
  }

  public addToCombat(name: string): void {
    this.combatOrder[name] = 0;
  }
}

