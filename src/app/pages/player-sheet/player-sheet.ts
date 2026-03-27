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
  age: number = 0;
  race = '';
  experience: number = 0;
  alignment = '';
  classes = '';
  life: number = 0;
  maxLife: number = 0;
  tempLife: number = 0;
  armourClass: number = 0;
  salvationThrows = '';
  inventory = '';
  classHabilities: string = '';
}
