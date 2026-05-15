import { Component, OnDestroy, OnInit, ChangeDetectorRef, ViewChild, ElementRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { SessionService, Session, AudioState } from '../../services/sessions.service';
import { AuthService } from '../../services/auth.service';
import { CharacterService, CharacterWithId } from '../../services/character.service';
import { PresenceService } from '../../services/presence.service';
import { RollHistoryService } from '../../services/roll-history.service';
import { HistoryButtonComponent} from '../../components/history.button.component/history.button.component';
import { CloudinaryService } from '../../services/cloudinary.service';
import { HexMapComponent } from '../../components/hex-map.component/hex-map.component';
import { User } from 'firebase/auth';
import { Subscription } from 'rxjs';
import { BattleButtonComponent } from '../../components/battle.button.component/battle.button.component';
import { YouTubePlayer } from '@angular/youtube-player';

@Component({
  selector: 'app-session',
  standalone: true,
  imports: [CommonModule, FormsModule, YouTubePlayer, BattleButtonComponent, HistoryButtonComponent, HexMapComponent],
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

  // Map settings
  pendingIsMap = false;
  pendingHexSize = 40;
  pendingGridColor: string = 'blue';
  pendingCustomColor: string = '#64c8ff';
  localHexSize = 40;
  localGridColor: string = 'blue';
  localCustomColor: string = '#64c8ff';

  /** Returns false when gridColor is one of the 3 named presets */
  isPreset(color: string): boolean {
    return color === 'blue' || color === 'white' || color === 'black';
  }

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  @ViewChild('youtubePlayer') youtubePlayer?: YouTubePlayer;
  audioUrl = '';
  audioFileName = '';
  youtubeVideoId: string | undefined;
  private lastAudioState: AudioState | null = null;
  private syncThreshold = 2;

  characters: { [uid: string]: CharacterWithId | null } = {};
  showModal = false;
  modalCharacter: CharacterWithId | null = null;
  modalPlayerName = '';
  modalPlayerEmail = '';
  modalUid = '';
  presenceMap: { [uid: string]: boolean } = {};

  private unsubscribe?: () => void;
  private authSub?: Subscription;
  private initializing = false;
  private presenceUnsub?: () => void;
  private charUnsubs: { [uid: string]: () => void } = {};

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
    if (!(window as any).YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.body.appendChild(tag);
    }

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

    this.unsubscribe = this.sessionService.listenSession(id, (session) => {
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
        const isFirstLoad = !this.session;
        this.session = session;
        if (isFirstLoad && session.isMap) {
          this.localHexSize = session.hexSize ?? 40;
          this.localGridColor = session.gridColor ?? 'blue';
          if (!this.isPreset(this.localGridColor)) this.localCustomColor = this.localGridColor;
        }
        this.rollHistoryService.setSessionStatus(session.status);
        this.rollHistoryService.startListening(id);
        this.loadCharacters(session);
        this.syncAudio(session.audio ?? null);
      }
      this.cd.detectChanges();
    });

    this.presenceUnsub = this.presenceService.listenPresence(id, (map) => {
      this.presenceMap = map;
      this.cd.detectChanges();
    });
  }

  private extractYouTubeId(url: string): string | undefined {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : undefined;
  }

  onPlayerReady(event: any): void {
    event.target.unMute();
    event.target.setVolume(100);

    if (this.lastAudioState) {
      setTimeout(() => this.syncExistingPlayer(this.lastAudioState!), 100);
    }
  }

  private syncAudio(audio: AudioState | null): void {
    if (!audio) {
      this.youtubeVideoId = undefined;
      if (this.youtubePlayer && this.youtubePlayer.pauseVideo) {
        this.youtubePlayer.pauseVideo();
      }
      this.lastAudioState = null;
      return;
    }

    const newVideoId = this.extractYouTubeId(audio.url);
    const isNewVideo = !this.lastAudioState || this.lastAudioState.url !== audio.url;

    this.lastAudioState = audio;

    if (isNewVideo) {
      this.youtubeVideoId = newVideoId;
    } else {
      this.syncExistingPlayer(audio);
    }
  }

  private syncExistingPlayer(audio: AudioState): void {
    if (this.youtubePlayer && this.youtubePlayer.getPlayerState) {
      const elapsed = (Date.now() - audio.updatedAt) / 1000;
      const expectedTime = audio.currentTime + (audio.isPlaying ? elapsed : 0);
      const currentTime = this.youtubePlayer.getCurrentTime() || 0;

      if (Math.abs(currentTime - expectedTime) > this.syncThreshold) {
        this.youtubePlayer.seekTo(expectedTime, true);
      }

      const state = this.youtubePlayer.getPlayerState();
      if (audio.isPlaying && state !== 1) {
        this.youtubePlayer.playVideo();
      } else if (!audio.isPlaying && state === 1) {
        this.youtubePlayer.pauseVideo();
      }
    }
  }

  async onLoadAudio(): Promise<void> {
    if (!this.session?.id || !this.audioUrl.trim()) return;
    const fileName = this.audioFileName.trim() || 'YouTube Audio';
    await this.sessionService.setAudio(this.session.id, this.audioUrl.trim(), fileName);
    this.audioUrl = '';
    this.audioFileName = '';
  }

  async onTogglePlay(): Promise<void> {
    if (!this.session?.id || !this.session.audio) return;
    const currentTime = this.youtubePlayer?.getCurrentTime() || this.session.audio.currentTime;
    await this.sessionService.updateAudioState(
      this.session.id,
      !this.session.audio.isPlaying,
      currentTime
    );
  }

  async onClearAudio(): Promise<void> {
    if (!this.session?.id) return;
    await this.sessionService.clearAudio(this.session.id);
  }

  private loadCharacters(session: Session): void {
    const players = session.players.filter(uid => uid !== session.masterId);
    for (const uid of players) {
      const selectedCharId = session.selectedCharacters?.[uid];

      if (selectedCharId) {
        // Only set up a new listener if character ID changed or no listener exists yet
        const existing = this.characters[uid] as CharacterWithId | null;
        if (!existing || existing.id !== selectedCharId) {
          this.charUnsubs[uid]?.(); // cancel previous listener for this player
          this.charUnsubs[uid] = this.characterService.listenCharacter(selectedCharId, (ch) => {
            this.characters[uid] = ch;
            if (this.showModal && this.modalUid === uid) {
              this.modalCharacter = ch;
            }
            this.cd.detectChanges();
          });
        }
      } else {
        // No selected character — one-time load by session
        this.characterService.listCharactersByUserAndSession(uid, session.id!).then(list => {
          const ch = list.length > 0 ? list[0] : null;
          const current = this.characters[uid] as CharacterWithId | null;
          if (!current || (ch && current.id !== ch.id)) {
            this.characters[uid] = ch ?? null;
            if (this.showModal && this.modalUid === uid) {
              this.modalCharacter = this.characters[uid];
            }
            this.cd.detectChanges();
          }
        });
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
    this.modalPlayerName = this.session.playersUsernames[uid] || this.session.playerEmails[uid] || 'Jugador';    this.showModal = true;
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
    this.pendingIsMap = this.session?.isMap ?? false;
    this.pendingHexSize = this.session?.hexSize ?? 40;
    this.pendingGridColor = this.session?.gridColor ?? 'blue';
    if (!this.isPreset(this.pendingGridColor)) this.pendingCustomColor = this.pendingGridColor;
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
      await this.sessionService.updateMapSettings(
        this.session.id,
        this.pendingIsMap,
        this.pendingHexSize,
        this.pendingGridColor
      );
      this.localHexSize = this.pendingHexSize;
      this.localGridColor = this.pendingGridColor;
      if (!this.isPreset(this.pendingGridColor)) {
        this.localCustomColor = this.pendingGridColor;
      }
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

  async toggleIsMap(): Promise<void> {
    if (!this.session?.id || !this.isMaster) return;
    const newIsMap = !this.session.isMap;
    await this.sessionService.updateMapSettings(
      this.session.id,
      newIsMap,
      this.session.hexSize ?? 40,
      this.session.gridColor ?? 'blue'
    );
  }

  async applyHexSize(): Promise<void> {
    if (!this.session?.id || !this.isMaster) return;
    const size = Math.min(120, Math.max(20, this.localHexSize));
    this.localHexSize = size;
    await this.sessionService.updateMapSettings(this.session.id, true, size, this.localGridColor);
  }

  async applyGridColor(color: string): Promise<void> {
    if (!this.session?.id || !this.isMaster) return;
    this.localGridColor = color;
    if (!this.isPreset(color)) this.localCustomColor = color;
    await this.sessionService.updateMapSettings(this.session.id, true, this.localHexSize, color);
  }

  closeErrorModal(): void {
    this.showErrorModal = false;
    this.imageUploadError = '';
  }

  async removeSharedImage(): Promise<void> {
    if (!this.session?.id || !this.isMaster) return;
    this.cancelPreview();
    await this.sessionService.updateSharedImage(this.session.id, null);
    await this.sessionService.updateMapSettings(this.session.id, false, 40, 'blue');
  }

  get nonMasterPlayers(): { uid: string; username: string; avatarUrl?: string }[] {
    if (!this.session) return [];
    return this.session.players
      .filter(uid => uid !== this.session!.masterId)
      .map(uid => ({
        uid,
        username: this.session!.playersUsernames[uid] || uid,
        avatarUrl: this.characters[uid]?.image || undefined,
      }));
  }

  async onTokenMoved(event: { uid: string; row: number; col: number }): Promise<void> {
    if (!this.session?.id) return;
    const canMove = this.isMaster || event.uid === this.currentUser?.uid;
    if (!canMove) return;
    await this.sessionService.updateTokenPosition(this.session.id, event.uid, event.row, event.col);
  }

  ngOnDestroy(): void {
    this.unsubscribe?.();
    this.authSub?.unsubscribe();
    this.presenceUnsub?.();
    Object.values(this.charUnsubs).forEach(unsub => unsub());
  }
}
