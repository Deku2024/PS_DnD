import { ChangeDetectorRef, Component, OnInit} from '@angular/core';
import { MonsterData, MonsterService } from '../../services/monster.service';
import { AuthService } from '../../services/auth.service';
import { User } from 'firebase/auth';
import { Router } from '@angular/router';
import { MonsterSearchComponent } from '../../components/monster-search.component/monster-search.component';

@Component({
  selector: 'app-monster-page',
  imports: [MonsterSearchComponent],
  templateUrl: './monster-page.html',
  styleUrl: './monster-page.css',
})
export class MonsterPage implements OnInit {
  monsters: MonsterData[] = [];
  unsubscribe: (() => void) | undefined;
  user: User | null = null;
  isFilterOpen = false;


  constructor(private monsterService: MonsterService, private authService: AuthService, private router: Router, private ch: ChangeDetectorRef) {
     this.user = this.authService.getCurrentUser();

  }

  ngOnInit() {
    this.loadMonsters();
  }

 
  
  loadMonsters() {
      if (this.user?.uid) {
        this.unsubscribe = this.monsterService.readMonsters(
            this.user.uid,
            (monsters) => {
              this.monsters = monsters;
              this.ch.detectChanges();
            }
        )
      }
  }

  async deleteMonster(monster: MonsterData) {
    if (monster.id) {
      await this.monsterService.deleteMonster(monster.id);
    }
  }

  editMonster(monster: MonsterData) {
    this.router.navigate(['/monster-sheet'], { queryParams: {monsterId:  monster.id} });
  }

  capitalize(monsterName: string) {
      return monsterName.charAt(0).toUpperCase() + monsterName.slice(1);
  }

  goBack() {
    this.router.navigate(['/home']);
  }

  goToCreate() {
    this.router.navigate(['/monster-sheet']);
  }

  //lógica para modal en móviles
  openFilter() {
    this.isFilterOpen = true;
  }

  closeFilter() {
    this.isFilterOpen = false;
  }

}
