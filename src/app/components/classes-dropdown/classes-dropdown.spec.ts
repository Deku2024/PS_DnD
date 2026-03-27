import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClassesDropdown } from './classes-dropdown';

describe('ClassesDropdown', () => {
  let component: ClassesDropdown;
  let fixture: ComponentFixture<ClassesDropdown>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClassesDropdown]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClassesDropdown);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
