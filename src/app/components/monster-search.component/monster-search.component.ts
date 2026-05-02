import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MonsterService, MonsterData } from '../../services/monster.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-monster-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './monster-search.component.html',
  styleUrl: './monster-search.component.css'
})
export class MonsterSearchComponent implements OnInit {
  @Output() monsterSelected = new EventEmitter<MonsterData>();

  monstersList: MonsterData[] = [];
  filteredMonsters: MonsterData[] = [];

  searchTerm: string = '';
  filterVD: number | null = null;
  sortOrder: 'asc' | 'desc' = 'asc';

  constructor(private monsterService: MonsterService,
              private authService: AuthService) {}

  ngOnInit() {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.monsterService.getMonstersList(user.uid, (monsters) => {
        this.monstersList = monsters;
        this.applyFilters();
      });
    }
  }

  applyFilters() {
    let result = [...this.monstersList];

    if (this.searchTerm && this.searchTerm.trim() !== '') {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(m =>
        (m.name && m.name.toLowerCase().includes(term)) ||
        (m.race && m.race.toLowerCase().includes(term))
      );
    }

    if (this.filterVD !== null && this.filterVD !== undefined) {
      result = result.filter(m => m.challengeValue === this.filterVD);
    }

    result.sort((a, b) => {
      const nameA = (a.name || '').toLowerCase();
      const nameB = (b.name || '').toLowerCase();

      if (this.sortOrder === 'asc') {
        return nameA < nameB ? -1 : (nameA > nameB ? 1 : 0);
      } else {
        return nameA > nameB ? -1 : (nameA < nameB ? 1 : 0);
      }
    });

    this.filteredMonsters = result;
  }

  selectMonster(monster: MonsterData) {
    this.monsterSelected.emit(monster);
  }
}
