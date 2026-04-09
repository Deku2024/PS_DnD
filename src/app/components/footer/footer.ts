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
    'Recuerda: guarda tu progreso',
    'Que la imaginación guíe la partida',
    '¡Buena suerte, aventurero!',
    'Recuerda: dos piezas de oro son mejor que una, salvo si es platino...',
    '"Bri-Yark-Yark-Bins" - un goblin friki... o tartamudo',
    'No te fies de esos pequeños y malvados goblins, te robarán todo el oro',
    '¿Qué es eso? Un pájaro. No...es un dragón rojo',
    'Lanza los dados del destino de tu personaje',
    'Las trampas pueden ser mortales, búscalas cuando te adentres en mazmorras',
    'No te va a dejar la espada gratis porque se lo hayas pedido con ojitos',
    '"Raaaargh" - un osolechuza',
    'Recuerda: tómate un descanso de vez en cuando',
    'Recuerda: huir te hará un cobarde pero no harás un personaje nuevo',
    'Recuerda: en la mesa no solo juegas tú, juegan todos. ¡Ayúdalos!',
    'Vigila al pícaro, antes de que eche a la guardia encima por un poco de oro',
    'El curandero del grupo NO es tu niñera, sé responsable',
    'El DM no es tu enemigo... o si',
    'El DM es un jugador más, lúcete para su diversión',
    'No intentes robar el protagonismo de un compañero',
    'Recuerda: al hechicero no le importa el tamaño de la sala',
    'A veces, un plan es mejor que cargar de frente',
    'Acumula muchos tesoros y riquezas, para que no mendigues espadas luego',
    'No trates de regatear dos piezas de oro, no merece la pena'
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
