import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-player-sheet',
  imports: [CommonModule, FormsModule],
  templateUrl: './player-sheet.html',
  styleUrl: './player-sheet.css',
})
export class PlayerSheet {
  name: string = '';
  age: number | null = null;
  race = '';
  experience: number | null = null;
  alignment = '';
  classes = '';
  life: number | null = null;
  maxLife: number | null = null;
  tempLife: number | null = null;
  armourClass: number | null = null;
  salvationThrows = '';
  inventory = '';
  classHabilities: string = '';
}
