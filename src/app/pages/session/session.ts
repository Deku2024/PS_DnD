import { Component, OnDestroy, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { SessionService, Session } from '../../services/sessions.service';
import { AuthService } from '../../services/auth.service';
import { CharacterService, CharacterData } from '../../services/character.service';
import { User } from 'firebase/auth';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-session',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './session.html',
  styleUrl: './session.css'
})
export class SessionPage implements OnInit, OnDestroy {
  session: Session | null = null;
  currentUser: User | null = null;
  loading = true;
  errorMsg = '';

  // Character modal
  characters: { [uid: string]: CharacterData | null } = {};
  showModal = false;
  modalCharacter: CharacterData | null = null;
  modalPlayerEmail = '';
  modalUid = '';

  private unsubscribe?: () => void;
  private authSub?: Subscription;
  private initializing = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private sessionService: SessionService,
    private authService: AuthService,
    private characterService: CharacterService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/home']);
      return;
    }

    // Resolve auth first so the character check is never skipped due to timing
    this.authSub = this.authService.onAuthState().subscribe(async (user) => {
      this.currentUser = user;
      // Only initialise once
      if (!this.unsubscribe && !this.initializing) {
        this.initializing = true;
        await this.initSession(id, user);
      }
    });
  }

  private async initSession(id: string, user: User | null): Promise<void> {
    if (!user) {
      this.router.navigate(['/auth']);
      return;
    }

    // Peek session to determine if user is DM
    const snap = await this.sessionService.getSession(id);
    const isDm = snap?.masterId === user.uid;

    if (!isDm) {
      const has = await this.characterService.hasCharacter(user.uid, id);
      if (!has) {
        this.router.navigate(['/player-sheet'], { queryParams: { sessionId: id } });
        return;
      }
    }

    // Start real-time listener
    this.unsubscribe = this.sessionService.listenSession(id, async (session) => {
      this.loading = false;
      if (!session) {
        this.errorMsg = 'La sesión no existe o ha sido cerrada.';
        this.session = null;
      } else {
        this.session = session;
        await this.loadCharacters(session);
      }
      this.cd.detectChanges();
    });
  }

  private async loadCharacters(session: Session): Promise<void> {
    const players = session.players.filter(uid => uid !== session.masterId);
    for (const uid of players) {
      if (!(uid in this.characters)) {
        this.characters[uid] = await this.characterService.getCharacter(uid, session.id!);
        this.cd.detectChanges();
      }
    }
  }

  get isMaster(): boolean {
    return !!this.currentUser && !!this.session && this.session.masterId === this.currentUser.uid;
  }

  openModal(uid: string): void {
    if (!this.session) return;
    this.modalUid = uid;
    this.modalCharacter = this.characters[uid] ?? null;
    this.modalPlayerEmail = this.session.playerEmails[uid] || uid;
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.modalCharacter = null;
    this.modalUid = '';
  }

  editMyCharacter(): void {
    if (!this.session?.id) return;
    this.closeModal();
    this.router.navigate(['/player-sheet'], { queryParams: { sessionId: this.session.id } });
  }

  goToNotes(): void {
    if (!this.session?.id) return;
    this.sessionService.setCurrentSessionId(this.session.id);
    this.router.navigate(['/dm-notes']);
  }

  async leaveSession(): Promise<void> {
    this.unsubscribe?.();
    this.sessionService.setCurrentSessionId(null);
    this.router.navigate(['/home']);
  }

  ngOnDestroy(): void {
    this.unsubscribe?.();
    this.authSub?.unsubscribe();
  }
}
