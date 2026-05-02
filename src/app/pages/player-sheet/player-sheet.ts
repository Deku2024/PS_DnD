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
import {SessionService} from '../../services/sessions.service';
import {InventoryItemComponent} from '../../components/inventory.component/inventory.component';
import { MoneyComponent } from '../../components/money.component/money.component';
import {AbilityComponent} from '../../components/ability.component/ability.component';

@Component({
  selector: 'app-player-sheet',
  imports: [CommonModule, ReactiveFormsModule, Dropdown, D20RollerButtonComponent, ResultThrowFrameComponent, GeneralThrowsButtonComponent, InventoryItemComponent, MoneyComponent, AbilityComponent],
  templateUrl: './player-sheet.html',
  styleUrl: './player-sheet.css',
})
export class PlayerSheet implements OnInit {
  classHabilities: string = '';
  sessionId: string | null = null;
  characterId: string | null = null;
  saving = false;
  saveError = '';

  defaultImage: string = '/player-icon-example.png';
  imagePreview: string | ArrayBuffer | null = null;
  selectedFile: File | null = null;

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
    { value: 'CC', label: 'Caótico caótico' },
  ];


  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private characterService: CharacterService,
    private authService: AuthService,
    private sessionService: SessionService,
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
      money: this.fb.group({
        ppt: [0, [Validators.min(0)]],
        po:  [0, [Validators.min(0)]],
        pe:  [0, [Validators.min(0)]],
        pp:  [0, [Validators.min(0)]],
        pc:  [0, [Validators.min(0)]]
      }),
      inventory: this.fb.array([]),
      abilities: this.fb.array([]),
      image: [this.defaultImage]

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
    this.characterId = this.route.snapshot.queryParamMap.get('characterId');

    if (this.sessionId && this.characterId) {
      // Edit mode: load the specific character by id
      this.characterService.getCharacterById(this.characterId).then(character => {
        if (character) this.patchFormWithCharacter(character);
      });
    }
    // No characterId → create mode: blank form, do not pre-load
  }

  private patchFormWithCharacter(character: any): void {
    console.log(character);
    const { userId, sessionId, updatedAt, inventory, abilities, money, ...basic } = character;
    this.playerSheetForm.patchValue(basic);
    this.playerSheetForm.get('money')?.patchValue(money ?? {ppt: 0, po: 0, pe: 0, pp: 0, pc: 0});
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
      let charId: string;
      if (this.characterId) {
        // Edit mode: update existing character
        await this.characterService.updateCharacter(this.characterId, this.playerSheetForm.value);
        charId = this.characterId;
      } else {
        // Create mode: always create a new character, never overwrite
        charId = await this.characterService.createCharacter(user.uid, this.sessionId, this.playerSheetForm.value);
      }
      // Set selected character for this session
      await this.sessionService.setSelectedCharacter(this.sessionId, user.uid, charId);
      this.router.navigate(['/session', this.sessionId]);
    } catch (e: any) {
      this.saveError = 'Error al guardar el personaje. Inténtalo de nuevo.';
      console.error(e);
    } finally {
      this.saving = false;
    }
  }

  //preview de la imagen y guardado en bd
  async resizeImage(base64: string): Promise<string> {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64;

      img.onload = () => {
        const canvas = document.createElement('canvas');
        const size = 200;

        canvas.width = size;
        canvas.height = size;

        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, size, size);

        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
    });
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;

    console.log(input.files);

    if (!input.files || input.files.length === 0) {
      this.imagePreview = this.defaultImage;

      this.playerSheetForm.patchValue({
        image: this.defaultImage
      });

      this.cdr.markForCheck();
      return;
    }

    const file = input.files[0];

    if (!file.type.startsWith('image/')) {
      console.error('El archivo no es una imagen');
      return;
    }

    this.selectedFile = file;

    const reader = new FileReader();
    reader.onload = async () => {
      console.log('preview generado');
      const base64 = reader.result as string;

      const compressed = await this.resizeImage(base64);

      this.imagePreview = compressed;

      this.playerSheetForm.patchValue({
        image: compressed
      });
      this.cdr.markForCheck();
    };

    reader.readAsDataURL(file);
  }

  getFormControl(controlName: string) {
    return this.playerSheetForm.get(controlName);
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
