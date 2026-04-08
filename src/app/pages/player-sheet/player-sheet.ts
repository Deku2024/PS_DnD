import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormBuilder, Validators, ValidatorFn, AbstractControl, FormArray } from '@angular/forms';
import { Dropdown } from "../../components/dropdown/dropdown";

@Component({
  selector: 'app-player-sheet',
  imports: [CommonModule, ReactiveFormsModule, Dropdown],
  templateUrl: './player-sheet.html',
  styleUrl: './player-sheet.css',
})
export class PlayerSheet implements OnInit {
  classHabilities: string = '';

  playerSheetForm: FormGroup;

  raceOptions = [
    { value: "human", label: "Humano"},
    { value: 'elf', label: 'Elfo' },
    { value: 'dwarf', label: 'Enano' },
    { value: 'halfling', label: 'Mediano' },
    { value: 'dragonborn', label: 'Dracónido' },
    { value: 'tiefling', label: 'Tiefling' }
  ];

  classOptions = [
    { value: 'fighter', label: 'Guerrero' },
    { value: 'wizard', label: 'Mago' },
    { value: 'rogue', label: 'Pícaro' },
    { value: 'cleric', label: 'Clérigo' },
    { value: 'ranger', label: 'Explorador' },
    { value: 'barbarian', label: 'Bárbaro' }
  ];

  alignmentOptions = [
    { value: 'LG', label: 'Legal bueno' },
    { value: 'NG', label: 'Neutral bueno' },
    { value: 'CG', label: 'Caótico bueno' },
    { value: 'LN', label: 'Legal neutro' },
    { value: 'NN', label: 'Neutral neutral' },
    { value: 'CN', label: 'Caótico neutral' },
    { value: 'LC', label: 'Legal caótico' },
    { value: 'NC', label: 'Neutral caótico' },
    { value: 'LG', label: 'Caótico caótico' },
  ];

  constructor(private fb: FormBuilder) {
    this.playerSheetForm = this.fb.group({
      name: ['Aragorn', [Validators.required, Validators.minLength(3)]],
      age: [18, [Validators.required, Validators.min(18), Validators.max(80)]],
      experience: [5, [Validators.required, Validators.min(0), Validators.max(20)]],

      life: [30, [Validators.required, Validators.min(0)]],
      maxLife: [60, [Validators.required, Validators.min(0)]],
      tempLife: [13, [Validators.min(0)]],

      armourClass: [9, [Validators.required, Validators.min(1)]],

      race: ['Elfo', Validators.required],
      class: ['Bárbaro', Validators.required],
      alignment: ['Legal Bueno', Validators.required],

      attributes: this.fb.group({
        strength: [10, [Validators.required, Validators.min(1), Validators.max(20)]],
        dexterity: [10, [Validators.required, Validators.min(1), Validators.max(20)]],
        constitution: [10, [Validators.required, Validators.min(1), Validators.max(20)]],
        intelligence: [10, [Validators.required, Validators.min(1), Validators.max(20)]],
        wisdom: [10, [Validators.required, Validators.min(1), Validators.max(20)]],
        charisma: [10, [Validators.required, Validators.min(1), Validators.max(20)]]
      }),
      gold: [0, [Validators.min(0)]],
      inventory: this.fb.array([])

    }, { validators: this.validateLifeNotExceedMax() });
  }

  get inventoryFormArray() : FormArray {
    return this.playerSheetForm.get('inventory') as FormArray;
  }

  addItem(): void {
    const itemForm = this.fb.group({
      name: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      description: ['']
    });
    this.inventoryFormArray.push(itemForm);
  }

  removeItem(index: number): void {
    this.inventoryFormArray.removeAt(index);
  }
  validateLifeNotExceedMax(): ValidatorFn {
      return (group: AbstractControl): { [key: string]: any } | null => {
      const life = group.get('life')?.value;
      const maxLife = group.get('maxLife')?.value;

      if (life !== null && maxLife !== null && life > maxLife) {
        return { 'lifeExceedsMax': true };
      }
      return null;
    };
  }

  ngOnInit(): void {
    //  TO-DO: cargar datos guardados de la ficha si existen
    // TO-DO: escuchar cambios para autoguardar
  }

  onSubmit(): void {
    if (this.playerSheetForm.valid) {
      console.log('Formulario enviado:', this.playerSheetForm.value);
      // TO-DO: lógica de guardado de datos
    } else {
      console.log('Formulario inválido');
    }
  }

  getFormControl(controlName: string) {
    return this.playerSheetForm.get(controlName);
  }

  getAttributesList() {
  return [
    { name: 'strength', label: 'Fuerza (STR)' },
    { name: 'dexterity', label: 'Destreza (DEX)' },
    { name: 'constitution', label: 'Constitución (CON)' },
    { name: 'intelligence', label: 'Inteligencia (INT)' },
    { name: 'wisdom', label: 'Sabiduría (WIS)' },
    { name: 'charisma', label: 'Carisma (CHA)' }
  ];
}

}
