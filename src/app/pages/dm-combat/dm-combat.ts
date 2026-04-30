import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { BattleService, Combatant } from '../../services/battle.service';
import { SessionService } from '../../services/sessions.service';
import { AuthService } from '../../services/auth.service';
import { MonsterSearchComponent } from '../../components/monster-search.component/monster-search.component';

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
      if (s?.combatOrder) {
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

  addMonsterToBattle(monster: any) {
    const tempId = 'npc_' + Date.now();
    const newEnemy = {
      uid: tempId,
      characterId: tempId,
      email: 'Enemigo (NPC)',
      inCombat: true,
      initiative: 0,
      character: {
        name: monster.name,
        race: monster.race || 'Monstruo',
        life: monster.life,
        maxLife: monster.maxLife,
        armourClass: monster.armourClass,
        attributes: monster.attributes || { dexterity: 10 }
      }
    } as unknown as Combatant;

    this.battleService.addCombatantWithInitiative(newEnemy);
    this.battleService.combatants = [...this.battleService.combatants];
    this.saveOrder();
    this.showAddMenu = false;
  }

  private saveOrder(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.battleService.saveOrder(id);
  }

  goBack(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.router.navigate(['/session', id]);
    else this.router.navigate(['/home']);
  }
}
