import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RaceDropdown } from './race-dropdown';

describe('RaceDropdown', () => {
  let component: RaceDropdown;
  let fixture: ComponentFixture<RaceDropdown>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RaceDropdown]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RaceDropdown);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
