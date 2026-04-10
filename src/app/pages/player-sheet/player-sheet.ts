import {CommonModule} from '@angular/common';
import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidatorFn,
  Validators
} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import {Dropdown} from "../../components/dropdown/dropdown";
import {D20RollerButtonComponent} from '../../components/d20.roller.button.component/d20.roller.button.component';
import {ResultThrowFrameComponent} from '../../components/result.throw.frame.component/result.throw.frame.component';
import {
  GeneralThrowsButtonComponent
} from '../../components/general.throws.button.component/general.throws.button.component';
import {CharacterService} from '../../services/character.service';
import {AuthService} from '../../services/auth.service';
import {InventoryItemComponent} from '../../components/inventory.component/inventory.component';
import {AbilityComponent} from '../../components/ability.component/ability.component';

@Component({
  selector: 'app-player-sheet',
  imports: [CommonModule, ReactiveFormsModule, Dropdown, D20RollerButtonComponent, ResultThrowFrameComponent, GeneralThrowsButtonComponent, InventoryItemComponent, AbilityComponent],
  templateUrl: './player-sheet.html',
  styleUrl: './player-sheet.css',
})
export class PlayerSheet implements OnInit {
  classHabilities: string = '';
  sessionId: string | null = null;
  saving = false;
  saveError = '';

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


  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private characterService: CharacterService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {
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
      inventory: this.fb.array([]),
      abilities: this.fb.array([])

    }, { validators: this.validateLifeNotExceedMax() });
  }

  get inventoryFormArray() : FormArray {
    return this.playerSheetForm.get('inventory') as FormArray;
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

  get abilitiesFormArray() : FormArray {
    return this.playerSheetForm.get('abilities') as FormArray;
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
    this.sessionId = this.route.snapshot.queryParamMap.get('sessionId');

    if (this.sessionId) {
      const user = this.authService.getCurrentUser();
      if (user) {
        this.characterService.getCharacter(user.uid, this.sessionId).then(character => {
          if (character) {
            console.log(character);
            // Patch the form with existing character data
            const { userId, sessionId, updatedAt, inventory, abilities, ...basic } = character;
            this.playerSheetForm.patchValue(basic);
            (inventory ?? []).forEach((item: any) => {
              this.inventoryFormArray.push(this.fb.group({
                name: [item.name, Validators.required],
                quantity: [item.quantity, [Validators.required, Validators.min(1)]],
                description: [item.description]
              }));
            });
            (abilities ?? []).forEach((ability: any) => {
              this.abilitiesFormArray.push(this.fb.group({
                name: [ability.name, Validators.required],
                description: [ability.description, Validators.required]
              }));
            });

            this.cdr.detectChanges();
          }
        });
      }
    }
  }

  async onSubmit(): Promise<void> {
    if (!this.playerSheetForm.valid) {
      console.log('Formulario inválido');
      return;
    }

    const user = this.authService.getCurrentUser();
    if (!user || !this.sessionId) {
      // No session context: just log (future: save globally)
      console.log('Formulario enviado (sin sesión):', this.playerSheetForm.value);
      return;
    }

    this.saving = true;
    this.saveError = '';
    try {
      await this.characterService.saveCharacter(user.uid, this.sessionId, this.playerSheetForm.value);
      this.router.navigate(['/session', this.sessionId]);
    } catch (e: any) {
      this.saveError = 'Error al guardar el personaje. Inténtalo de nuevo.';
      console.error(e);
    } finally {
      this.saving = false;
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

  protected readonly parseInt = parseInt; // ?? pa q sirve esto - Iván
}
