import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DmCombat } from './dm-combat';

describe('DmCombat', () => {
  let component: DmCombat;
  let fixture: ComponentFixture<DmCombat>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DmCombat]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DmCombat);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
