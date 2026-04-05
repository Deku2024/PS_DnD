import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InventoryComp } from './inventory-comp';

describe('InventoryComp', () => {
  let component: InventoryComp;
  let fixture: ComponentFixture<InventoryComp>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InventoryComp]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InventoryComp);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
