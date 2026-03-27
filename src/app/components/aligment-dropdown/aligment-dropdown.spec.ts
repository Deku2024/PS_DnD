import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AligmentDropdown } from './aligment-dropdown';

describe('AligmentDropdown', () => {
  let component: AligmentDropdown;
  let fixture: ComponentFixture<AligmentDropdown>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AligmentDropdown]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AligmentDropdown);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
