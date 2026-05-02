import {CommonModule} from '@angular/common';
import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  ValidatorFn
} from '@angular/forms';
import { Dropdown } from '../../components/dropdown/dropdown';
import {D20RollerButtonComponent} from '../../components/d20.roller.button.component/d20.roller.button.component';
import {
  GeneralThrowsButtonComponent
} from '../../components/general.throws.button.component/general.throws.button.component';
import { MonsterData, MonsterService } from '../../services/monster.service';
import { InventoryItemComponent } from '../../components/inventory.component/inventory.component';
import { AbilityComponent } from '../../components/ability.component/ability.component';
import { AuthService } from '../../services/auth.service';
import { ResultThrowFrameComponent } from '../../components/result.throw.frame.component/result.throw.frame.component';
import { ActivatedRoute, Router } from '@angular/router';
import { MonsterSearchComponent } from '../../components/monster-search.component/monster-search.component';

@Component({
  selector: 'app-monster-sheet',
  imports: [CommonModule, ReactiveFormsModule, Dropdown, D20RollerButtonComponent, GeneralThrowsButtonComponent, InventoryItemComponent, AbilityComponent, ResultThrowFrameComponent, MonsterSearchComponent],
  templateUrl: './monster-sheet.html',
  styleUrl: './monster-sheet.css',
})
export class MonsterSheet implements OnInit {
  monsterSheetForm: FormGroup;
  saving = false;
  monsterId: string | null = null;
  saveError = '';

  defaultImage: string = '/monster-icon-example.png';
  imagePreview: string | ArrayBuffer | null = null;
  selectedFile: File | null = null;

  raceOptions = [
    { value: "Aberration", label: "Aberración" },
    { value: "Monstrosity", label: "Monstruosidad" },
    { value: "Plant", label: "Planta" },
    { value: "Humanoid", label: "Humanoide" },
    { value: "Undead", label: "Muerto viviente" },
    { value: "Fiend", label: "Infernal" },
    { value: "Giant", label: "Gigante" },
    { value: "Ooze", label: "Cieno" },
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


  constructor(
    private fb: FormBuilder, 
    private monsterService: MonsterService, 
    private authService: AuthService, 
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
    private router: Router)
    {

    this.monsterSheetForm = this.fb.group({
      name: ['Sauron', [Validators.required, Validators.minLength(3)]],
      challengeValue: [5, [Validators.required, Validators.min(0)]],
      challengeXP: [110000, [Validators.required, Validators.min(1)]],
      armourClass: [9, [Validators.required, Validators.min(1)]],

      race: ['Aberración', Validators.required],
      alignment: ['Caótico Caótico', Validators.required],

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
      abilities: this.fb.array([]),
      image: [this.defaultImage]
    }, { validators: this.validateLifeNotExceedMax() });

  }


  ngOnInit(): void {
    this.monsterId = this.route.snapshot.queryParamMap.get('monsterId');
    if (this.monsterId) {
      this.monsterService.getMonsterById(this.monsterId).then( monster => {
        if (monster) this.patchFormWithMonster(monster);
      });
    }
  }

  private patchFormWithMonster(monster: MonsterData) {
    this.monsterSheetForm.patchValue({
      name: monster.name,
      challengeValue: monster.challengeValue,
      challengePX: monster.challengePX,
      armourClass: monster.armourClass,
      race: monster.race,
      alignment: monster.alignment,
      life: monster.life,
      maxLife: monster.maxLife,
      tempLife: monster.tempLife,
      attributes: monster.attributes,
      image: monster.image
    });

    //load inventory
    (monster.inventory ?? []).forEach((item: any) => {
      this.inventoryFormArray.push(this.fb.group({
        name: [item.name, Validators.required],
        quantity: [item.quantity, [Validators.required, Validators.min(1)]],
        description: [item.description]
      }));
    });

    //load habilities
    (monster.abilities ?? []).forEach((ability: any) => {
      this.abilitiesFormArray.push(this.fb.group({
        name: [ability.name, Validators.required],
        description: [ability.description, Validators.required]
      }));
    });
    
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
      }

      this.router.navigate(['bestiary']);
    } catch (e: any) {
      this.saveError = 'Error al guardar el monstruo. Inténtalo de nuevo.';
      console.error(e);
    } finally {
      this.saving = false;
    }

    this.cdr.detectChanges();
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

  loadMonster(monster: any) {
    this.monsterId = monster.id;

    this.monsterSheetForm.patchValue({
      name: monster.name,
      challengeValue: monster.challengeValue,
      challengeXP: monster.challengePX || monster.challengeXP,
      armourClass: monster.armourClass,
      race: monster.race,
      alignment: monster.alignment,
      life: monster.life,
      maxLife: monster.maxLife,
      tempLife: monster.tempLife,
      attributes: monster.attributes
    });
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

      this.monsterSheetForm.patchValue({
        image: this.defaultImage
      });

      this.cdr.markForCheck();
      return;
    }

    const file = input.files[0];

    this.selectedFile = file;

    const reader = new FileReader();
    reader.onload = async () => {
      console.log('preview generado');
      const base64 = reader.result as string;

      const compressed = await this.resizeImage(base64);

      this.imagePreview = compressed;

      this.monsterSheetForm.patchValue({
        image: compressed
      });
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
