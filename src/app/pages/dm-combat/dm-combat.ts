import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { BattleService, Combatant } from '../../services/battle.service';
import { SessionService, Session } from '../../services/sessions.service';
import { AuthService } from '../../services/auth.service';
import { MonsterSearchComponent } from '../../components/monster-search.component/monster-search.component';
import { DmFloatingMenuComponent } from '../../components/dm-floating-menu.component/dm-floating-menu.component';
import { HistoryButtonComponent } from '../../components/history.button.component/history.button.component';
import { User } from 'firebase/auth';

@Component({
  selector: 'app-dm-combat',
  imports: [CommonModule, MonsterSearchComponent, DmFloatingMenuComponent, HistoryButtonComponent],
  templateUrl: './dm-combat.html',
  styleUrl: './dm-combat.css',
})
export class DmCombat implements OnInit, OnDestroy {
  sessionId = '';
  loading = true;
  isMaster = false;

  session: Session | null = null;
  currentUser: User | null = null;

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

    this.sessionId = id;
    this.sessionService.setCurrentSessionId(id);

    this.currentUser = await new Promise<any>(resolve =>
      this.authService.onAuthState().subscribe(u => resolve(u))
    );

    const sessionSnap = await this.sessionService.getSession(id);
    this.isMaster = sessionSnap?.masterId === this.currentUser?.uid;

    await this.battleService.startPreparingCombat();
    if (sessionSnap?.combatOrder?.length) {
      this.battleService.applySavedOrder(sessionSnap.combatOrder);
    }

    this.unsubSession = this.sessionService.listenSession(id, (s) => {
      if (!s) {
        this.router.navigate(['/home']);
        return;
      }

      this.session = s;
      this.cd.detectChanges();

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

  addMonsterToBattle(monster: any) {
    const tempId = 'npc_' + Date.now();
    const newEnemy = {
      uid: tempId,
      characterId: tempId,
      email: 'Enemigo (NPC)',
      inCombat: false,
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

    this.battleService.combatants = [...this.battleService.combatants, newEnemy];
    this.saveOrder();
    this.showAddMenu = false;
  }

  private saveOrder(): void {
    if (this.sessionId) this.battleService.saveOrder(this.sessionId);
  }

  async closeCombat(): Promise<void> {
    if (!this.sessionId || !this.isMaster) return;
    await this.battleService.endCombat(this.sessionId);
    this.router.navigate(['/session', this.sessionId]);
  }

  goBack(): void {
    if (this.sessionId) this.router.navigate(['/session', this.sessionId]);
    else this.router.navigate(['/home']);
  }

  triggerHistoryDrawer(): void {
    const historyComp = document.querySelector('history-button-component');
    if (historyComp) {
      const triggerButton = historyComp.querySelector('button, .btn') || historyComp.firstElementChild;
      if (triggerButton) {
        (triggerButton as HTMLElement).click();
      }
    }
  }
}
