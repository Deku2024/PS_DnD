import { Component, OnDestroy, OnInit, ChangeDetectorRef, ViewChild, ElementRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SessionService, Session } from '../../services/sessions.service';
import { AuthService } from '../../services/auth.service';
import { CharacterService, CharacterWithId } from '../../services/character.service';
import { PresenceService } from '../../services/presence.service';
import { RollHistoryService } from '../../services/roll-history.service';
import { HistoryButtonComponent} from '../../components/history.button.component/history.button.component';
import { CloudinaryService } from '../../services/cloudinary.service';
import { User } from 'firebase/auth';
import { Subscription } from 'rxjs';
import { BattleButtonComponent } from '../../components/battle.button.component/battle.button.component';

@Component({
  selector: 'app-session',
  standalone: true,
  imports: [CommonModule, BattleButtonComponent, HistoryButtonComponent, FormsModule],
  templateUrl: './session.html',
  styleUrl: './session.css'
})
export class SessionPage implements OnInit, OnDestroy {
  session: Session | null = null;
  currentUser: User | null = null;
  loading = true;
  showHistory = false;
  errorMsg = '';
  isUploadingImage = false;
  imageUploadError = '';
  showErrorModal = false;
  imagePreviewUrl: string | null = null;
  private pendingFile: File | null = null;
  private cloudinaryService = inject(CloudinaryService);

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  characters: { [uid: string]: CharacterWithId | null } = {};
  showModal = false;
  modalCharacter: CharacterWithId | null = null;
  modalPlayerEmail = '';
  modalUid = '';
  presenceMap: { [uid: string]: boolean } = {};

  selectedPlayerUids = new Set<string>();
  lifeAction: number = 0;
  goldAction: number = 0;
  xpAction: number = 0;
  newItemName = '';
  newItemWeight = 0;
  newItemDesc = '';

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
      if (selectedCharId) {
        const ch = await this.characterService.getCharacterById(selectedCharId);
        this.characters[uid] = ch ?? null;
      }
    }
    this.cd.detectChanges();
  }

  get isMaster(): boolean {
    return !!this.currentUser && !!this.session && this.session.masterId === this.currentUser.uid;
  }

  togglePlayerSelection(uid: string): void {
    if (this.selectedPlayerUids.has(uid)) {
      this.selectedPlayerUids.delete(uid);
    } else {
      this.selectedPlayerUids.add(uid);
    }
  }

  selectAllPlayers(): void {
    if (!this.session) return;
    const players = this.session.players.filter(uid => uid !== this.session?.masterId);
    if (this.selectedPlayerUids.size === players.length) {
      this.selectedPlayerUids.clear();
    } else {
      players.forEach(uid => this.selectedPlayerUids.add(uid));
    }
  }

  async applyBatchActions(): Promise<void> {
    if (this.selectedPlayerUids.size === 0) return;
    if (this.lifeAction === 0 && this.goldAction === 0 && this.xpAction === 0) return;

    const stats: { [key: string]: number } = {};
    if (this.lifeAction !== 0) stats['life'] = this.lifeAction;
    if (this.goldAction !== 0) stats['money.po'] = this.goldAction;
    if (this.xpAction !== 0) stats['experience'] = this.xpAction;

    for (const uid of this.selectedPlayerUids) {
      const char = this.characters[uid];
      if (char) {
        await this.characterService.updateMultipleStats(char.id, stats);
      }
    }

    this.lifeAction = 0;
    this.goldAction = 0;
    this.xpAction = 0;
    this.selectedPlayerUids.clear();
  }

  applyAddItem(): void {
    if (this.selectedPlayerUids.size === 0 || !this.newItemName) return;
    console.log('Objeto simulado:', { name: this.newItemName, weight: this.newItemWeight, desc: this.newItemDesc });
    this.newItemName = '';
    this.newItemWeight = 0;
    this.newItemDesc = '';
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

  triggerFileInput(): void {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: Event): void {
    if (!this.isMaster) return;
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (this.imagePreviewUrl) {
      URL.revokeObjectURL(this.imagePreviewUrl);
    }
    this.pendingFile = file;
    this.imagePreviewUrl = URL.createObjectURL(file);
    input.value = '';
    this.cd.detectChanges();
  }

  cancelPreview(): void {
    if (this.imagePreviewUrl) {
      URL.revokeObjectURL(this.imagePreviewUrl);
    }
    this.imagePreviewUrl = null;
    this.pendingFile = null;
    this.cd.detectChanges();
  }

  async confirmUpload(): Promise<void> {
    if (!this.session?.id || !this.pendingFile || !this.isMaster) return;

    this.isUploadingImage = true;
    this.imageUploadError = '';
    this.cd.detectChanges();

    try {
      const url = await this.cloudinaryService.uploadImage(this.pendingFile);
      await this.sessionService.updateSharedImage(this.session.id, url);
      if (this.imagePreviewUrl) URL.revokeObjectURL(this.imagePreviewUrl);
      this.imagePreviewUrl = null;
      this.pendingFile = null;
    } catch (e: any) {
      this.imageUploadError = e.message || 'Error al subir la imagen';
      this.showErrorModal = true;
    } finally {
      this.isUploadingImage = false;
      this.cd.detectChanges();
    }
  }

  closeErrorModal(): void {
    this.showErrorModal = false;
    this.imageUploadError = '';
  }

  async removeSharedImage(): Promise<void> {
    if (!this.session?.id || !this.isMaster) return;
    this.cancelPreview();
    await this.sessionService.updateSharedImage(this.session.id, null);
  }

  ngOnDestroy(): void {
    this.unsubscribe?.();
    this.authSub?.unsubscribe();
    this.presenceUnsub?.();
  }
}
