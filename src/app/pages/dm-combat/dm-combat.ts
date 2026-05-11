import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BattleService, Combatant } from '../../services/battle.service';
import { SessionService } from '../../services/sessions.service';
import { AuthService } from '../../services/auth.service';
import { CharacterService } from '../../services/character.service';
import { MonsterSearchComponent } from '../../components/monster-search.component/monster-search.component';

@Component({
  selector: 'app-dm-combat',
  imports: [CommonModule, FormsModule, MonsterSearchComponent],
  templateUrl: './dm-combat.html',
  styleUrl: './dm-combat.css',
})
export class DmCombat implements OnInit, OnDestroy {
  loading = true;
  isMaster = false;
  private unsubSession?: () => void;

  showAddMenu = false;

  // Turn tracking
  activeTurnIndex = 0;

  // Damage modal
  showDamageModal = false;
  damageTarget: Combatant | null = null;
  damageAmount = 0;
  damageError = '';
  isApplyingDamage = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private battleService: BattleService,
    private sessionService: SessionService,
    private authService: AuthService,
    private characterService: CharacterService,
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
    this.activeTurnIndex = session?.activeTurnIndex ?? 0;

    this.unsubSession = this.sessionService.listenSession(id, (s) => {
      if (!s) {
        this.router.navigate(['/home']);
        return;
      }

      if (s.status !== 'in-battle') {
        this.router.navigate(['/session', id]);
        return;
      }

      if (s.combatOrder?.length) {
        this.battleService.applySavedOrder(s.combatOrder);
      }

      const incoming = s.activeTurnIndex ?? 0;
      if (incoming !== this.activeTurnIndex) {
        this.activeTurnIndex = incoming;
      }

      this.cd.detectChanges();
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

  get currentTurnCombatant(): Combatant | null {
    return this.activeCombatants[this.activeTurnIndex] ?? null;
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

  async nextTurn(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id || !this.isMaster) return;
    const total = this.activeCombatants.length;
    if (total === 0) return;
    const next = (this.activeTurnIndex + 1) % total;
    this.activeTurnIndex = next;
    await this.sessionService.updateActiveTurn(id, next);
    this.cd.detectChanges();
  }

  openDamageModal(): void {
    this.damageTarget = null;
    this.damageAmount = 0;
    this.damageError = '';
    this.showDamageModal = true;
  }

  closeDamageModal(): void {
    this.showDamageModal = false;
    this.damageTarget = null;
    this.damageAmount = 0;
    this.damageError = '';
  }

  async confirmDamage(): Promise<void> {
    if (!this.damageTarget || this.damageAmount <= 0) {
      this.damageError = 'Selecciona un objetivo y un daño mayor que 0.';
      return;
    }
    const charId = this.damageTarget.characterId;
    // NPCs don't have a real Firestore character doc
    if (this.damageTarget.email === 'Enemigo (NPC)') {
      const target = this.battleService.combatants.find(c => c.characterId === charId);
      if (target?.character) {
        target.character.life = Math.max(0, (target.character.life ?? 0) - this.damageAmount);
      }
      this.closeDamageModal();
      this.saveOrder(); // persist updated NPC life to Firestore session
      this.cd.detectChanges();
      return;
    }
    this.isApplyingDamage = true;
    this.damageError = '';
    this.cd.detectChanges();
    try {
      await this.characterService.applyDamage(charId, this.damageAmount);
      // Refresh local combatant life
      const updated = await this.characterService.getCharacterById(charId);
      if (updated) {
        const local = this.battleService.combatants.find(c => c.characterId === charId);
        if (local) local.character = updated;
      }
      this.closeDamageModal();
    } catch (e: any) {
      this.damageError = e.message || 'Error al aplicar el daño.';
    } finally {
      this.isApplyingDamage = false;
      this.cd.detectChanges();
    }
  }

  addMonsterToBattle(monster: any) {
    const tempId = 'npc_' + Date.now();

    // Count existing instances of this monster to assign numbered names
    const existingCount = this.battleService.combatants.filter(
      c => c.email === 'Enemigo (NPC)' && c.character?.name?.startsWith(monster.name)
    ).length;
    const instanceName = existingCount === 0
      ? monster.name + ' x1'
      : monster.name + ' x' + (existingCount + 1);
    // Rename x1 on the first existing instance if this is the second
    if (existingCount === 1) {
      const first = this.battleService.combatants.find(
        c => c.email === 'Enemigo (NPC)' && c.character?.name === monster.name + ' x1'
      );
      // already named x1 — nothing to change
    }

    const newEnemy = {
      uid: tempId,
      characterId: tempId,
      email: 'Enemigo (NPC)',
      inCombat: false,
      initiative: 0,
      character: {
        name: instanceName,
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
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.battleService.saveOrder(id);
  }

  async closeCombat(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id || !this.isMaster) return;
    await this.sessionService.updateActiveTurn(id, 0);
    await this.battleService.endCombat(id);
    this.router.navigate(['/session', id]);
  }

  goBack(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.router.navigate(['/session', id]);
    else this.router.navigate(['/home']);
  }
}
