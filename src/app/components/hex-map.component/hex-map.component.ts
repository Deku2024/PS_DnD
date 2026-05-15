import { Component, Input, OnChanges, SimpleChanges, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

interface HexCell {
  points: string;
  cx: number;
  cy: number;
  row: number;
  col: number;
}

interface PlayerToken {
  uid: string;
  cx: number;
  cy: number;
  initials: string;
  colorIndex: number;
  avatarUrl?: string;
}

const TOKEN_COLORS = [
  '#e74c3c', '#3498db', '#2ecc71', '#f39c12',
  '#9b59b6', '#1abc9c', '#e67e22', '#34495e',
];

@Component({
  selector: 'app-hex-map',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './hex-map.component.html',
  styleUrl: './hex-map.component.css',
})
export class HexMapComponent implements OnChanges {
  @Input() imageUrl!: string;
  @Input() hexSize: number = 40;
  @Input() gridColor: string = 'blue';
  @Input() players: { uid: string; username: string; avatarUrl?: string }[] = [];
  @Input() tokenPositions: { [uid: string]: { row: number; col: number } } = {};
  @Input() currentUserId: string | null = null;
  @Input() isMaster: boolean = false;

  @Output() tokenMoved = new EventEmitter<{ uid: string; row: number; col: number }>();

  imgWidth = 0;
  imgHeight = 0;
  hexes: HexCell[] = [];
  playerTokens: PlayerToken[] = [];
  selectedTokenUid: string | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['imageUrl']) {
      // Reset dimensions so the grid rebuilds when the image loads
      this.imgWidth = 0;
      this.imgHeight = 0;
      this.hexes = [];
    } else if (this.imgWidth > 0) {
      if (changes['hexSize'] || changes['players']) {
        this.buildGrid();
      } else if (changes['tokenPositions']) {
        this.rebuildTokens();
      }
    }
  }

  onImageLoad(event: Event): void {
    const img = event.target as HTMLImageElement;
    this.imgWidth = img.naturalWidth;
    this.imgHeight = img.naturalHeight;
    this.buildGrid();
  }

  private buildGrid(): void {
    const s = this.hexSize;
    const w = Math.sqrt(3) * s;
    const hexes: HexCell[] = [];

    for (let row = 0; ; row++) {
      const cy = row * (s * 1.5) + s;
      if (cy > this.imgHeight + s) break;

      const offsetX = row % 2 === 0 ? 0 : w / 2;
      for (let col = 0; ; col++) {
        const cx = col * w + offsetX + w / 2;
        if (cx > this.imgWidth + s) break;
        hexes.push({ cx, cy, row, col, points: this.hexPoints(cx, cy, s) });
      }
    }

    this.hexes = hexes;
    this.rebuildTokens();
  }

  private rebuildTokens(): void {
    const s = this.hexSize;
    const w = Math.sqrt(3) * s;
    // Default spawn: first hexes fully inside the image
    const defaults: { cx: number; cy: number }[] = [];
    for (const h of this.hexes) {
      if (defaults.length >= this.players.length) break;
      if (h.cx >= s && h.cy >= s && h.cx <= this.imgWidth - s && h.cy <= this.imgHeight - s) {
        defaults.push({ cx: h.cx, cy: h.cy });
      }
    }

    this.playerTokens = this.players.map((p, i) => {
      const stored = this.tokenPositions?.[p.uid];
      let cx: number, cy: number;
      if (stored != null) {
        cx = this.hexCx(stored.row, stored.col, s, w);
        cy = this.hexCy(stored.row, s);
      } else {
        cx = defaults[i]?.cx ?? w / 2;
        cy = defaults[i]?.cy ?? s;
      }
      return {
        uid: p.uid,
        cx,
        cy,
        initials: (p.username || '?').charAt(0).toUpperCase(),
        colorIndex: i,
        avatarUrl: p.avatarUrl || undefined,
      };
    });
  }

  private hexCx(row: number, col: number, s: number, w: number): number {
    const offsetX = row % 2 === 0 ? 0 : w / 2;
    return col * w + offsetX + w / 2;
  }

  private hexCy(row: number, s: number): number {
    return row * (s * 1.5) + s;
  }

  private hexPoints(cx: number, cy: number, size: number): string {
    const pts: string[] = [];
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i + Math.PI / 6; // pointy-top
      pts.push(`${cx + size * Math.cos(angle)},${cy + size * Math.sin(angle)}`);
    }
    return pts.join(' ');
  }

  get hexStrokeColor(): string {
    if (this.gridColor === 'white') return 'rgba(255,255,255,0.6)';
    if (this.gridColor === 'black') return 'rgba(0,0,0,0.55)';
    return 'rgba(100,200,255,0.45)';
  }

  get hexFillColor(): string {
    if (this.gridColor === 'white') return 'rgba(255,255,255,0.04)';
    if (this.gridColor === 'black') return 'rgba(0,0,0,0.04)';
    return 'rgba(100,180,255,0.04)';
  }

  getTokenColor(colorIndex: number): string {
    return TOKEN_COLORS[colorIndex % TOKEN_COLORS.length];
  }

  canSelectToken(uid: string): boolean {
    return this.isMaster || uid === this.currentUserId;
  }

  onTokenClick(uid: string, event: MouseEvent): void {
    event.stopPropagation();
    if (!this.canSelectToken(uid)) return;
    this.selectedTokenUid = this.selectedTokenUid === uid ? null : uid;
  }

  onHexClick(hex: HexCell): void {
    if (!this.selectedTokenUid) return;
    // Check the hex isn't occupied by another token
    const occupied = this.playerTokens.some(
      t => t.uid !== this.selectedTokenUid && t.cx === hex.cx && t.cy === hex.cy
    );
    if (occupied) return;
    this.tokenMoved.emit({ uid: this.selectedTokenUid, row: hex.row, col: hex.col });
    this.selectedTokenUid = null;
  }

  isHexHighlighted(hex: HexCell): boolean {
    if (!this.selectedTokenUid) return false;
    const occupied = this.playerTokens.some(
      t => t.uid !== this.selectedTokenUid && t.cx === hex.cx && t.cy === hex.cy
    );
    return !occupied;
  }
}
