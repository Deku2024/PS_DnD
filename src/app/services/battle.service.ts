import {Injectable, OnInit} from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class BattleService implements OnInit {
  currentSession: string | null = null;
  status: 'not-combat' | 'preparing' | 'in-combat' | 'ended';

  private combatOrder: { [name: string]: number } = {};

  public startPreparingCombat(): void {
    this.combatOrder = {};
    for () {
      this.addToCombat(); // aqui se añade cada jugador, que luego se podrá quitar o añadir otra vez 
    }
  }

  public removeFromCombat(name: string): void {
    delete this.combatOrder[name];
  }

  public addToCombat(name: string): void {
    this.combatOrder[name] = 0;
  }

  ngOnInit(): void {
    this.status = 'not-combat'; // inicializamos el servicio sin estar en combate
  }



}
