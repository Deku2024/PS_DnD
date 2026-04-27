import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { BattleService, Combatant } from '../../services/battle.service';
import { SessionService } from '../../services/sessions.service';

@Component({
  selector: 'app-dm-combat',
  imports: [CommonModule],
  templateUrl: './dm-combat.html',
  styleUrl: './dm-combat.css',
})
export class DmCombat implements OnInit {
  loading = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private battleService: BattleService,
    private sessionService: SessionService
  ) {}

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) { this.router.navigate(['/home']); return; }
    this.sessionService.setCurrentSessionId(id);
    await this.battleService.startPreparingCombat();
    this.loading = false;
  }

  get combatants(): Combatant[] {
    return this.battleService.combatants;
  }

  get activeCombatants(): Combatant[] {
    return this.combatants.filter(c => c.inCombat);
  }

  toggleCombat(combatant: Combatant): void {
    this.battleService.toggleCombat(combatant);
  }

  moveUp(index: number): void {
    this.battleService.moveUp(index);
  }

  moveDown(index: number): void {
    this.battleService.moveDown(index);
  }

  goBack(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.router.navigate(['/session', id]);
    else this.router.navigate(['/home']);
  }
}
