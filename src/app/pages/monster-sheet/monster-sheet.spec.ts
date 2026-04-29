import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MonsterSheet } from './monster-sheet';

describe('MonsterSheet', () => {
  let component: MonsterSheet;
  let fixture: ComponentFixture<MonsterSheet>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MonsterSheet]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MonsterSheet);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
