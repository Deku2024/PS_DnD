import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { CharacterService, CharacterWithId } from '../../services/character.service';
import { AuthService } from '../../services/auth.service';
import { SessionService } from '../../services/sessions.service';

@Component({
  selector: 'app-choose-character',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './choose-character.html',
  styleUrl: './choose-character.css'
})
export class ChooseCharacter implements OnInit {
  characters: CharacterWithId[] = [];
  sessionId: string | null = null;
  loading = true;
  error = '';
  private unsubscribe?: () => void;

  constructor(
    private characterService: CharacterService,
    private authService: AuthService,
    private sessionService: SessionService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.sessionId = this.route.snapshot.queryParamMap.get('sessionId');
    if (!this.sessionId) {
      this.router.navigate(['/home']);
      return;
    }
    const user = this.authService.getCurrentUser();
    if (!user) {
      this.router.navigate(['/auth']);
      return;
    }
    // Listen in realtime so UI updates when DB changes
    this.unsubscribe = this.characterService.listenCharactersByUserAndSession(user.uid, this.sessionId, (list) => {
      this.characters = list;
      this.loading = false;
      this.cdr.detectChanges();
    });
  }

  ngOnDestroy(): void {
    this.unsubscribe?.();
  }

  async selectCharacter(characterId: string) {
    if (!this.sessionId) return;
    const user = this.authService.getCurrentUser();
    if (!user) return;
    try {
      await this.sessionService.setSelectedCharacter(this.sessionId, user.uid, characterId);
      this.sessionService.setCurrentSessionId(this.sessionId);
      this.router.navigate(['/session', this.sessionId]);
    } catch (e) {
      console.error(e);
      this.error = 'Error al seleccionar personaje.';
    }
  }

  createNew() {
    this.router.navigate(['/player-sheet'], { queryParams: { sessionId: this.sessionId } });
  }
}
