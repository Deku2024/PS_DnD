import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormBuilder, Validators, ValidatorFn, AbstractControl } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { debounceTime, Subscription } from 'rxjs';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { Dropdown } from "../../components/dropdown/dropdown";

@Component({
  selector: 'app-player-sheet',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, Dropdown],
  templateUrl: './player-sheet.html',
  styleUrl: './player-sheet.css',
})
export class PlayerSheet implements OnInit, OnDestroy {
  playerSheetForm: FormGroup;
  sessionId: string = '';
  userId: string = '';
  private db = getFirestore();
  private formSubscription?: Subscription;

  // --- OPCIONES PARA LOS DESPLEGABLES (Vuelven a estar aquí) ---
  raceOptions = [
    { value: "human", label: "Humano"}, { value: 'elf', label: 'Elfo' },
    { value: 'dwarf', label: 'Enano' }, { value: 'halfling', label: 'Mediano' },
    { value: 'dragonborn', label: 'Dracónido' }, { value: 'tiefling', label: 'Tiefling' }
  ];

  classOptions = [
    { value: 'fighter', label: 'Guerrero' }, { value: 'wizard', label: 'Mago' },
    { value: 'rogue', label: 'Pícaro' }, { value: 'cleric', label: 'Clérigo' },
    { value: 'ranger', label: 'Explorador' }, { value: 'barbarian', label: 'Bárbaro' }
  ];

  alignmentOptions = [
    { value: 'LG', label: 'Legal bueno' }, { value: 'NG', label: 'Neutral bueno' },
    { value: 'CG', label: 'Caótico bueno' }, { value: 'LN', label: 'Legal neutro' },
    { value: 'NN', label: 'Neutral neutral' }, { value: 'CN', label: 'Caótico neutral' },
    { value: 'LC', label: 'Legal caótico' }, { value: 'NC', label: 'Neutral caótico' },
    { value: 'CC', label: 'Caótico caótico' },
  ];

  constructor(private fb: FormBuilder, private route: ActivatedRoute) {
    this.playerSheetForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      age: [18, [Validators.required, Validators.min(18), Validators.max(80)]],
      experience: [0, [Validators.required, Validators.min(0), Validators.max(20)]],
      life: [10, [Validators.required, Validators.min(0)]],
      maxLife: [10, [Validators.required, Validators.min(0)]],
      tempLife: [0, [Validators.min(0)]],
      armourClass: [10, [Validators.required, Validators.min(1)]],
      race: ['human', Validators.required],
      class: ['fighter', Validators.required],
      alignment: ['NN', Validators.required],
      attributes: this.fb.group({
        strength: [10, [Validators.required, Validators.min(1), Validators.max(20)]],
        dexterity: [10, [Validators.required, Validators.min(1), Validators.max(20)]],
        constitution: [10, [Validators.required, Validators.min(1), Validators.max(20)]],
        intelligence: [10, [Validators.required, Validators.min(1), Validators.max(20)]],
        wisdom: [10, [Validators.required, Validators.min(1), Validators.max(20)]],
        charisma: [10, [Validators.required, Validators.min(1), Validators.max(20)]]
      })
    }, { validators: this.validateLifeNotExceedMax() });
  }

  ngOnInit() {
    this.sessionId = this.route.snapshot.paramMap.get('sessionId') || '';

    const auth = getAuth();
    onAuthStateChanged(auth, async (user) => {
      // Usamos el ID real o uno temporal si no hay login
      this.userId = user ? user.uid : 'jugador_manual';

      if (this.sessionId) {
        // 1. CARGAR DATOS SI EXISTEN
        const charRef = doc(this.db, `sessions/${this.sessionId}/characters/${this.userId}`);
        const snap = await getDoc(charRef);
        if (snap.exists()) {
          this.playerSheetForm.patchValue(snap.data(), { emitEvent: false });
        }
        // 2. ACTIVAR EL ESPÍA DE AUTOGUARDADO
        this.setupAutosave();
      }
    });
  }

  setupAutosave() {
    this.formSubscription = this.playerSheetForm.valueChanges
      .pipe(debounceTime(1000))
      .subscribe(async (formData) => {
        if (this.playerSheetForm.valid) {
          const charRef = doc(this.db, `sessions/${this.sessionId}/characters/${this.userId}`);
          await setDoc(charRef, formData, { merge: true });
          console.log("💾 Ficha sincronizada con Firebase");
        }
      });
  }

  // --- MÉTODOS QUE NECESITA EL HTML ---

  onSubmit() {
    console.log("Formulario enviado manualmente:", this.playerSheetForm.value);
  }

  getAttributesList() {
    return [
      { name: 'strength', label: 'Fuerza (STR)' }, { name: 'dexterity', label: 'Destreza (DEX)' },
      { name: 'constitution', label: 'Constitución (CON)' }, { name: 'intelligence', label: 'Inteligencia (INT)' },
      { name: 'wisdom', label: 'Sabiduría (WIS)' }, { name: 'charisma', label: 'Carisma (CHA)' }
    ];
  }

  validateLifeNotExceedMax(): ValidatorFn {
    return (group: AbstractControl): { [key: string]: any } | null => {
      const life = group.get('life')?.value;
      const maxLife = group.get('maxLife')?.value;
      return (life !== null && maxLife !== null && life > maxLife) ? { 'lifeExceedsMax': true } : null;
    };
  }

  ngOnDestroy() {
    this.formSubscription?.unsubscribe();
  }
}
