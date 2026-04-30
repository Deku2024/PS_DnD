import {Session, SessionService} from './sessions.service';
import {CharacterService} from './character.service';
import {SheetInterface} from '../interfaces/SheetInterface';
import {inject, Injectable} from '@angular/core';
import {DiceRollerService} from './roll-dice.service';
import {UsernameService} from './username.service';

export interface Combatant {
  uid: string;
  email: string;
  username: string;
  characterId: string;
  character: SheetInterface | null;
  inCombat: boolean;
  initiative: number;
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
  usernameService = inject(UsernameService);

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
    console.log(this.combatOrder);
    console.log(this.combatants);
  }

  private async addPlayerToCombat(session: Session, uid: string, charId: string) {
    const email = session.playerEmails[uid] || uid;
    const username = await this.usernameService.getUsernameFromEmail(email);
    const character = await this.characterService.getCharacterById(<string>charId);
    this.addToCombat(character as SheetInterface);
    this.combatants.push(
      {
        uid,
        email,
        username: username,
        characterId: charId,
        character: character,
        inCombat: true,
        initiative: this.combatOrder.get(character?.name || '') || 0
      } as Combatant
    );
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

  public addCombatantWithInitiative(newCombatant: Combatant): void {
    const dex = newCombatant.character?.attributes?.dexterity || 10;
    const bonus = this.characterService.calculateBonus(dex);
    const roll = this.rollerService.rollAD20(bonus).result;

    newCombatant.initiative = roll;

    const insertIndex = this.combatants.findIndex(c => c.initiative < newCombatant.initiative);

    if (insertIndex === -1) {
      this.combatants.push(newCombatant);
    } else {
      this.combatants.splice(insertIndex, 0, newCombatant);
    }
  }

  public async saveOrder(sessionId: string): Promise<void> {
    const activeItems = this.combatants
      .filter(c => c.inCombat)
      .map(c => {
        if (c.email === 'Enemigo (NPC)') {
          return 'NPC::' + JSON.stringify(c);
        }
        return c.characterId;
      });

    await this.sessionService.updateCombatOrder(sessionId, activeItems);
  }

  public applySavedOrder(savedOrder: string[]): void {
    const active: Combatant[] = [];
    const incomingPlayerIds: string[] = [];
    const incomingNpcIds: string[] = [];
    for (const item of savedOrder) {
      if (item.startsWith('NPC::')) {
        const npcData = JSON.parse(item.substring(5)) as Combatant;
        active.push({ ...npcData, inCombat: true });
        incomingNpcIds.push(npcData.characterId);
      } else {
        const player = this.combatants.find(c => c.characterId === item && c.email !== 'Enemigo (NPC)');
        if (player) {
          active.push({ ...player, inCombat: true });
          incomingPlayerIds.push(item);
        }
      }
    }
    const inactive = this.combatants.filter(c => {
      if (c.email === 'Enemigo (NPC)') {
        return !incomingNpcIds.includes(c.characterId);
      }
      return !incomingPlayerIds.includes(c.characterId);
    }).map(c => ({ ...c, inCombat: false }));

    this.combatants = [...active, ...inactive];
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

