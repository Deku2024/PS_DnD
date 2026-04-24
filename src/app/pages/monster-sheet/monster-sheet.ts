import {CommonModule} from '@angular/common';
import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { Dropdown } from '../../components/dropdown/dropdown';
import {D20RollerButtonComponent} from '../../components/d20.roller.button.component/d20.roller.button.component';
import {
  GeneralThrowsButtonComponent
} from '../../components/general.throws.button.component/general.throws.button.component';
import { MonsterService } from '../../services/monster.service';
import { InventoryItemComponent } from '../../components/inventory.component/inventory.component';
import { AbilityComponent } from '../../components/ability.component/ability.component';
import { MoneyComponent } from '../../components/money.component/money.component';

@Component({
  selector: 'app-monster-sheet',
  imports: [CommonModule, ReactiveFormsModule, Dropdown, D20RollerButtonComponent, GeneralThrowsButtonComponent, InventoryItemComponent, AbilityComponent],
  templateUrl: './monster-sheet.html',
  styleUrl: './monster-sheet.css',
})
export class MonsterSheet {
  monsterSheetForm: FormGroup;

  raceOptions = [
    { value: "Aberración", label: "Aberration" },
    { value: "Monstruosidad", label: "Monstrosity" },
    { value: "Planta", label: "Plant" },
    { value: "Humanoide", label: "Humanoid" },
    { value: "Muerto viviente", label: "Undead"},
    { value: "Infernal", label: "Fiend" },
    { value: "Gigante", label: "Giant" },
    { value: "Cieno", label: "Ooze" },
    { value: "Celestial", label: "Celestial" }
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


  constructor(private fb: FormBuilder, private monsterService: MonsterService) {
    this.monsterSheetForm = this.fb.group({
      name: ['Aragorn', [Validators.required, Validators.minLength(3)]],
      challengeValue: [5, [Validators.required, Validators.min(0)]],
      challengeXP: [110000, [Validators.required, Validators.min(1)]],
      armourClass: [9, [Validators.required, Validators.min(1)]],

      race: ['Elfo', Validators.required],
      alignment: ['Legal Bueno', Validators.required],

      attributes: this.fb.group({
        strength: [10, [Validators.required, Validators.min(1), Validators.max(20)]],
        dexterity: [10, [Validators.required, Validators.min(1), Validators.max(20)]],
        constitution: [10, [Validators.required, Validators.min(1), Validators.max(20)]],
        intelligence: [10, [Validators.required, Validators.min(1), Validators.max(20)]],
        wisdom: [10, [Validators.required, Validators.min(1), Validators.max(20)]],
        charisma: [10, [Validators.required, Validators.min(1), Validators.max(20)]]
      }),

      inventory: this.fb.array([]),
      abilities: this.fb.array([])
    });

  }

  //inventory logic

  get inventoryFormArray() : FormArray {
    return this.monsterSheetForm.get('inventory') as FormArray;
  }

  get inventoryItems(): FormGroup[] {
    return this.inventoryFormArray.controls as FormGroup[];
  }

  addItem(): void {
    this.inventoryFormArray.push(
      this.fb.group(
        {
          name: ['', Validators.required],
          quantity: [1, [Validators.required, Validators.min(1)]],
          description: ['']
        }
      )
    );
  }

  removeItem(index: number): void {
    this.inventoryFormArray.removeAt(index);
  }

  //abilities logic

  get abilitiesFormArray() : FormArray {
    return this.monsterSheetForm.get('abilities') as FormArray;
  }

  get abilities(): FormGroup[] {
    return this.abilitiesFormArray.controls as FormGroup[];
  }

  addAbility(): void {
    this.abilitiesFormArray.push(
      this.fb.group(
        {
          name: ['', Validators.required],
          description: ['', Validators.required]
        }
        )
    );
  }

  removeAbility(index: number): void {
    this.abilitiesFormArray.removeAt(index);
  }



  getFormControl(controlName: string) {
    return this.monsterSheetForm.get(controlName);
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

  protected readonly parseInt = parseInt;




}
