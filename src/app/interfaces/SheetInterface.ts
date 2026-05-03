export interface SheetInterface {
  userId: string;
  name: string;
  life: number;
  maxLife: number;
  tempLife: number;
  armourClass: number;
  race: string;
  alignment: string;
  attributes: {
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
  };
  inventory: { name: string; quantity: number; description: string }[];
  abilities: { name: string; description: string }[];
  image: string;
}
