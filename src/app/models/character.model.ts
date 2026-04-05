export interface CharacterAttributes {
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
}

export interface Character {
  id?: string;
  name: string;
  age: number;
  experience: number;
  life: number;
  maxLife: number;
  tempLife: number;
  armourClass: number;
  race: string;
  class: string;
  alignment: string;
  attributes: CharacterAttributes;
  inventory: string;
  classHabilities: string;
}
