import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.html',
  styleUrl: './footer.css'
})
export class Footer implements OnInit, OnDestroy {
  constructor(private cd: ChangeDetectorRef) {}
  messages: string[] = [
    'Que los dados rueden a tu favor',
    'Explora, crea, juega',
    'Construye tu aventura',
    'Recuerda guardar tu progreso',
    'Que la imaginación guíe la partida',
    '¡Buena suerte, aventurero!'
  ];

  currentIndex = 0;
  displayMessage = this.messages[0];
  private intervalId: any;

  ngOnInit(): void {
    this.intervalId = setInterval(() => {
      this.currentIndex = (this.currentIndex + 1) % this.messages.length;
      this.displayMessage = this.messages[this.currentIndex];
      this.cd.detectChanges();
    }, 10000);
  }

  ngOnDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }
}
