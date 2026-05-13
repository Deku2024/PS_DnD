import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { BattleService, Combatant } from '../../services/battle.service';
import { SessionService } from '../../services/sessions.service';
import { AuthService } from '../../services/auth.service';
import { MonsterSearchComponent } from '../../components/monster-search.component/monster-search.component';
import {MonsterData} from '../../services/monster.service';
import {SheetInterface} from '../../interfaces/SheetInterface';

@Component({
  selector: 'app-dm-combat',
  imports: [CommonModule, MonsterSearchComponent],
  templateUrl: './dm-combat.html',
  styleUrl: './dm-combat.css',
})
export class DmCombat implements OnInit, OnDestroy {
  loading = true;
  isMaster = false;
  private unsubSession?: () => void;

  showAddMenu = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private battleService: BattleService,
    private sessionService: SessionService,
    private authService: AuthService,
    private cd: ChangeDetectorRef
  ) {}

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) { this.router.navigate(['/home']); return; }
    this.sessionService.setCurrentSessionId(id);

    const user = await new Promise<any>(resolve =>
      this.authService.onAuthState().subscribe(u => resolve(u))
    );
    const session = await this.sessionService.getSession(id);
    this.isMaster = session?.masterId === user?.uid;

    await this.battleService.startPreparingCombat();
    if (session?.combatOrder?.length) {
      this.battleService.applySavedOrder(session.combatOrder);
    }

    this.unsubSession = this.sessionService.listenSession(id, (s) => {
      if (!s) {
        this.router.navigate(['/home']);
        return;
      }

      if (s.status !== 'in-battle') {
        this.router.navigate(['/session', id]);
        return;
      }

      if (s.combatOrder) {
        this.battleService.applySavedOrder(s.combatOrder);
        this.cd.detectChanges();
      }
    });

    this.loading = false;
    this.cd.detectChanges();
  }

  ngOnDestroy(): void {
    this.unsubSession?.();
  }

  get combatants(): Combatant[] {
    return this.battleService.combatants;
  }

  get activeCombatants(): Combatant[] {
    return this.combatants.filter(c => c.inCombat);
  }

  toggleCombat(combatant: Combatant): void {
    this.battleService.toggleCombat(combatant);
    this.saveOrder();
  }

  moveUp(index: number): void {
    this.battleService.moveUp(index);
    this.saveOrder();
  }

  moveDown(index: number): void {
    this.battleService.moveDown(index);
    this.saveOrder();
  }

  addMonsterToBattle(monster: MonsterData) {
    const tempId = 'npc_' + Date.now();
    const characterData: MonsterData = {
      userId: tempId,
      name: monster.name,
      life: 0,
      maxLife: monster.maxLife,
      tempLife: 0,
      armourClass: monster.armourClass,
      race: monster.race || 'Monstruo',
      alignment: 'Monstruo',
      attributes: monster.attributes || {
        strength: 10,
        dexterity: 10,
        constitution: 10,
        intelligence: 10,
        wisdom: 10,
        charisma: 10
      },
      inventory: [],
      abilities: [],
      image: monster.image || '',
      id: tempId,
      challengeValue: monster.challengeValue,
      challengeXP: monster.challengeXP
    };

    const newCombatant: Combatant = {
      uid: tempId,
      email: 'Enemigo (NPC)',
      username: monster.name,
      characterId: tempId,
      character: characterData,
      inCombat: true,
      initiative: 0
    };

    this.battleService.addToCombat(characterData);
    this.battleService.combatants.push(newCombatant);

    this.saveOrder();
    this.showAddMenu = false;
  }

  private saveOrder(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.battleService.saveOrder(id);
  }

  async closeCombat(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id || !this.isMaster) return;
    await this.battleService.endCombat(id);
    this.router.navigate(['/session', id]);
  }

  goBack(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.router.navigate(['/session', id]);
    else this.router.navigate(['/home']);
  }
}
