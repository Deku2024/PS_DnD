import { Component, OnDestroy, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { SessionService, Session } from '../../services/sessions.service';
import { AuthService } from '../../services/auth.service';
import { CharacterService, CharacterWithId } from '../../services/character.service';
import { PresenceService } from '../../services/presence.service';
import { RollHistoryService } from '../../services/roll-history.service';
import { HistoryButtonComponent} from '../../components/history.button.component/history.button.component';
import { User } from 'firebase/auth';
import { Subscription } from 'rxjs';
import { BattleButtonComponent } from '../../components/battle.button.component/battle.button.component';

@Component({
  selector: 'app-session',
  standalone: true,
  imports: [CommonModule, BattleButtonComponent, HistoryButtonComponent],
  templateUrl: './session.html',
  styleUrl: './session.css'
})
export class SessionPage implements OnInit, OnDestroy {
  session: Session | null = null;
  currentUser: User | null = null;
  loading = true;
  showHistory = false;
  errorMsg = '';

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
    private presenceService: PresenceService,
    private rollHistoryService: RollHistoryService
) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/home']);
      return;
    }

    this.authSub = this.authService.onAuthState().subscribe(async (user) => {
      this.currentUser = user;
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

    const snap = await this.sessionService.getSession(id);
    const isDm = snap?.masterId === user.uid;

    if (!isDm) {
      const selected = snap?.selectedCharacters?.[user.uid];
      if (!selected) {
        this.router.navigate(['/choose-character'], { queryParams: { sessionId: id } });
        return;
      }
    }

    this.unsubscribe = this.sessionService.listenSession(id, async (session) => {
      this.loading = false;
      if (!session) {
        this.errorMsg = 'La sesión no existe o ha sido cerrada.';
        this.session = null;
      } else {
        // Usar this.currentUser para detectar expulsión en tiempo real
        if (this.currentUser && !session.players.includes(this.currentUser.uid)) {
          this.unsubscribe?.();
          this.presenceUnsub?.();
          this.sessionService.setCurrentSessionId(null);
          this.router.navigate(['/home']);
          return;
        }
        this.session = session;
        this.rollHistoryService.setSessionStatus(session.status);
        this.rollHistoryService.startListening(id);
        await this.loadCharacters(session);
      }
      this.cd.detectChanges();
    });

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
        if (!current || (current as CharacterWithId).id !== selectedCharId) {
          const ch = await this.characterService.getCharacterById(selectedCharId);
          this.characters[uid] = ch ?? null;
          if (this.showModal && this.modalUid === uid) {
            this.modalCharacter = this.characters[uid];
          }
          this.cd.detectChanges();
        }
      } else {
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

  async kickPlayer(uid: string): Promise<void> {
    if (!this.session?.id || !this.isMaster) return;
    try {
      await this.sessionService.kickPlayer(this.session.id, uid);
    } catch (e: any) {
      console.error('Error al expulsar jugador:', e.message);
    }
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

  goToCombat(): void {
    if (!this.session?.id) return;
    this.router.navigate(['/session', this.session.id, 'dm-combat']);
  }

  async leaveSession(): Promise<void> {
    await this.rollHistoryService.saveAndClear();
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
