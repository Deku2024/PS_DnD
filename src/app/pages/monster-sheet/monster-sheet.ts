import {CommonModule} from '@angular/common';
import {ChangeDetectorRef, Component} from '@angular/core';
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
import { AuthService } from '../../services/auth.service';
import { ResultThrowFrameComponent } from '../../components/result.throw.frame.component/result.throw.frame.component';

@Component({
  selector: 'app-monster-sheet',
  imports: [CommonModule, ReactiveFormsModule, Dropdown, D20RollerButtonComponent, GeneralThrowsButtonComponent, InventoryItemComponent, AbilityComponent, ResultThrowFrameComponent],
  templateUrl: './monster-sheet.html',
  styleUrl: './monster-sheet.css',
})
export class MonsterSheet {
  monsterSheetForm: FormGroup;
  saving = false;
  monsterId = "";
  saveError = '';

  imagePreview: string | ArrayBuffer | null = null;
  selectedFile: File | null = null;

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
    { value: 'CC', label: 'Caótico caótico' },
  ];


  constructor(private fb: FormBuilder, private monsterService: MonsterService, private authService: AuthService, private cdr: ChangeDetectorRef) {
    this.monsterSheetForm = this.fb.group({
      name: ['Aragorn', [Validators.required, Validators.minLength(3)]],
      challengeValue: [5, [Validators.required, Validators.min(0)]],
      challengeXP: [110000, [Validators.required, Validators.min(1)]],
      armourClass: [9, [Validators.required, Validators.min(1)]],

      race: ['Elfo', Validators.required],
      alignment: ['Legal Bueno', Validators.required],

      life: [30, [Validators.required, Validators.min(0)]],
      maxLife: [60, [Validators.required, Validators.min(0)]],
      tempLife: [13, [Validators.min(0)]],

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

  async onSubmit() {
    const user = this.authService.getCurrentUser();

    if (!this.monsterSheetForm.valid) {
      console.log('Formulario inválido');
      return;
    }

    if (!user) {
      console.log('Formulario enviado (sin sesión):', this.monsterSheetForm.value);
      return;
    }

    this.saving = true;
    this.saveError = '';
    try {
      let monsterId: string;
      if (this.monsterId) {
        await this.monsterService.updateMonster(this.monsterId, this.monsterSheetForm.value);
        monsterId = this.monsterId;
      } else {
        await this.monsterService.createMonster(user.uid, this.monsterSheetForm.value);
        monsterId = this.monsterId;
      }
    } catch (e: any) {
      this.saveError = 'Error al guardar el monstruo. Inténtalo de nuevo.';
      console.error(e);
    } finally {
      this.saving = false;
    }

    this.cdr.detectChanges();
  }
  

  //preview de la imagen

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;

    console.log(input.files);

    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];

    if (!file.type.startsWith('image/')) {
      console.error('El archivo no es una imagen');
      return;
    }

    this.selectedFile = file;

    const reader = new FileReader();
    reader.onload = () => {
      console.log('preview generado');
      this.imagePreview = reader.result;
      this.cdr.markForCheck();
    };

    reader.readAsDataURL(file);
  }

  getFormControl(controlName: string) {
    return this.monsterSheetForm.get(controlName);
  }

   private attributes_list = [
      { name: 'strength', label: 'Fuerza (STR)' },
      { name: 'dexterity', label: 'Destreza (DEX)' },
      { name: 'constitution', label: 'Constitución (CON)' },
      { name: 'intelligence', label: 'Inteligencia (INT)' },
      { name: 'wisdom', label: 'Sabiduría (WIS)' },
      { name: 'charisma', label: 'Carisma (CHA)' }
    ];

  getAttributesList() {
    return this.attributes_list;
  }

  protected readonly parseInt = parseInt;




}
