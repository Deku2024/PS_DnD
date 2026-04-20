import { Component, OnDestroy, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { SessionService, Session } from '../../services/sessions.service';
import { AuthService } from '../../services/auth.service';
import { CharacterService, CharacterData, CharacterWithId } from '../../services/character.service';
import { PresenceService } from '../../services/presence.service';
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
  characters: { [uid: string]: CharacterWithId | null } = {};
  showModal = false;
  modalCharacter: CharacterWithId | null = null;
  modalPlayerEmail = '';
  modalUid = '';
  presenceMap: { [uid: string]: boolean } = {};

  private unsubscribe?: () => void;
  private authSub?: Subscription;
  private initializing = false;
  private presenceUnsub?: () => void;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private sessionService: SessionService,
    private authService: AuthService,
    private characterService: CharacterService,
    private cd: ChangeDetectorRef,
    private presenceService: PresenceService
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
      const selected = snap?.selectedCharacters?.[user.uid];
      // Require explicit selection: if there is no selected character entry for this user, force choose-character
      if (!selected) {
        this.router.navigate(['/choose-character'], { queryParams: { sessionId: id } });
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

    // Start presence listener and announce current user as online
    this.presenceUnsub = this.presenceService.listenPresence(id, (map) => {
      this.presenceMap = map;
      this.cd.detectChanges();
    });
  }

  private async loadCharacters(session: Session): Promise<void> {
    const players = session.players.filter(uid => uid !== session.masterId);
    for (const uid of players) {
      const selectedCharId = session.selectedCharacters?.[uid];
      const current = this.characters[uid] ?? null;

      if (selectedCharId) {
        // If selected character changed (or not loaded yet), fetch it
        if (!current || (current && (current as CharacterWithId).id !== selectedCharId)) {
          const ch = await this.characterService.getCharacterById(selectedCharId);
          this.characters[uid] = ch ?? null;
          // If modal is open for this uid, refresh modalCharacter as well
          if (this.showModal && this.modalUid === uid) {
            this.modalCharacter = this.characters[uid];
          }
          this.cd.detectChanges();
        }
      } else {
        // No selectedCharacters entry yet: take the first character for user+session if any
        const list = await this.characterService.listCharactersByUserAndSession(uid, session.id!);
        const ch = list.length > 0 ? list[0] : null;
        if (!current || (ch && (current as CharacterWithId).id !== ch.id)) {
          this.characters[uid] = ch ?? null;
          if (this.showModal && this.modalUid === uid) {
            this.modalCharacter = this.characters[uid];
          }
          this.cd.detectChanges();
        }
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
    if (!this.session?.id || !this.currentUser) return;
    this.closeModal();
    const myUid = this.currentUser.uid;
    const selected = this.session?.selectedCharacters?.[myUid];
    this.router.navigate(['/player-sheet'], { queryParams: { sessionId: this.session.id, characterId: selected } });
  }

  changeMyCharacter(): void {
    if (!this.session?.id || !this.currentUser) return;
    this.closeModal();
    this.router.navigate(['/choose-character'], { queryParams: { sessionId: this.session.id } });
  }

  async toggleSessionStatus(): Promise<void> {
    if (!this.session?.id) return;
    const nextStatus = (this.session.status === 'paused' || this.session.status === 'waiting') ? 'active' : 'paused';
    await this.sessionService.updateStatus(this.session.id, nextStatus);
  }

  goToNotes(): void {
    if (!this.session?.id) return;
    this.sessionService.setCurrentSessionId(this.session.id);
    this.router.navigate(['/dm-notes'], { queryParams: { sessionId: this.session.id } });
  }

  async leaveSession(): Promise<void> {
    this.unsubscribe?.();
    this.presenceUnsub?.();
    this.sessionService.setCurrentSessionId(null);
    this.router.navigate(['/home']);
  }

  ngOnDestroy(): void {
    this.unsubscribe?.();
    this.authSub?.unsubscribe();
    this.presenceUnsub?.();
  }
}
